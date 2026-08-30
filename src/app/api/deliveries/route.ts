import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (authUser?.role === 'DELIVERY_STAFF') {
      whereClause.deliveryEmployeeId = authUser.id;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const deliveries = await prisma.delivery.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: { product: true },
            },
          },
        },
        invoice: true,
        deliveryEmployee: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ deliveries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch deliveries' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, proofOfDeliveryNotes, recipientName, recipientPhone, actualDeliveryDate, vehicleNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: status || undefined,
        proofOfDeliveryNotes: proofOfDeliveryNotes !== undefined ? proofOfDeliveryNotes : undefined,
        recipientName: recipientName !== undefined ? recipientName : undefined,
        recipientPhone: recipientPhone !== undefined ? recipientPhone : undefined,
        actualDeliveryDate: status === 'DELIVERED' ? new Date() : (actualDeliveryDate ? new Date(actualDeliveryDate) : undefined),
        vehicleNumber: vehicleNumber || undefined,
      },
      include: { order: true },
    });

    // If marked delivered, update parent order status too
    if (status === 'DELIVERED') {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: `DELIVERY_${status || 'UPDATE'}`,
      entityType: 'DELIVERY',
      entityId: id,
      newValues: { status, recipientName, proofOfDeliveryNotes },
    });

    return NextResponse.json({ delivery: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update delivery' }, { status: 500 });
  }
}
