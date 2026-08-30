import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const priceCategories = await prisma.priceCategory.findMany({
      include: {
        _count: {
          select: { productPrices: true, orders: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ priceCategories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch price categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can manage price categories' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    const priceCategory = await prisma.priceCategory.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description ? description.trim() : null,
      },
    });

    // Populate default prices for all existing products using product MRP
    const allProducts = await prisma.product.findMany();
    for (const p of allProducts) {
      await prisma.productPrice.create({
        data: {
          productId: p.id,
          priceCategoryId: priceCategory.id,
          price: p.mrp,
        },
      });
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_PRICE_CATEGORY',
      entityType: 'PRICE_CATEGORY',
      entityId: priceCategory.id,
      newValues: priceCategory,
    });

    return NextResponse.json({ priceCategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create price category' }, { status: 500 });
  }
}
