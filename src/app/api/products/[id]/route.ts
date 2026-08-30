import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        prices: {
          include: { priceCategory: true },
        },
        inventoryStocks: {
          include: { warehouse: true },
        },
        inventoryBatches: {
          include: { warehouse: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can modify product records' }, { status: 403 });
    }

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { prices: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      barcode,
      brand,
      categoryId,
      description,
      uom,
      packSize,
      hsnCode,
      gstRate,
      cessRate,
      mrp,
      purchasePrice,
      minStockLevel,
      isActive,
      prices, // array of { priceCategoryId, price }
    } = body;

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        sku: sku !== undefined ? sku.trim().toUpperCase() : undefined,
        barcode: barcode !== undefined ? (barcode ? barcode.trim() : null) : undefined,
        brand: brand !== undefined ? (brand ? brand.trim() : null) : undefined,
        categoryId: categoryId || undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        uom: uom || undefined,
        packSize: packSize !== undefined ? (packSize ? packSize.trim() : null) : undefined,
        hsnCode: hsnCode !== undefined ? hsnCode.trim() : undefined,
        gstRate: gstRate !== undefined ? Number(gstRate) : undefined,
        cessRate: cessRate !== undefined ? Number(cessRate) : undefined,
        mrp: mrp !== undefined ? Number(mrp) : undefined,
        purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : undefined,
        minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    // Update prices if supplied
    if (prices && Array.isArray(prices)) {
      for (const pr of prices) {
        if (pr.priceCategoryId && pr.price !== undefined) {
          await prisma.productPrice.upsert({
            where: {
              productId_priceCategoryId: {
                productId: params.id,
                priceCategoryId: pr.priceCategoryId,
              },
            },
            update: { price: Number(pr.price) },
            create: {
              productId: params.id,
              priceCategoryId: pr.priceCategoryId,
              price: Number(pr.price),
            },
          });
        }
      }
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'UPDATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: params.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}
