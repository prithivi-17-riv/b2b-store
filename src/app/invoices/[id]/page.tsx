'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatIndianCurrency } from '@/lib/gst';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft,
  Printer,
  Download,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Receipt,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setCompany(data.company);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoice || !company) return;
    setDownloading(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header - Company Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(company.name || 'Annapoorna Wholesale Distributors Pvt Ltd', 14, 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${company.address || ''}, ${company.city || ''} - ${company.pincode || ''}, ${company.state || ''}`, 14, 20);
      doc.text(`GSTIN: ${company.gstin || ''} | PAN: ${company.pan || ''} | Phone: ${company.phone || ''}`, 14, 24);

      // Tax Invoice Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', pageWidth - 14, 15, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('(Original for Recipient)', pageWidth - 14, 20, { align: 'right' });

      doc.line(14, 27, pageWidth - 14, 27);

      // Invoice & Buyer Meta Grid
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', 14, 32);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 37);
      doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 14, 41);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 45);
      doc.text(`Place of Supply: State Code ${invoice.placeOfSupplyStateCode}`, 14, 49);

      doc.setFont('helvetica', 'bold');
      doc.text('Billed & Shipped To:', 110, 32);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.customer?.storeName || '', 110, 37);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.billingAddress || '', 110, 41, { maxWidth: 85 });
      doc.text(`GSTIN: ${invoice.customerGstin || 'Unregistered'} | State: ${invoice.customer?.state || 'Tamil Nadu'} (${invoice.placeOfSupplyStateCode})`, 110, 49);

      // Table of Items
      const tableRows = invoice.items.map((it: any, idx: number) => {
        return [
          idx + 1,
          it.productName,
          it.hsnCode,
          `${it.quantity} ${it.uom}`,
          Number(it.unitRate).toFixed(2),
          Number(it.taxableAmount).toFixed(2),
          `${it.gstRate}%`,
          Number(it.cgstAmount).toFixed(2),
          Number(it.sgstAmount).toFixed(2),
          Number(it.igstAmount).toFixed(2),
          Number(it.totalAmount).toFixed(2),
        ];
      });

      autoTable(doc, {
        startY: 55,
        head: [['#', 'Item Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'GST%', 'CGST', 'SGST', 'IGST', 'Total (₹)']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 42 },
          2: { cellWidth: 16 },
          3: { cellWidth: 16, halign: 'right' },
          4: { cellWidth: 14, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 12, halign: 'center' },
          7: { cellWidth: 14, halign: 'right' },
          8: { cellWidth: 14, halign: 'right' },
          9: { cellWidth: 14, halign: 'right' },
          10: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 6;

      // Summary & Totals
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Amount in Words: ${invoice.amountInWords || ''}`, 14, finalY, { maxWidth: 110 });

      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details for RTGS/NEFT/UPI Transfer:', 14, finalY + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bank: ${company.bankName || 'HDFC Bank'} | A/C: ${company.bankAccountNumber || '50200012345678'}`, 14, finalY + 16);
      doc.text(`IFSC: ${company.bankIfsc || 'HDFC0000123'} | Branch: ${company.bankBranch || 'Coimbatore'}`, 14, finalY + 20);

      // Totals Box Right Side
      doc.setFont('helvetica', 'normal');
      doc.text(`Taxable Amount: ₹${Number(invoice.taxableAmount).toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
      doc.text(`Total CGST: ₹${Number(invoice.cgstAmount).toFixed(2)}`, pageWidth - 14, finalY + 4, { align: 'right' });
      doc.text(`Total SGST: ₹${Number(invoice.sgstAmount).toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });
      if (invoice.igstAmount > 0) {
        doc.text(`Total IGST: ₹${Number(invoice.igstAmount).toFixed(2)}`, pageWidth - 14, finalY + 12, { align: 'right' });
      }
      doc.text(`Round Off: ${invoice.roundOff}`, pageWidth - 14, finalY + 16, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ₹${Number(invoice.grandTotal).toLocaleString('en-IN')}`, pageWidth - 14, finalY + 22, { align: 'right' });

      // Signatory
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`For ${company.name || 'Annapoorna Wholesale Distributors Pvt Ltd'}`, pageWidth - 14, finalY + 36, { align: 'right' });
      doc.text('Authorized Signatory', pageWidth - 14, finalY + 48, { align: 'right' });

      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error downloading PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading GST invoice...</div>;
  }

  if (!invoice) {
    return <div className="p-12 text-center text-xs text-slate-400">Invoice not found</div>;
  }

  // Calculate HSN summary for on-screen invoice
  const hsnSummaryMap: Record<string, any> = {};
  invoice.items.forEach((it: any) => {
    const hsn = it.hsnCode || 'OTHER';
    if (!hsnSummaryMap[hsn]) {
      hsnSummaryMap[hsn] = {
        hsnCode: hsn,
        taxable: 0,
        rate: it.gstRate,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      };
    }
    hsnSummaryMap[hsn].taxable += it.taxableAmount;
    hsnSummaryMap[hsn].cgst += it.cgstAmount;
    hsnSummaryMap[hsn].sgst += it.sgstAmount;
    hsnSummaryMap[hsn].igst += it.igstAmount;
    hsnSummaryMap[hsn].total += it.cgstAmount + it.sgstAmount + it.igstAmount;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/invoices" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {invoice.balanceAmount > 0 && (
            <Link
              href={`/payments?customerId=${invoice.customerId}&invoiceId=${invoice.id}`}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Record Payment</span>
            </Link>
          )}
        </div>
      </div>

      {/* Official Indian GST Tax Invoice Document Sheet */}
      <div className="invoice-container bg-white rounded-2xl p-6 sm:p-10 border border-slate-300 shadow-lg text-slate-900 text-xs">
        {/* Header: Company & Tax Invoice Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 gap-4">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {company?.name || 'Annapoorna Wholesale Distributors Pvt Ltd'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">{company?.tradeName}</p>
            <p className="text-slate-600 mt-1">{company?.address}, {company?.city} - {company?.pincode}, {company?.state}</p>
            <p className="text-slate-700 font-mono font-semibold mt-0.5">
              GSTIN: {company?.gstin} | PAN: {company?.pan}
            </p>
            <p className="text-slate-600">Phone: {company?.phone} | Email: {company?.email}</p>
          </div>

          <div className="text-right sm:border-l-2 sm:border-slate-900 sm:pl-6">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold tracking-widest uppercase">
              TAX INVOICE
            </span>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">(Original for Recipient)</p>
            <p className="text-xs font-bold text-slate-900 mt-2">
              Invoice No: <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-slate-600">Date: <strong>{new Date(invoice.invoiceDate).toLocaleDateString()}</strong></p>
            <p className="text-slate-600">Due Date: <strong>{new Date(invoice.dueDate).toLocaleDateString()}</strong></p>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
          {/* Bill to & Ship to */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Details of Receiver (Billed & Shipped To):
            </span>
            <p className="text-sm font-bold text-slate-900">{invoice.customer?.storeName}</p>
            <p className="text-slate-700 mt-0.5">{invoice.billingAddress}, {invoice.customer?.city}</p>
            <p className="text-slate-700 font-mono font-bold mt-1">
              GSTIN: {invoice.customerGstin || 'Unregistered'}
            </p>
            <p className="text-slate-600">State: {invoice.customer?.state} (Code: {invoice.placeOfSupplyStateCode})</p>
            <p className="text-slate-600">Contact: {invoice.customer?.ownerName} ({invoice.customer?.phone})</p>
          </div>

          {/* Logistics & Payment Meta */}
          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Supply & Payment Details:
            </span>
            <p className="text-slate-700">Place of Supply: <strong>State Code {invoice.placeOfSupplyStateCode} ({invoice.customer?.state})</strong></p>
            <p className="text-slate-700">Supply Type: <strong>{invoice.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}</strong></p>
            <p className="text-slate-700">Reverse Charge: <strong>No</strong></p>
            <p className="text-slate-700">Payment Terms: <strong>{invoice.customer?.paymentTermsDays || 15} Days</strong></p>
            {invoice.order && <p className="text-slate-700 font-mono">Order Ref: {invoice.order.orderNumber}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-4 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 w-8">#</th>
                <th className="p-2 border-r border-slate-300">Product Description</th>
                <th className="p-2 border-r border-slate-300 text-center">HSN</th>
                <th className="p-2 border-r border-slate-300 text-right">Qty</th>
                <th className="p-2 border-r border-slate-300 text-right">Rate</th>
                <th className="p-2 border-r border-slate-300 text-right">Taxable (₹)</th>
                <th className="p-2 border-r border-slate-300 text-center">GST %</th>
                {!invoice.isInterstate ? (
                  <>
                    <th className="p-2 border-r border-slate-300 text-right">CGST (₹)</th>
                    <th className="p-2 border-r border-slate-300 text-right">SGST (₹)</th>
                  </>
                ) : (
                  <th className="p-2 border-r border-slate-300 text-right">IGST (₹)</th>
                )}
                <th className="p-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((it: any, idx: number) => (
                <tr key={it.id} className="hover:bg-slate-50/50">
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{it.productName}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">{it.hsnCode}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-medium">{it.quantity} {it.uom}</td>
                  <td className="p-2 border-r border-slate-200 text-right">{formatIndianCurrency(it.unitRate)}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-semibold">{formatIndianCurrency(it.taxableAmount)}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-semibold text-emerald-700">{it.gstRate}%</td>
                  {!invoice.isInterstate ? (
                    <>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-700">{formatIndianCurrency(it.cgstAmount)}</td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-700">{formatIndianCurrency(it.sgstAmount)}</td>
                    </>
                  ) : (
                    <td className="p-2 border-r border-slate-200 text-right text-blue-700 font-semibold">{formatIndianCurrency(it.igstAmount)}</td>
                  )}
                  <td className="p-2 text-right font-bold text-slate-900">{formatIndianCurrency(it.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* HSN Summary Table */}
        <div className="py-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            HSN / SAC Wise Tax Breakdown:
          </span>
          <table className="w-full text-left text-[11px] border border-slate-200 bg-slate-50/50">
            <thead className="bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-1.5 border-r border-slate-200">HSN/SAC</th>
                <th className="p-1.5 border-r border-slate-200 text-right">Taxable Value</th>
                <th className="p-1.5 border-r border-slate-200 text-center">Rate</th>
                {!invoice.isInterstate ? (
                  <>
                    <th className="p-1.5 border-r border-slate-200 text-right">Central Tax</th>
                    <th className="p-1.5 border-r border-slate-200 text-right">State Tax</th>
                  </>
                ) : (
                  <th className="p-1.5 border-r border-slate-200 text-right">Integrated Tax</th>
                )}
                <th className="p-1.5 text-right">Total Tax Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.values(hsnSummaryMap).map((h: any) => (
                <tr key={h.hsnCode}>
                  <td className="p-1.5 border-r border-slate-200 font-mono font-semibold">{h.hsnCode}</td>
                  <td className="p-1.5 border-r border-slate-200 text-right font-medium">{formatIndianCurrency(h.taxable)}</td>
                  <td className="p-1.5 border-r border-slate-200 text-center font-semibold">{h.rate}%</td>
                  {!invoice.isInterstate ? (
                    <>
                      <td className="p-1.5 border-r border-slate-200 text-right">{formatIndianCurrency(h.cgst)}</td>
                      <td className="p-1.5 border-r border-slate-200 text-right">{formatIndianCurrency(h.sgst)}</td>
                    </>
                  ) : (
                    <td className="p-1.5 border-r border-slate-200 text-right">{formatIndianCurrency(h.igst)}</td>
                  )}
                  <td className="p-1.5 text-right font-bold text-slate-900">{formatIndianCurrency(h.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Amount in Words */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Invoice Amount in Words:
            </span>
            <p className="font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {invoice.amountInWords || 'Amount in words'}
            </p>

            {/* Bank Details */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
              <span className="font-bold text-slate-800 block mb-1">Bank Settlement Details (RTGS / NEFT / UPI):</span>
              <p>Bank Name: <strong>{company?.bankName}</strong></p>
              <p>Account Number: <strong className="font-mono">{company?.bankAccountNumber}</strong></p>
              <p>IFSC Code: <strong className="font-mono">{company?.bankIfsc}</strong></p>
              <p>Branch: <strong>{company?.bankBranch}</strong></p>
            </div>
          </div>

          {/* Numerical Totals */}
          <div className="space-y-1.5 text-right text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Taxable Amount:</span>
              <span className="font-bold text-slate-900">{formatIndianCurrency(invoice.taxableAmount)}</span>
            </div>
            {!invoice.isInterstate ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Total CGST:</span>
                  <span>{formatIndianCurrency(invoice.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total SGST:</span>
                  <span>{formatIndianCurrency(invoice.sgstAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-blue-700 font-semibold">
                <span>Total IGST:</span>
                <span>{formatIndianCurrency(invoice.igstAmount)}</span>
              </div>
            )}
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span>{invoice.roundOff}</span>
              </div>
            )}
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-900">
              <span>Invoice Grand Total:</span>
              <span className="text-base text-emerald-800">{formatIndianCurrency(invoice.grandTotal)}</span>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                <span>Paid Amount:</span>
                <span>-{formatIndianCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-red-600 font-bold">
              <span>Balance Payable:</span>
              <span>{formatIndianCurrency(invoice.balanceAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Terms & Signatory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 mt-6 border-t border-slate-200 text-[11px]">
          <div>
            <span className="font-bold text-slate-700 block mb-1">Terms & Conditions:</span>
            <p className="text-slate-500 whitespace-pre-line leading-relaxed">
              {company?.termsAndConditions || '1. Goods once sold will not be taken back without authorization.\n2. Subject to Coimbatore Jurisdiction only.'}
            </p>
          </div>

          <div className="text-right flex flex-col justify-between items-end min-h-24">
            <div>
              <p className="font-bold text-slate-800">For {company?.name}</p>
              <p className="text-[10px] text-slate-400">(Authorized Signatory)</p>
            </div>
            <div className="border-t border-slate-400 pt-1 w-48 text-center text-[10px] text-slate-500">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
