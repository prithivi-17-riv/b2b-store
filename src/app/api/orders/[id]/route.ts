import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { calculateOrderTaxes } from '@/lib/gst';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        salesEmployee: {
          select: { id: true, name: true, email: true, phone: true },
        },
        priceCategory: true,
        warehouse: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                inventoryStocks: true,
                inventoryBatches: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
        invoice: {
          include: {
            items: true,
            payments: true,
          },
        },
        delivery: {
          include: {
            deliveryEmployee: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only Draft or Submitted orders can be edited
    if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot edit order in current status' }, { status: 400 });
    }

    const body = await req.json();
    const { items, priceCategoryId, warehouseId, notes, status, orderDiscountAmount } = body;

    const company = await prisma.companyProfile.findFirst();
    const sellerStateCode = company?.stateCode || '33';

    const customer = await prisma.customer.findUnique({ where: { id: existing.customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }

    const targetPriceCatId = priceCategoryId || existing.priceCategoryId;

    // Recalculate if items changed
    if (items && Array.isArray(items)) {
      const productIds = items.map((i: any) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          prices: { where: { priceCategoryId: targetPriceCatId } },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const lineItemInputs = items.map((item: any) => {
        const prod = productMap.get(item.productId);
        if (!prod) throw new Error(`Product ${item.productId} not found`);

        const catPrice = prod.prices.find((pr) => pr.priceCategoryId === targetPriceCatId);
        const unitRate = catPrice ? catPrice.price : prod.mrp;

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

      const calcSummary = calculateOrderTaxes(
        lineItemInputs,
        sellerStateCode,
        customer.stateCode || '33',
        Number(orderDiscountAmount || 0)
      );

      // Delete existing items and recreate
      await prisma.orderItem.deleteMany({ where: { orderId: params.id } });

      const updated = await prisma.order.update({
        where: { id: params.id },
        data: {
          priceCategoryId: targetPriceCatId,
          warehouseId: warehouseId || existing.warehouseId,
          status: status || existing.status,
          notes: notes !== undefined ? notes : existing.notes,
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
        include: { items: true, customer: true, priceCategory: true },
      });

      await createAuditLog({
        userId: authUser.id,
        userName: authUser.name,
        userRole: authUser.role,
        action: 'UPDATE_ORDER',
        entityType: 'ORDER',
        entityId: params.id,
        oldValues: existing,
        newValues: updated,
      });

      return NextResponse.json({ order: updated });
    }

    // If only notes or basic fields updated
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        notes: notes !== undefined ? notes : existing.notes,
        status: status || existing.status,
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
