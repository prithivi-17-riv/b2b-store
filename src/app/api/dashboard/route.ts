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

    // 2. Order counts
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] },
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {}),
      },
    });

    const deliveredOrdersCount = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {}),
      },
    });

    // 3. Customer count
    const totalCustomersCount = await prisma.customer.count({
      where: {
        isActive: true,
        ...(authUser?.role === 'SALES_EMPLOYEE' ? { assignedEmployeeId: authUser.id } : {}),
      },
    });

    // 4. Expiring batches
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

    // 5. Recent Orders
    const recentOrders = await prisma.order.findMany({
      where: authUser?.role === 'SALES_EMPLOYEE' ? { salesEmployeeId: authUser.id } : {},
      include: {
        customer: { select: { storeName: true, city: true } },
        salesEmployee: { select: { name: true } },
        priceCategory: { select: { name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { orderDate: 'desc' },
      take: 8,
    });

    // 6. Sales Performance
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
        active: activeOrdersCount,
        delivered: deliveredOrdersCount,
        total: todayOrderCount,
      },
      stats: {
        totalCustomers: totalCustomersCount,
      },
      inventoryAlerts: {
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
