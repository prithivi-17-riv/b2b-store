import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (warehouseId) whereClause.warehouseId = warehouseId;
    if (productId) whereClause.productId = productId;
    if (status) whereClause.status = status;

    const batches = await prisma.inventoryBatch.findMany({
      where: whereClause,
      include: {
        product: {
          include: { category: true },
        },
        warehouse: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const enriched = batches.map((b) => {
      let expiryStatus = 'VALID';
      if (b.expiryDate) {
        const exp = new Date(b.expiryDate);
        if (exp < now) {
          expiryStatus = 'EXPIRED';
        } else if (exp <= thirtyDaysAhead) {
          expiryStatus = 'EXPIRING_CRITICAL'; // < 30 days
        } else if (exp <= sixtyDaysAhead) {
          expiryStatus = 'EXPIRING_SOON'; // < 60 days
        }
      }

      return {
        ...b,
        expiryStatus,
      };
    });

    return NextResponse.json({ batches: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'WAREHOUSE_STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      warehouseId,
      productId,
      batchNumber,
      manufacturingDate,
      expiryDate,
      quantity,
      purchasePrice,
    } = body;

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await prisma.warehouse.findFirst({ where: { isActive: true } });
      targetWarehouseId = defaultWh?.id;
    }

    const numQty = Number(quantity || 0);
    if (!targetWarehouseId || !productId || numQty <= 0) {
      return NextResponse.json({ error: 'Product and valid quantity are required' }, { status: 400 });
    }

    const finalBatchNumber = (batchNumber && typeof batchNumber === 'string' && batchNumber.trim().length > 0)
      ? batchNumber.trim().toUpperCase()
      : `BAT-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    const batch = await prisma.inventoryBatch.create({
      data: {
        warehouseId: targetWarehouseId,
        productId,
        batchNumber: finalBatchNumber,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        quantity: numQty,
        purchasePrice: Number(purchasePrice || 0),
        status: 'ACTIVE',
      },
    });

    // Update or create InventoryStock
    const stock = await prisma.inventoryStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: targetWarehouseId, productId },
      },
      update: {
        availableQuantity: { increment: numQty },
      },
      create: {
        warehouseId: targetWarehouseId,
        productId,
        availableQuantity: numQty,
      },
    });

    await prisma.stockMovement.create({
      data: {
        warehouseId: targetWarehouseId,
        productId,
        batchId: batch.id,
        movementType: 'PURCHASE_RECEIPT',
        quantity: numQty,
        referenceType: 'NEW_BATCH_RECEIPT',
        referenceId: batch.batchNumber,
        performedByUserId: authUser.id,
        notes: `New batch ${batch.batchNumber} received`,
      },
    });

    await createAuditLog({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'CREATE_BATCH',
      entityType: 'INVENTORY_BATCH',
      entityId: batch.id,
      newValues: { batchNumber: finalBatchNumber, quantity: numQty, warehouseId: targetWarehouseId },
    });

    return NextResponse.json({ batch, stock }, { status: 201 });
  } catch (error: any) {
    console.error('Create batch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create batch' }, { status: 500 });
  }
}
