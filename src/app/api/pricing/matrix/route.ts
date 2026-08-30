import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        prices: {
          include: { priceCategory: true },
        },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const priceCategories = await prisma.priceCategory.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ products, priceCategories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch pricing matrix' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can modify the price category matrix' }, { status: 403 });
    }

    const body = await req.json();
    const { updates } = body; // Array of { productId, priceCategoryId, price }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    let updatedCount = 0;
    for (const item of updates) {
      if (item.productId && item.priceCategoryId && item.price !== undefined) {
        await prisma.productPrice.upsert({
          where: {
            productId_priceCategoryId: {
              productId: item.productId,
              priceCategoryId: item.priceCategoryId,
            },
          },
          update: { price: Number(item.price) },
          create: {
            productId: item.productId,
            priceCategoryId: item.priceCategoryId,
            price: Number(item.price),
          },
        });
        updatedCount++;
      }
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_PRICING_MATRIX',
      entityType: 'PRICE_MATRIX',
      newValues: { updatedRecordsCount: updatedCount },
    });

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error('Update pricing matrix error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update pricing matrix' }, { status: 500 });
  }
}
