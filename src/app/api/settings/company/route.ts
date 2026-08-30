import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    let company = await prisma.companyProfile.findFirst();
    if (!company) {
      company = await prisma.companyProfile.create({
        data: {
          name: 'Annapoorna Wholesale Distributors Pvt Ltd',
        },
      });
    }
    return NextResponse.json({ company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch company profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can modify company settings' }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.companyProfile.findFirst();

    const updated = await prisma.companyProfile.update({
      where: { id: existing?.id || 'default' },
      data: {
        name: body.name?.trim(),
        tradeName: body.tradeName ? body.tradeName.trim() : null,
        gstin: body.gstin ? body.gstin.trim().toUpperCase() : undefined,
        pan: body.pan ? body.pan.trim().toUpperCase() : undefined,
        address: body.address?.trim(),
        city: body.city?.trim(),
        state: body.state?.trim(),
        stateCode: body.stateCode?.trim(),
        pincode: body.pincode?.trim(),
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        bankName: body.bankName?.trim(),
        bankAccountNumber: body.bankAccountNumber?.trim(),
        bankIfsc: body.bankIfsc?.trim(),
        bankBranch: body.bankBranch?.trim(),
        termsAndConditions: body.termsAndConditions,
        invoicePrefix: body.invoicePrefix?.trim(),
        orderPrefix: body.orderPrefix?.trim(),
        creditNotePrefix: body.creditNotePrefix?.trim(),
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_COMPANY_SETTINGS',
      entityType: 'SETTINGS',
      newValues: updated,
    });

    return NextResponse.json({ company: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update company profile' }, { status: 500 });
  }
}
