import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { calculateOrderTaxes, numberToIndianWords } from '@/lib/gst';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const employeeId = searchParams.get('employeeId');
    const query = searchParams.get('q') || '';

    const whereClause: any = {};

    if (authUser?.role === 'SALES_EMPLOYEE') {
      whereClause.salesEmployeeId = authUser.id;
    } else if (employeeId) {
      whereClause.salesEmployeeId = employeeId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (query) {
      whereClause.OR = [
        { orderNumber: { contains: query } },
        { customer: { storeName: { contains: query } } },
        { customer: { customerCode: { contains: query } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            storeName: true,
            ownerName: true,
            phone: true,
            city: true,
            gstin: true,
            currentOutstanding: true,
            creditLimit: true,
          },
        },
        salesEmployee: {
          select: { id: true, name: true, email: true },
        },
        priceCategory: true,
        warehouse: true,
        invoice: {
          select: { id: true, invoiceNumber: true, paymentStatus: true, grandTotal: true },
        },
        delivery: {
          select: { id: true, status: true, vehicleNumber: true, actualDeliveryDate: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      priceCategoryId,
      warehouseId,
      items, // Array of { productId, quantity, discountPercent }
      orderDiscountAmount,
      isDraft,
      notes,
      overrideCreditLimit,
    } = body;

    if (!customerId || !priceCategoryId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer, price category, and at least one line item are required' }, { status: 400 });
    }

    // 1. Fetch Company Settings (for seller state code)
    const company = await prisma.companyProfile.findFirst();
    const sellerStateCode = company?.stateCode || '33';

    // 2. Fetch Customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.isActive) {
      return NextResponse.json({ error: 'Customer not found or inactive' }, { status: 400 });
    }

    // 3. Fetch Selected Warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true } });
      if (!defaultWh) {
        return NextResponse.json({ error: 'No active warehouse found' }, { status: 400 });
      }
      targetWarehouseId = defaultWh.id;
    }

    // 4. Fetch Products & Prices
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        prices: {
          where: { priceCategoryId },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 5. Construct line items with rates from the selected Price Category
    const lineItemInputs = items.map((item: any) => {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new Error(`Product ID ${item.productId} not found`);
      }

      // Check if price category price exists; fallback to MRP
      const catPriceRecord = prod.prices.find((pr) => pr.priceCategoryId === priceCategoryId);
      const unitRate = catPriceRecord ? catPriceRecord.price : prod.mrp;

      return {
        productId: prod.id,
        productName: prod.name,
        hsnCode: prod.hsnCode,
        uom: prod.uom,
        quantity: Number(item.quantity || 1),
        unitRate: Number(unitRate),
        discountPercent: Number(item.discountPercent || 0),
        gstRate: Number(prod.gstRate || 0),
        cessRate: Number(prod.cessRate || 0),
      };
    });

    // 6. Run GST and tax calculations
    const calcSummary = calculateOrderTaxes(
      lineItemInputs,
      sellerStateCode,
      customer.stateCode || '33',
      Number(orderDiscountAmount || 0)
    );

    // 7. Generate Order Number
    const orderCount = await prisma.order.count();
    const orderNumber = `${company?.orderPrefix || 'ORD-2026-'}${String((company?.orderNextNumber || 5000) + orderCount + 1)}`;

    const initialStatus = isDraft ? 'DRAFT' : 'CONFIRMED';

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        salesEmployeeId: authUser.id,
        priceCategoryId,
        warehouseId: targetWarehouseId,
        status: initialStatus,
        orderDate: new Date(),
        itemCount: calcSummary.itemCount,
        totalQuantity: calcSummary.totalQuantity,
        subtotal: calcSummary.subtotal,
        discountAmount: calcSummary.discountAmount,
        taxableAmount: calcSummary.taxableAmount,
        cgstAmount: calcSummary.cgstAmount,
        sgstAmount: calcSummary.sgstAmount,
        igstAmount: calcSummary.igstAmount,
        cessAmount: calcSummary.cessAmount,
        roundOff: calcSummary.roundOff,
        grandTotal: calcSummary.grandTotal,
        isCreditLimitOverridden: false,
        overriddenByUserId: null,
        notes: notes ? notes.trim() : null,
        items: {
          create: calcSummary.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            hsnCode: item.hsnCode,
            uom: item.uom,
            quantity: item.quantity,
            unitRate: item.unitRate,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount,
            taxableAmount: item.taxableAmount,
            gstRate: item.gstRate,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
        priceCategory: true,
      },
    });

    // If active order (not draft), auto-generate GST Tax Invoice and deduct warehouse stock
    if (!isDraft) {
      // 1. Generate GST Tax Invoice immediately
      const invoiceCount = await prisma.invoice.count();
      const invoiceNumber = `${company?.invoicePrefix || 'INV-2026-'}${String((company?.invoiceNextNumber || 1000) + invoiceCount + 1)}`;
      const isInterstate = (company?.stateCode || '33').trim() !== (customer.stateCode || '33').trim();
      const dueDate = new Date(Date.now() + (customer.paymentTermsDays || 15) * 24 * 60 * 60 * 1000);

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          customerId: order.customerId,
          invoiceDate: new Date(),
          dueDate,
          placeOfSupplyStateCode: customer.stateCode || '33',
          isInterstate,
          billingAddress: customer.billingAddress,
          shippingAddress: customer.deliveryAddress,
          customerGstin: customer.gstin,
          taxableAmount: order.taxableAmount,
          cgstAmount: order.cgstAmount,
          sgstAmount: order.sgstAmount,
          igstAmount: order.igstAmount,
          cessAmount: order.cessAmount,
          grandTotal: order.grandTotal,
          amountInWords: numberToIndianWords(order.grandTotal),
          paidAmount: 0,
          balanceAmount: order.grandTotal,
          paymentStatus: 'UNPAID',
          items: {
            create: order.items.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              hsnCode: it.hsnCode,
              uom: it.uom,
              quantity: it.quantity,
              unitRate: it.unitRate,
              taxableAmount: it.taxableAmount,
              gstRate: it.gstRate,
              cgstAmount: it.cgstAmount,
              sgstAmount: it.sgstAmount,
              igstAmount: it.igstAmount,
              totalAmount: it.totalAmount,
            })),
          },
        },
      });

      // 2. Adjust inventory stocks
      for (const item of order.items) {
        const stock = await prisma.inventoryStock.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: targetWarehouseId,
              productId: item.productId,
            },
          },
        });

        if (stock) {
          const deductQty = Math.min(stock.availableQuantity, item.quantity);
          await prisma.inventoryStock.update({
            where: { id: stock.id },
            data: {
              availableQuantity: { decrement: deductQty },
              dispatchedQuantity: { increment: item.quantity },
            },
          });

          await prisma.stockMovement.create({
            data: {
              warehouseId: targetWarehouseId,
              productId: item.productId,
              movementType: 'ORDER_DISPATCH',
              quantity: item.quantity,
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              performedByUserId: authUser.id,
              notes: `Stock dispatched for confirmed order ${order.orderNumber}`,
            },
          });
        }
      }

      await prisma.notification.create({
        data: {
          type: 'NEW_ORDER',
          title: `New Order ${order.orderNumber}`,
          message: `Order of ₹${order.grandTotal.toLocaleString()} confirmed for ${customer.storeName}`,
          linkUrl: `/orders/${order.id}`,
        },
      });
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: isDraft ? 'SAVE_DRAFT_ORDER' : 'CREATE_CONFIRMED_ORDER',
      entityType: 'ORDER',
      entityId: order.id,
      newValues: { orderNumber, customerId, grandTotal: order.grandTotal, status: order.status },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
