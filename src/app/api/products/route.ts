import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const priceCategoryId = searchParams.get('priceCategoryId');
    const isActiveParam = searchParams.get('isActive');

    const whereClause: any = {};

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      whereClause.isActive = isActiveParam === 'true';
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { barcode: { contains: query } },
        { brand: { contains: query } },
        { hsnCode: { contains: query } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        prices: {
          include: {
            priceCategory: true,
          },
        },
        inventoryStocks: {
          include: {
            warehouse: true,
          },
        },
        inventoryBatches: {
          where: { status: 'ACTIVE' },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format output with computed total available stock and price category lookup
    const formatted = products.map((p) => {
      const totalStock = p.inventoryStocks.reduce((sum, s) => sum + s.availableQuantity, 0);
      const totalReserved = p.inventoryStocks.reduce((sum, s) => sum + s.reservedQuantity, 0);

      // Price mapping by category ID and Name
      const priceMap: Record<string, number> = {};
      p.prices.forEach((pp) => {
        priceMap[pp.priceCategoryId] = pp.price;
        priceMap[pp.priceCategory.name] = pp.price;
      });

      let currentRate = p.mrp;
      if (priceCategoryId && priceMap[priceCategoryId]) {
        currentRate = priceMap[priceCategoryId];
      }

      return {
        ...p,
        totalStock,
        totalReserved,
        priceMap,
        currentRate,
        isLowStock: totalStock <= p.minStockLevel,
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can create products' }, { status: 403 });
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
      prices, // array of { priceCategoryId, price }
      warehouseId,
      initialStock,
    } = body;

    if (!name || !sku || !categoryId || !hsnCode || mrp === undefined || purchasePrice === undefined) {
      return NextResponse.json({ error: 'Name, SKU, category, HSN code, MRP and purchase price are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode ? barcode.trim() : null,
        brand: brand ? brand.trim() : null,
        categoryId,
        description: description ? description.trim() : null,
        uom: uom || 'KG',
        packSize: packSize ? packSize.trim() : null,
        hsnCode: hsnCode.trim(),
        gstRate: Number(gstRate ?? 5.0),
        cessRate: Number(cessRate ?? 0),
        mrp: Number(mrp),
        purchasePrice: Number(purchasePrice),
        minStockLevel: Number(minStockLevel ?? 10),
      },
    });

    // Insert prices for price categories if provided
    if (prices && Array.isArray(prices)) {
      for (const pr of prices) {
        if (pr.priceCategoryId && pr.price !== undefined) {
          await prisma.productPrice.create({
            data: {
              productId: product.id,
              priceCategoryId: pr.priceCategoryId,
              price: Number(pr.price),
            },
          });
        }
      }
    }

    // Initialize inventory stock record
    if (warehouseId) {
      const stockQty = Number(initialStock || 0);
      await prisma.inventoryStock.create({
        data: {
          warehouseId,
          productId: product.id,
          availableQuantity: stockQty,
          reservedQuantity: 0,
        },
      });

      if (stockQty > 0) {
        await prisma.stockMovement.create({
          data: {
            warehouseId,
            productId: product.id,
            movementType: 'PURCHASE_RECEIPT',
            quantity: stockQty,
            referenceType: 'MANUAL_INITIAL_CREATION',
            performedByUserId: authUser.id,
            notes: 'Initial opening stock upon product creation',
          },
        });
      }
    }

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: product.id,
      newValues: { name: product.name, sku: product.sku, mrp: product.mrp },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
