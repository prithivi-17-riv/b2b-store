import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days'; // today, 7days, 30days, all

    let startDate: Date | undefined;
    const now = new Date();

    if (period === 'today') {
      startDate = startOfDay(now);
    } else if (period === '7days') {
      startDate = subDays(now, 7);
    } else if (period === '30days') {
      startDate = subDays(now, 30);
    }

    const whereClause: any = {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
    };

    if (startDate) {
      whereClause.orderDate = { gte: startDate };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        salesEmployee: { select: { id: true, name: true } },
        priceCategory: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    });

    // Aggregations
    let totalSales = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalQuantity = 0;
    const orderCount = orders.length;

    const salesByDayMap: Record<string, { date: string; sales: number; orders: number }> = {};
    const salesByCategoryMap: Record<string, { categoryName: string; amount: number; quantity: number }> = {};
    const salesByProductMap: Record<string, { productName: string; amount: number; quantity: number; uom: string }> = {};
    const salesByCustomerMap: Record<string, { storeName: string; amount: number; orders: number }> = {};
    const salesByEmployeeMap: Record<string, { employeeName: string; amount: number; orders: number }> = {};
    const salesByPriceCatMap: Record<string, { priceCategoryName: string; amount: number; orders: number }> = {};

    orders.forEach((o) => {
      totalSales += o.grandTotal;
      totalTaxable += o.taxableAmount;
      totalCgst += o.cgstAmount;
      totalSgst += o.sgstAmount;
      totalIgst += o.igstAmount;
      totalQuantity += o.totalQuantity;

      // Day breakdown
      const dayKey = format(new Date(o.orderDate), 'yyyy-MM-dd');
      if (!salesByDayMap[dayKey]) {
        salesByDayMap[dayKey] = { date: dayKey, sales: 0, orders: 0 };
      }
      salesByDayMap[dayKey].sales += o.grandTotal;
      salesByDayMap[dayKey].orders += 1;

      // Customer breakdown
      const custName = o.customer.storeName;
      if (!salesByCustomerMap[custName]) {
        salesByCustomerMap[custName] = { storeName: custName, amount: 0, orders: 0 };
      }
      salesByCustomerMap[custName].amount += o.grandTotal;
      salesByCustomerMap[custName].orders += 1;

      // Employee breakdown
      const empName = o.salesEmployee.name;
      if (!salesByEmployeeMap[empName]) {
        salesByEmployeeMap[empName] = { employeeName: empName, amount: 0, orders: 0 };
      }
      salesByEmployeeMap[empName].amount += o.grandTotal;
      salesByEmployeeMap[empName].orders += 1;

      // Price Category breakdown
      const pcName = o.priceCategory.name;
      if (!salesByPriceCatMap[pcName]) {
        salesByPriceCatMap[pcName] = { priceCategoryName: pcName, amount: 0, orders: 0 };
      }
      salesByPriceCatMap[pcName].amount += o.grandTotal;
      salesByPriceCatMap[pcName].orders += 1;

      // Line items breakdown
      o.items.forEach((it) => {
        const catName = it.product.category.name;
        if (!salesByCategoryMap[catName]) {
          salesByCategoryMap[catName] = { categoryName: catName, amount: 0, quantity: 0 };
        }
        salesByCategoryMap[catName].amount += it.totalAmount;
        salesByCategoryMap[catName].quantity += it.quantity;

        const prodName = it.productName;
        if (!salesByProductMap[prodName]) {
          salesByProductMap[prodName] = { productName: prodName, amount: 0, quantity: 0, uom: it.uom };
        }
        salesByProductMap[prodName].amount += it.totalAmount;
        salesByProductMap[prodName].quantity += it.quantity;
      });
    });

    return NextResponse.json({
      summary: {
        totalSales: Number(totalSales.toFixed(2)),
        totalTaxable: Number(totalTaxable.toFixed(2)),
        totalCgst: Number(totalCgst.toFixed(2)),
        totalSgst: Number(totalSgst.toFixed(2)),
        totalIgst: Number(totalIgst.toFixed(2)),
        totalQuantity: Number(totalQuantity.toFixed(2)),
        orderCount,
        averageOrderValue: orderCount > 0 ? Number((totalSales / orderCount).toFixed(2)) : 0,
      },
      dailySales: Object.values(salesByDayMap).sort((a, b) => a.date.localeCompare(b.date)),
      categorySales: Object.values(salesByCategoryMap).sort((a, b) => b.amount - a.amount),
      productSales: Object.values(salesByProductMap).sort((a, b) => b.amount - a.amount).slice(0, 15),
      customerSales: Object.values(salesByCustomerMap).sort((a, b) => b.amount - a.amount).slice(0, 10),
      employeeSales: Object.values(salesByEmployeeMap).sort((a, b) => b.amount - a.amount),
      priceCategorySales: Object.values(salesByPriceCatMap).sort((a, b) => b.amount - a.amount),
    });
  } catch (error: any) {
    console.error('Sales report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate sales report' }, { status: 500 });
  }
}
