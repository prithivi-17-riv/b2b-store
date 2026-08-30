import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { numberToIndianWords } from '@/lib/gst';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes, vehicleNumber, deliveryEmployeeId, expectedDeliveryDate } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        customer: true,
        invoice: true,
        delivery: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const prevStatus = order.status;

    // Role-based validations
    if (status === 'APPROVED' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can approve orders' }, { status: 403 });
    }

    // Process status transitions
    if (status === 'APPROVED' || status === 'STOCK_RESERVED') {
      // Reserve inventory stock for warehouse
      for (const item of order.items) {
        const stock = await prisma.inventoryStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: order.warehouseId,
              productId: item.productId,
            },
          },
        });

        if (stock) {
          const reserveQty = Math.min(stock.availableQuantity, item.quantity);
          await prisma.inventoryStock.update({
            where: { id: stock.id },
            data: {
              availableQuantity: { decrement: reserveQty },
              reservedQuantity: { increment: reserveQty },
            },
          });

          await prisma.stockMovement.create({
            data: {
              warehouseId: order.warehouseId,
              productId: item.productId,
              movementType: 'ORDER_RESERVED',
              quantity: reserveQty,
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              performedByUserId: authUser.id,
              notes: `Stock reserved for order ${order.orderNumber}`,
            },
          });
        }
      }
    }

    if (status === 'DISPATCHED') {
      // 1. Stock deducted from reserved to dispatched
      for (const item of order.items) {
        const stock = await prisma.inventoryStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: order.warehouseId,
              productId: item.productId,
            },
          },
        });

        if (stock) {
          await prisma.inventoryStock.update({
            where: { id: stock.id },
            data: {
              reservedQuantity: { decrement: Math.min(stock.reservedQuantity, item.quantity) },
              dispatchedQuantity: { increment: item.quantity },
            },
          });

          await prisma.stockMovement.create({
            data: {
              warehouseId: order.warehouseId,
              productId: item.productId,
              movementType: 'ORDER_DISPATCH',
              quantity: item.quantity,
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              performedByUserId: authUser.id,
              notes: `Order ${order.orderNumber} dispatched from warehouse`,
            },
          });
        }
      }

      // 2. Ensure Delivery record exists
      if (!order.delivery) {
        await prisma.delivery.create({
          data: {
            orderId: order.id,
            invoiceId: order.invoice?.id || null,
            deliveryEmployeeId: deliveryEmployeeId || null,
            vehicleNumber: vehicleNumber || 'TN 38 BJ 4590',
            dispatchTimestamp: new Date(),
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'DISPATCHED',
            proofOfDeliveryNotes: notes || null,
          },
        });
      } else {
        await prisma.delivery.update({
          where: { id: order.delivery.id },
          data: {
            status: 'DISPATCHED',
            dispatchTimestamp: new Date(),
            vehicleNumber: vehicleNumber || order.delivery.vehicleNumber,
            deliveryEmployeeId: deliveryEmployeeId || order.delivery.deliveryEmployeeId,
          },
        });
      }

      // 3. Auto-generate GST Tax Invoice if not yet generated
      if (!order.invoice) {
        await generateInvoiceForOrder(order.id, authUser.id);
      }
    }

    if (status === 'DELIVERED') {
      if (order.delivery) {
        await prisma.delivery.update({
          where: { id: order.delivery.id },
          data: {
            status: 'DELIVERED',
            actualDeliveryDate: new Date(),
            proofOfDeliveryNotes: notes || order.delivery.proofOfDeliveryNotes,
          },
        });
      }
    }

    if (status === 'CANCELLED' || status === 'REJECTED') {
      // Release any reserved stock
      if (prevStatus === 'STOCK_RESERVED' || prevStatus === 'PICKING' || prevStatus === 'PACKED') {
        for (const item of order.items) {
          const stock = await prisma.inventoryStock.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: order.warehouseId,
                productId: item.productId,
              },
            },
          });
          if (stock && stock.reservedQuantity > 0) {
            const releaseQty = Math.min(stock.reservedQuantity, item.quantity);
            await prisma.inventoryStock.update({
              where: { id: stock.id },
              data: {
                reservedQuantity: { decrement: releaseQty },
                availableQuantity: { increment: releaseQty },
              },
            });
          }
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes ? (order.notes ? `${order.notes}\n[${status}]: ${notes}` : notes) : order.notes,
      },
      include: {
        customer: true,
        invoice: true,
        delivery: true,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: `ORDER_STATUS_${status}`,
      entityType: 'ORDER',
      entityId: order.id,
      oldValues: { status: prevStatus },
      newValues: { status, notes },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}

async function generateInvoiceForOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true, invoice: true },
  });

  if (!order || order.invoice) return;

  const company = await prisma.companyProfile.findFirst();
  const invoiceCount = await prisma.invoice.count();
  const invoiceNumber = `${company?.invoicePrefix || 'INV-2026-'}${String((company?.invoiceNextNumber || 1000) + invoiceCount + 1)}`;

  const isInterstate = (company?.stateCode || '33').trim() !== (order.customer.stateCode || '33').trim();
  const dueDate = new Date(Date.now() + (order.customer.paymentTermsDays || 15) * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      invoiceDate: new Date(),
      dueDate,
      placeOfSupplyStateCode: order.customer.stateCode || '33',
      isInterstate,
      billingAddress: order.customer.billingAddress,
      shippingAddress: order.customer.deliveryAddress,
      customerGstin: order.customer.gstin,
      taxableAmount: order.taxableAmount,
      cgstAmount: order.cgstAmount,
      sgstAmount: order.sgstAmount,
      igstAmount: order.igstAmount,
      cessAmount: order.cessAmount,
      roundOff: order.roundOff,
      grandTotal: order.grandTotal,
      amountInWords: numberToIndianWords(order.grandTotal),
      paidAmount: 0,
      balanceAmount: order.grandTotal,
      paymentStatus: 'UNPAID',
      items: {
        create: order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          hsnCode: item.hsnCode,
          uom: item.uom,
          quantity: item.quantity,
          unitRate: item.unitRate,
          taxableAmount: item.taxableAmount,
          gstRate: item.gstRate,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          totalAmount: item.totalAmount,
        })),
      },
    },
  });

  // Update Customer Ledger & Outstanding
  const newOutstanding = order.customer.currentOutstanding + order.grandTotal;

  await prisma.customerLedger.create({
    data: {
      customerId: order.customerId,
      transactionDate: new Date(),
      type: 'INVOICE',
      referenceId: invoice.id,
      referenceNumber: invoice.invoiceNumber,
      debitAmount: order.grandTotal,
      creditAmount: 0,
      runningBalance: newOutstanding,
      notes: `Tax Invoice for order ${order.orderNumber}`,
    },
  });

  await prisma.customer.update({
    where: { id: order.customerId },
    data: { currentOutstanding: newOutstanding },
  });

  await createAuditLog({
    userId,
    action: 'GENERATE_INVOICE',
    entityType: 'INVOICE',
    entityId: invoice.id,
    newValues: { invoiceNumber, grandTotal: invoice.grandTotal },
  });

  return invoice;
}
