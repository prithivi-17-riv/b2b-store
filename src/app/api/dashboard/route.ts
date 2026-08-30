import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    const today = startOfDay(new Date());

    // 1. Today's metrics
    const todayOrders = await prisma.order.findMany({
      where: {
        orderDate: { gte: today },
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {}),
      },
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const todayOrderCount = todayOrders.length;

    // 2. Order status counts
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: 'SUBMITTED',
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {}),
      },
    });

    const approvedOrdersCount = await prisma.order.count({
      where: {
        status: 'APPROVED',
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {}),
      },
    });

    const pickingPackingCount = await prisma.order.count({
      where: {
        status: { in: ['STOCK_RESERVED', 'PICKING', 'PACKED'] },
      },
    });

    const dispatchedOrdersCount = await prisma.order.count({
      where: {
        status: 'DISPATCHED',
      },
    });

    const deliveredOrdersCount = await prisma.order.count({
      where: {
        status: 'DELIVERED',
      },
    });

    // 3. Customer Outstandings
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { assignedEmployeeId: authUser.id } : {}),
      },
      select: {
        id: true,
        storeName: true,
        customerCode: true,
        currentOutstanding: true,
        creditLimit: true,
        paymentTermsDays: true,
      },
    });

    const totalOutstanding = customers.reduce((sum, c) => sum + c.currentOutstanding, 0);
    const customersNearLimit = customers.filter((c) => c.currentOutstanding >= c.creditLimit * 0.85);

    // 4. Low stock products
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventoryStocks: true,
        category: true,
      },
    });

    const lowStockItems = allProducts
      .map((p) => {
        const available = p.inventoryStocks.reduce((sum, s) => sum + s.availableQuantity, 0);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          uom: p.uom,
          categoryName: p.category.name,
          minStockLevel: p.minStockLevel,
          available,
          isLow: available <= p.minStockLevel,
        };
      })
      .filter((p) => p.isLow);

    // 5. Expiring batches
    const sixtyDaysAhead = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const expiringBatches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: sixtyDaysAhead },
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { expiryDate: 'asc' },
      take: 5,
    });

    // 6. Recent Orders
    const recentOrders = await prisma.order.findMany({
      where: authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {},
      include: {
        customer: { select: { storeName: true, city: true } },
        salesEmployee: { select: { name: true } },
        priceCategory: true,
      },
      orderBy: { orderDate: 'desc' },
      take: 6,
    });

    // 7. Sales Employee Performance
    const salesEmployees = await prisma.user.findMany({
      where: { role: 'SALES_EMPLOYEE', isActive: true },
      include: {
        ordersCreated: {
          where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
        },
      },
    });

    const employeePerformance = salesEmployees.map((emp) => {
      const totalAmount = emp.ordersCreated.reduce((sum, o) => sum + o.grandTotal, 0);
      return {
        id: emp.id,
        name: emp.name,
        orderCount: emp.ordersCreated.length,
        totalSales: Number(totalAmount.toFixed(2)),
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    return NextResponse.json({
      today: {
        sales: Number(todaySales.toFixed(2)),
        orders: todayOrderCount,
      },
      ordersSummary: {
        pending: pendingOrdersCount,
        approved: approvedOrdersCount,
        processing: pickingPackingCount,
        dispatched: dispatchedOrdersCount,
        delivered: deliveredOrdersCount,
      },
      finance: {
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        totalCustomers: customers.length,
        nearLimitCount: customersNearLimit.length,
      },
      inventoryAlerts: {
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 6),
        expiringBatchesCount: expiringBatches.length,
        expiringBatches,
      },
      recentOrders,
      employeePerformance,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
