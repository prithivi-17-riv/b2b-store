import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('invoiceId');
    const method = searchParams.get('method');

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    if (invoiceId) whereClause.invoiceId = invoiceId;
    if (method && method !== 'ALL') whereClause.paymentMethod = method;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, customerCode: true, storeName: true, ownerName: true, phone: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, grandTotal: true, paidAmount: true, balanceAmount: true },
        },
        receivedByUser: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      notes,
    } = body;

    const numAmount = Number(amount);
    if (!customerId || !numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Customer and valid payment amount are required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const payCount = await prisma.payment.count();
    const paymentNumber = `PAY-2026-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        customerId,
        invoiceId: invoiceId || null,
        amount: numAmount,
        paymentMethod: paymentMethod || 'UPI',
        referenceNumber: referenceNumber ? referenceNumber.trim() : null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        receivedByUserId: authUser.id,
        notes: notes ? notes.trim() : null,
      },
    });

    // Update Invoice if linked
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (invoice) {
        const newPaid = invoice.paidAmount + numAmount;
        const newBalance = Math.max(0, invoice.grandTotal - newPaid);
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus: newStatus,
          },
        });
      }
    }

    // Update Customer Outstanding & Ledger
    const newOutstanding = Math.max(0, customer.currentOutstanding - numAmount);

    await prisma.customerLedger.create({
      data: {
        customerId,
        transactionDate: payment.paymentDate,
        type: 'PAYMENT',
        referenceId: payment.id,
        referenceNumber: payment.paymentNumber,
        debitAmount: 0,
        creditAmount: numAmount,
        runningBalance: newOutstanding,
        notes: `Payment received via ${payment.paymentMethod}${payment.referenceNumber ? ` (${payment.referenceNumber})` : ''}`,
      },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { currentOutstanding: newOutstanding },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'RECORD_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      newValues: { paymentNumber, amount: numAmount, customerId, invoiceId },
    });

    return NextResponse.json({ payment, newOutstanding }, { status: 201 });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
