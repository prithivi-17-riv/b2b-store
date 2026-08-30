import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const paymentStatus = searchParams.get('paymentStatus');
    const query = searchParams.get('q') || '';

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      whereClause.paymentStatus = paymentStatus;
    }

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query } },
        { customer: { storeName: { contains: query } } },
        { customerGstin: { contains: query } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
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
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
          },
        },
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
