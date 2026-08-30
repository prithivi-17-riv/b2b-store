import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const movementType = searchParams.get('movementType');

    const whereClause: any = {};
    if (warehouseId) whereClause.warehouseId = warehouseId;
    if (productId) whereClause.productId = productId;
    if (movementType && movementType !== 'ALL') whereClause.movementType = movementType;

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        warehouse: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Populate product details
    const productIds = Array.from(new Set(movements.map((m) => m.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, uom: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enriched = movements.map((m) => ({
      ...m,
      product: productMap.get(m.productId) || null,
    }));

    return NextResponse.json({ movements: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stock movements' }, { status: 500 });
  }
}
