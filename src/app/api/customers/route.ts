import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const employeeId = searchParams.get('employeeId');
    const isActiveParam = searchParams.get('isActive');

    const whereClause: any = {};

    // Role check: If sales employee, optionally limit to assigned customers unless admin or requested
    if (authUser?.role === 'SALES_EMPLOYEE') {
      whereClause.assignedEmployeeId = authUser.id;
    } else if (employeeId) {
      whereClause.assignedEmployeeId = employeeId;
    }

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      whereClause.isActive = isActiveParam === 'true';
    }

    if (query) {
      whereClause.OR = [
        { storeName: { contains: query } },
        { ownerName: { contains: query } },
        { customerCode: { contains: query } },
        { phone: { contains: query } },
        { gstin: { contains: query } },
        { city: { contains: query } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { orders: true, invoices: true },
        },
      },
      orderBy: { storeName: 'asc' },
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create customers' }, { status: 403 });
    }

    const body = await req.json();
    const {
      storeName,
      ownerName,
      phone,
      altPhone,
      email,
      billingAddress,
      deliveryAddress,
      city,
      district,
      state,
      stateCode,
      pincode,
      gstin,
      pan,
      customerType,
      assignedEmployeeId,
      creditLimit,
      paymentTermsDays,
      openingBalance,
      notes,
    } = body;

    if (!storeName || !ownerName || !phone || !billingAddress) {
      return NextResponse.json({ error: 'Store name, owner name, phone, and billing address are required' }, { status: 400 });
    }

    // Auto-generate customer code
    const count = await prisma.customer.count();
    const customerCode = `CUST-${String(count + 1).padStart(3, '0')}`;

    const numOpening = Number(openingBalance || 0);

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        altPhone: altPhone ? altPhone.trim() : null,
        email: email ? email.trim() : null,
        billingAddress: billingAddress.trim(),
        deliveryAddress: (deliveryAddress || billingAddress).trim(),
        city: city || 'Coimbatore',
        district: district || 'Coimbatore',
        state: state || 'Tamil Nadu',
        stateCode: stateCode || '33',
        pincode: pincode || '641001',
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        pan: pan ? pan.trim().toUpperCase() : null,
        customerType: customerType || 'SUPERMARKET',
        assignedEmployeeId: assignedEmployeeId || null,
        creditLimit: Number(creditLimit || 100000),
        paymentTermsDays: Number(paymentTermsDays || 15),
        openingBalance: numOpening,
        currentOutstanding: numOpening,
        notes: notes ? notes.trim() : null,
      },
    });

    if (numOpening > 0) {
      await prisma.customerLedger.create({
        data: {
          customerId: customer.id,
          transactionDate: new Date(),
          type: 'OPENING_BALANCE',
          referenceNumber: `OPB-${customerCode}`,
          debitAmount: numOpening,
          creditAmount: 0,
          runningBalance: numOpening,
          notes: 'Customer opening balance setup',
        },
      });
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_CUSTOMER',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      newValues: { customerCode, storeName, creditLimit, openingBalance },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
