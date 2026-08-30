import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        customerCode: true,
        storeName: true,
        ownerName: true,
        phone: true,
        gstin: true,
        creditLimit: true,
        currentOutstanding: true,
        openingBalance: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const ledgerEntries = await prisma.customerLedger.findMany({
      where: { customerId: params.id },
      orderBy: { transactionDate: 'asc' },
    });

    // Compute totals
    let totalDebit = 0;
    let totalCredit = 0;
    ledgerEntries.forEach((entry) => {
      totalDebit += entry.debitAmount;
      totalCredit += entry.creditAmount;
    });

    return NextResponse.json({
      customer,
      ledgerEntries,
      summary: {
        openingBalance: customer.openingBalance,
        totalDebit,
        totalCredit,
        currentOutstanding: customer.currentOutstanding,
        creditLimit: customer.creditLimit,
        availableCredit: Math.max(0, customer.creditLimit - customer.currentOutstanding),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch ledger' }, { status: 500 });
  }
}
