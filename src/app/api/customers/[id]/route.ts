import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true, phone: true },
        },
        orders: {
          take: 10,
          orderBy: { orderDate: 'desc' },
          include: { priceCategory: true },
        },
        invoices: {
          take: 10,
          orderBy: { invoiceDate: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { paymentDate: 'desc' },
        },
        returnRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        creditNotes: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can modify customer master records' }, { status: 403 });
    }

    const existing = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        storeName: body.storeName?.trim(),
        ownerName: body.ownerName?.trim(),
        phone: body.phone?.trim(),
        altPhone: body.altPhone ? body.altPhone.trim() : null,
        email: body.email ? body.email.trim() : null,
        billingAddress: body.billingAddress?.trim(),
        deliveryAddress: body.deliveryAddress?.trim(),
        city: body.city,
        district: body.district,
        state: body.state,
        stateCode: body.stateCode,
        pincode: body.pincode,
        gstin: body.gstin ? body.gstin.trim().toUpperCase() : null,
        pan: body.pan ? body.pan.trim().toUpperCase() : null,
        customerType: body.customerType,
        assignedEmployeeId: body.assignedEmployeeId || null,
        creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : undefined,
        paymentTermsDays: body.paymentTermsDays !== undefined ? Number(body.paymentTermsDays) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        notes: body.notes,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_CUSTOMER',
      entityType: 'CUSTOMER',
      entityId: params.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}
