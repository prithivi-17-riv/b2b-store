import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const categoryId = searchParams.get('categoryId');

    const whereProduct: any = { isActive: true };
    if (categoryId) whereProduct.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where: whereProduct,
      include: {
        category: true,
        inventoryStocks: {
          where: warehouseId ? { warehouseId } : undefined,
          include: { warehouse: true },
        },
        inventoryBatches: {
          where: {
            status: 'ACTIVE',
            ...(warehouseId ? { warehouseId } : {}),
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const inventoryList = products.map((p) => {
      const available = p.inventoryStocks.reduce((sum, s) => sum + s.availableQuantity, 0);
      const reserved = p.inventoryStocks.reduce((sum, s) => sum + s.reservedQuantity, 0);
      const dispatched = p.inventoryStocks.reduce((sum, s) => sum + s.dispatchedQuantity, 0);
      const damaged = p.inventoryStocks.reduce((sum, s) => sum + s.damagedQuantity, 0);
      const returned = p.inventoryStocks.reduce((sum, s) => sum + s.returnedQuantity, 0);
      const totalStock = available + reserved;
      const isLowStock = available <= p.minStockLevel;

      return {
        product: {
          id: p.id,
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          categoryName: p.category.name,
          uom: p.uom,
          packSize: p.packSize,
          minStockLevel: p.minStockLevel,
          mrp: p.mrp,
          purchasePrice: p.purchasePrice,
          imageUrl: p.imageUrl,
        },
        stocksByWarehouse: p.inventoryStocks,
        batches: p.inventoryBatches,
        available,
        reserved,
        dispatched,
        damaged,
        returned,
        totalStock,
        valuation: Number((available * p.purchasePrice).toFixed(2)),
      };
    });

    return NextResponse.json({ inventory: inventoryList });
  } catch (error: any) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'WAREHOUSE_STAFF')) {
      return NextResponse.json({ error: 'Unauthorized to make inventory adjustments' }, { status: 403 });
    }

    const body = await req.json();
    const {
      warehouseId,
      productId,
      adjustmentType, // "ADD", "REDUCE", "DAMAGE", "RETURN"
      quantity,
      batchId,
      reason,
      notes,
    } = body;

    const numQty = Number(quantity);
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true } });
      targetWarehouseId = defaultWh?.id;
    }

    if (!targetWarehouseId || !productId || !numQty || numQty <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity are required' }, { status: 400 });
    }

    let stock = await prisma.inventoryStock.findUnique({
      where: {
        warehouseId_productId: { warehouseId: targetWarehouseId, productId },
      },
    });

    if (!stock) {
      stock = await prisma.inventoryStock.create({
        data: {
          warehouseId: targetWarehouseId,
          productId,
          availableQuantity: 0,
        },
      });
    }

    let movementType = 'ADJUSTMENT_ADD';
    let availableDelta = 0;
    let damagedDelta = 0;
    let returnedDelta = 0;

    if (adjustmentType === 'ADD') {
      movementType = 'ADJUSTMENT_ADD';
      availableDelta = numQty;
    } else if (adjustmentType === 'REDUCE') {
      movementType = 'ADJUSTMENT_REDUCE';
      availableDelta = -numQty;
    } else if (adjustmentType === 'DAMAGE') {
      movementType = 'ADJUSTMENT_DAMAGE';
      availableDelta = -numQty;
      damagedDelta = numQty;
    } else if (adjustmentType === 'RETURN') {
      movementType = 'RETURN_INWARD';
      returnedDelta = numQty;
      availableDelta = numQty;
    }

    await prisma.inventoryStock.update({
      where: { id: stock.id },
      data: {
        availableQuantity: { increment: availableDelta },
        damagedQuantity: { increment: damagedDelta },
        returnedQuantity: { increment: returnedDelta },
      },
    });

    // Update batch if batchId provided
    if (batchId) {
      await prisma.inventoryBatch.update({
        where: { id: batchId },
        data: {
          quantity: { increment: availableDelta },
        },
      });
    }

    await prisma.stockMovement.create({
      data: {
        warehouseId: targetWarehouseId,
        productId,
        batchId: batchId || null,
        movementType,
        quantity: numQty,
        referenceType: 'MANUAL_ADJUSTMENT',
        performedByUserId: authUser.id,
        notes: `${reason || 'Stock Adjustment'}: ${notes || ''}`,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'INVENTORY',
      entityId: productId,
      newValues: { warehouseId: targetWarehouseId, adjustmentType, quantity: numQty, reason },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inventory adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust inventory' }, { status: 500 });
  }
}
