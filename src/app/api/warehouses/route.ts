import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { stocks: true, batches: true, orders: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ warehouses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can create warehouses' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, city, managerName, contactPhone } = body;

    if (!name || !code || !address) {
      return NextResponse.json({ error: 'Name, code, and address are required' }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim(),
        city: city || 'Coimbatore',
        managerName: managerName ? managerName.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : null,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_WAREHOUSE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      newValues: warehouse,
    });

    return NextResponse.json({ warehouse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create warehouse' }, { status: 500 });
  }
}
