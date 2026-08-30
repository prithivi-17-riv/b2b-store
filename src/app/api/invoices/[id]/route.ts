import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        order: {
          include: {
            salesEmployee: {
              select: { id: true, name: true, phone: true, email: true },
            },
            priceCategory: true,
          },
        },
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            receivedByUser: {
              select: { id: true, name: true },
            },
          },
        },
        creditNotes: true,
        returnRequests: {
          include: { items: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const company = await prisma.companyProfile.findFirst();

    return NextResponse.json({ invoice, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice details' }, { status: 500 });
  }
}
