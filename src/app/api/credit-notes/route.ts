import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;

    const creditNotes = await prisma.creditNote.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, customerCode: true, storeName: true, ownerName: true, phone: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, invoiceDate: true, grandTotal: true },
        },
        returnRequest: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ creditNotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch credit notes' }, { status: 500 });
  }
}
