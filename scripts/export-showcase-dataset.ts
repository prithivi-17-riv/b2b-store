import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const [
    products,
    categories,
    priceCategories,
    productPrices,
    customers,
    orders,
    invoices,
    inventoryStocks,
    inventoryBatches,
  ] = await Promise.all([
    prisma.product.findMany({ include: { category: true } }),
    prisma.productCategory.findMany(),
    prisma.priceCategory.findMany(),
    prisma.productPrice.findMany({ include: { priceCategory: true } }),
    prisma.customer.findMany(),
    prisma.order.findMany({ include: { items: true } }),
    prisma.invoice.findMany({ include: { items: true } }),
    prisma.inventoryStock.findMany({ include: { product: true } }),
    prisma.inventoryBatch.findMany({ include: { product: true } }),
  ]);

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      datasetName: 'Annapoorna B2B FMCG Grocery Wholesale Showcase Dataset',
      description: 'Realistic demonstration dataset containing products, pricing tiers, retail/supermarket customers, GST B2B orders, invoices, and inventory batches.',
    },
    summary: {
      totalProducts: products.length,
      totalCategories: categories.length,
      totalCustomers: customers.length,
      totalOrders: orders.length,
      totalInvoices: invoices.length,
      totalInventoryValuation: inventoryStocks.reduce((acc, s) => acc + (s.availableQuantity * (s.product.mrp || 0)), 0),
    },
    demoAccounts: [
      { role: 'ADMIN', name: 'Rajesh Sharma', email: 'admin@annapoorna.com', password: 'admin123', description: 'Full access to pricing matrix, approval, GST invoices, and company settings' },
      { role: 'SALES_EMPLOYEE', name: 'Arun Kumar', email: 'sales@annapoorna.com', password: 'sales123', description: 'Mobile-first field sales desk and customer order bookings' },
      { role: 'WAREHOUSE_STAFF', name: 'Muthu Pandi', email: 'warehouse@annapoorna.com', password: 'warehouse123', description: 'Stock inward receipts and batch management' },
      { role: 'DELIVERY_STAFF', name: 'Selvam K', email: 'delivery@annapoorna.com', password: 'delivery123', description: 'Vehicle fleet dispatches and delivery tracking' },
    ],
    categories: categories.map(c => ({
      name: c.name,
      code: c.code,
      description: c.description,
    })),
    priceCategories: priceCategories.map(pc => ({
      name: pc.name,
      code: pc.code,
      description: pc.description,
    })),
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category.name,
      imageUrl: p.imageUrl,
      uom: p.uom,
      packSize: p.packSize,
      mrp: p.mrp,
      gstRate: p.gstRate,
      prices: productPrices
        .filter(pr => pr.productId === p.id)
        .map(pr => ({ tier: pr.priceCategory.name, price: pr.price })),
    })),
    customers: customers.map(c => ({
      id: c.id,
      storeName: c.storeName,
      ownerName: c.ownerName,
      phone: c.phone,
      gstin: c.gstin,
      city: c.city,
      state: c.state,
      creditLimit: c.creditLimit,
      paymentTermsDays: c.paymentTermsDays,
      currentOutstanding: c.currentOutstanding,
    })),
    sampleOrders: orders.map(o => ({
      orderNumber: o.orderNumber,
      orderDate: o.orderDate,
      status: o.status,
      subtotal: o.subtotal,
      cgstAmount: o.cgstAmount,
      sgstAmount: o.sgstAmount,
      igstAmount: o.igstAmount,
      grandTotal: o.grandTotal,
      items: o.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitRate: item.unitRate,
        taxableAmount: item.taxableAmount,
        totalAmount: item.totalAmount,
      })),
    })),
    sampleInvoices: invoices.map(i => ({
      invoiceNumber: i.invoiceNumber,
      invoiceDate: i.invoiceDate,
      dueDate: i.dueDate,
      paymentStatus: i.paymentStatus,
      taxableAmount: i.taxableAmount,
      cgstAmount: i.cgstAmount,
      sgstAmount: i.sgstAmount,
      igstAmount: i.igstAmount,
      grandTotal: i.grandTotal,
      paidAmount: i.paidAmount,
      balanceAmount: i.balanceAmount,
      items: i.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitRate: item.unitRate,
        taxableAmount: item.taxableAmount,
        totalAmount: item.totalAmount,
      })),
    })),
    inventoryBatches: inventoryBatches.map(b => ({
      batchNumber: b.batchNumber,
      product: b.product.name,
      quantity: b.quantity,
      mfgDate: b.manufacturingDate,
      expiryDate: b.expiryDate,
      status: b.status,
    })),
  };

  const outputPath = path.join(dataDir, 'showcase-dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`Successfully exported showcase dataset to ${outputPath}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
