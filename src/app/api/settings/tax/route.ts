import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const taxConfigs = await prisma.taxConfiguration.findMany({
      orderBy: { igstRate: 'asc' },
    });
    return NextResponse.json({ taxConfigs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tax configurations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can configure GST tax slabs' }, { status: 403 });
    }

    const body = await req.json();
    const { name, cgstRate, sgstRate, igstRate, cessRate, isDefault } = body;

    if (!name || igstRate === undefined) {
      return NextResponse.json({ error: 'Name and IGST rate are required' }, { status: 400 });
    }

    const taxConfig = await prisma.taxConfiguration.create({
      data: {
        name: name.trim(),
        cgstRate: Number(cgstRate ?? Number(igstRate) / 2),
        sgstRate: Number(sgstRate ?? Number(igstRate) / 2),
        igstRate: Number(igstRate),
        cessRate: Number(cessRate || 0),
        isDefault: Boolean(isDefault),
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_TAX_CONFIG',
      entityType: 'TAX_CONFIG',
      entityId: taxConfig.id,
      newValues: taxConfig,
    });

    return NextResponse.json({ taxConfig }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create tax configuration' }, { status: 500 });
  }
}
