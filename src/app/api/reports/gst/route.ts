import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days';

    let startDate: Date | undefined;
    const now = new Date();

    if (period === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === '7days') {
      startDate = subDays(now, 7);
    } else if (period === '30days') {
      startDate = subDays(now, 30);
    }

    const whereClause: any = {};
    if (startDate) {
      whereClause.invoiceDate = { gte: startDate };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    let totalTaxableB2B = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let totalInvoiceAmount = 0;

    // HSN Summary aggregation: { [hsnCode]: { hsnCode, description, uom, totalQty, totalTaxable, gstRate, cgstAmount, sgstAmount, igstAmount, totalAmount } }
    const hsnSummaryMap: Record<string, any> = {};

    // Rate-wise summary: { "5%": { rate: 5, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 } }
    const rateSummaryMap: Record<string, any> = {
      '0%': { rate: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
      '5%': { rate: 5, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
      '12%': { rate: 12, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
      '18%': { rate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
      '28%': { rate: 28, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
    };

    invoices.forEach((inv) => {
      totalTaxableB2B += inv.taxableAmount;
      totalCgst += inv.cgstAmount;
      totalSgst += inv.sgstAmount;
      totalIgst += inv.igstAmount;
      totalCess += inv.cessAmount;
      totalInvoiceAmount += inv.grandTotal;

      inv.items.forEach((it) => {
        const hsn = it.hsnCode || 'OTHER';
        if (!hsnSummaryMap[hsn]) {
          hsnSummaryMap[hsn] = {
            hsnCode: hsn,
            description: it.productName,
            uom: it.uom,
            totalQuantity: 0,
            taxableAmount: 0,
            gstRate: it.gstRate,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalAmount: 0,
          };
        }
        hsnSummaryMap[hsn].totalQuantity += it.quantity;
        hsnSummaryMap[hsn].taxableAmount += it.taxableAmount;
        hsnSummaryMap[hsn].cgstAmount += it.cgstAmount;
        hsnSummaryMap[hsn].sgstAmount += it.sgstAmount;
        hsnSummaryMap[hsn].igstAmount += it.igstAmount;
        hsnSummaryMap[hsn].totalAmount += it.totalAmount;

        const rateKey = `${it.gstRate}%`;
        if (rateSummaryMap[rateKey]) {
          rateSummaryMap[rateKey].taxable += it.taxableAmount;
          rateSummaryMap[rateKey].cgst += it.cgstAmount;
          rateSummaryMap[rateKey].sgst += it.sgstAmount;
          rateSummaryMap[rateKey].igst += it.igstAmount;
          rateSummaryMap[rateKey].total += it.totalAmount;
        }
      });
    });

    const company = await prisma.companyProfile.findFirst();

    return NextResponse.json({
      company,
      summary: {
        totalInvoices: invoices.length,
        totalTaxable: Number(totalTaxableB2B.toFixed(2)),
        totalCgst: Number(totalCgst.toFixed(2)),
        totalSgst: Number(totalSgst.toFixed(2)),
        totalIgst: Number(totalIgst.toFixed(2)),
        totalCess: Number(totalCess.toFixed(2)),
        totalInvoiceAmount: Number(totalInvoiceAmount.toFixed(2)),
      },
      hsnSummary: Object.values(hsnSummaryMap),
      rateSummary: Object.values(rateSummaryMap).filter((r) => r.taxable > 0),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customer.storeName,
        customerGstin: inv.customerGstin || 'URP (Unregistered)',
        placeOfSupply: inv.placeOfSupplyStateCode,
        isInterstate: inv.isInterstate,
        taxableAmount: inv.taxableAmount,
        cgstAmount: inv.cgstAmount,
        sgstAmount: inv.sgstAmount,
        igstAmount: inv.igstAmount,
        grandTotal: inv.grandTotal,
        paymentStatus: inv.paymentStatus,
      })),
    });
  } catch (error: any) {
    console.error('GST report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate GST report' }, { status: 500 });
  }
}
