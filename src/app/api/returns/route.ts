import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    if (status && status !== 'ALL') whereClause.status = status;

    const returns = await prisma.returnRequest.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, customerCode: true, storeName: true, ownerName: true, phone: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, grandTotal: true, invoiceDate: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
          },
        },
        creditNote: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ returns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId, reason, items, notes } = body; // items: Array of { productId, quantity, unitRate, gstRate, isRestockedToWarehouse }

    if (!invoiceId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invoice and return items are required' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, order: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const returnCount = await prisma.returnRequest.count();
    const returnNumber = `RET-2026-${String(returnCount + 1).padStart(4, '0')}`;

    let totalRefundAmount = 0;
    const returnItemCreates: any[] = [];

    for (const it of items) {
      const qty = Number(it.quantity || 1);
      const rate = Number(it.unitRate || 0);
      const gstRate = Number(it.gstRate || 0);
      const taxable = Number((qty * rate).toFixed(2));
      const gstAmount = Number(((taxable * gstRate) / 100).toFixed(2));
      const totalAmount = Number((taxable + gstAmount).toFixed(2));

      totalRefundAmount += totalAmount;

      returnItemCreates.push({
        productId: it.productId,
        quantity: qty,
        unitRate: rate,
        taxableAmount: taxable,
        gstAmount,
        totalAmount,
        isRestockedToWarehouse: Boolean(it.isRestockedToWarehouse),
      });
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        returnNumber,
        invoiceId,
        customerId: invoice.customerId,
        status: authUser.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        reason: reason || 'DAMAGED',
        totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
        approvedByUserId: authUser.role === 'ADMIN' ? authUser.id : null,
        notes: notes ? notes.trim() : null,
        items: {
          create: returnItemCreates,
        },
      },
      include: { items: true, customer: true },
    });

    // If Admin created it, auto-approve and generate Credit Note
    if (authUser.role === 'ADMIN') {
      await processReturnApproval(returnRequest.id, invoice, returnItemCreates, totalRefundAmount, authUser.id);
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_RETURN_REQUEST',
      entityType: 'RETURN_REQUEST',
      entityId: returnRequest.id,
      newValues: { returnNumber, invoiceNumber: invoice.invoiceNumber, totalRefundAmount },
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Create return request error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create return request' }, { status: 500 });
  }
}

async function processReturnApproval(returnId: string, invoice: any, items: any[], totalRefundAmount: number, adminUserId: string) {
  const company = await prisma.companyProfile.findFirst();
  const cnCount = await prisma.creditNote.count();
  const creditNoteNumber = `${company?.creditNotePrefix || 'CN-2026-'}${String((company?.creditNoteNextNumber || 200) + cnCount + 1)}`;

  let totalTax = 0;
  let totalTaxable = 0;
  items.forEach((it) => {
    totalTax += it.gstAmount;
    totalTaxable += it.taxableAmount;
  });

  const creditNote = await prisma.creditNote.create({
    data: {
      creditNoteNumber,
      returnRequestId: returnId,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: Number(totalTaxable.toFixed(2)),
      taxAmount: Number(totalTax.toFixed(2)),
      grandTotal: Number(totalRefundAmount.toFixed(2)),
      date: new Date(),
      notes: `Credit Note issued for approved Return on Invoice ${invoice.invoiceNumber}`,
    },
  });

  // Restock items if indicated
  const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (defaultWh) {
    for (const it of items) {
      if (it.isRestockedToWarehouse) {
        await prisma.inventoryStock.upsert({
          where: {
            warehouseId_productId: { warehouseId: defaultWh.id, productId: it.productId },
          },
          update: { availableQuantity: { increment: it.quantity } },
          create: {
            warehouseId: defaultWh.id,
            productId: it.productId,
            availableQuantity: it.quantity,
          },
        });

        await prisma.stockMovement.create({
          data: {
            warehouseId: defaultWh.id,
            productId: it.productId,
            movementType: 'RETURN_INWARD',
            quantity: it.quantity,
            referenceType: 'RETURN',
            referenceId: creditNote.creditNoteNumber,
            performedByUserId: adminUserId,
            notes: 'Restocked from customer return',
          },
        });
      } else {
        // Log as damaged / quarantined stock
        await prisma.inventoryStock.upsert({
          where: {
            warehouseId_productId: { warehouseId: defaultWh.id, productId: it.productId },
          },
          update: { damagedQuantity: { increment: it.quantity } },
          create: {
            warehouseId: defaultWh.id,
            productId: it.productId,
            damagedQuantity: it.quantity,
          },
        });
      }
    }
  }

  // Update Customer Outstanding & Ledger
  const newOutstanding = Math.max(0, invoice.customer.currentOutstanding - totalRefundAmount);

  await prisma.customerLedger.create({
    data: {
      customerId: invoice.customerId,
      transactionDate: new Date(),
      type: 'CREDIT_NOTE',
      referenceId: creditNote.id,
      referenceNumber: creditNote.creditNoteNumber,
      debitAmount: 0,
      creditAmount: Number(totalRefundAmount.toFixed(2)),
      runningBalance: newOutstanding,
      notes: `Credit Note ${creditNote.creditNoteNumber} for Return`,
    },
  });

  await prisma.customer.update({
    where: { id: invoice.customerId },
    data: { currentOutstanding: newOutstanding },
  });

  return creditNote;
}
