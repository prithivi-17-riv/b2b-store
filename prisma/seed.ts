import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding B2B Grocery Wholesale & Distribution system...');

  // Clear existing data in reverse order of foreign keys
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.creditNote.deleteMany({});
  await prisma.returnItem.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.inventoryBatch.deleteMany({});
  await prisma.inventoryStock.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.productPrice.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.priceCategory.deleteMany({});
  await prisma.customerLedger.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.taxConfiguration.deleteMany({});
  await prisma.companyProfile.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Company Profile
  await prisma.companyProfile.create({
    data: {
      name: 'Annapoorna Wholesale Distributors Pvt Ltd',
      tradeName: 'Annapoorna FMCG Direct',
      gstin: '33AAACA1234A1Z5',
      pan: 'AAACA1234A',
      address: 'Plot No 45, Industrial Estate, Hope College',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '641014',
      phone: '+91 98765 43210',
      email: 'orders@annapoornab2b.com',
      bankName: 'HDFC Bank',
      bankAccountNumber: '50200012345678',
      bankIfsc: 'HDFC0000123',
      bankBranch: 'Avinashi Road Branch, Coimbatore',
      termsAndConditions: '1. Payment strictly due as per agreed credit terms.\n2. Goods once sold cannot be returned without authorized Return Authorization.\n3. Discrepancies if any must be reported within 24 hours of delivery.\n4. Subject to Coimbatore Jurisdiction only.',
      invoicePrefix: 'INV-2026-',
      invoiceNextNumber: 1005,
      orderPrefix: 'ORD-2026-',
      orderNextNumber: 5006,
      creditNotePrefix: 'CN-2026-',
      creditNoteNextNumber: 202,
    },
  });

  // 2. Tax Configurations
  await prisma.taxConfiguration.createMany({
    data: [
      { name: 'GST 0% (Exempt)', cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0, isDefault: false },
      { name: 'GST 5% (Essential Grocery)', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5.0, cessRate: 0, isDefault: true },
      { name: 'GST 12% (Processed Foods)', cgstRate: 6.0, sgstRate: 6.0, igstRate: 12.0, cessRate: 0, isDefault: false },
      { name: 'GST 18% (FMCG & Cleaning)', cgstRate: 9.0, sgstRate: 9.0, igstRate: 18.0, cessRate: 0, isDefault: false },
      { name: 'GST 28% (Luxury & Aerated)', cgstRate: 14.0, sgstRate: 14.0, igstRate: 28.0, cessRate: 0, isDefault: false },
    ],
  });

  // 3. Users & Employees
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const staffPassword = bcrypt.hashSync('staff123', 10);
  const salesPassword = bcrypt.hashSync('sales123', 10);
  const whPassword = bcrypt.hashSync('wh123', 10);
  const delPassword = bcrypt.hashSync('del123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'admin@annapoorna.com',
      phone: '9842100001',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'Arun Kumar',
      email: 'arun@annapoorna.com',
      phone: '9842100002',
      passwordHash: salesPassword,
      role: 'SALES_EMPLOYEE',
      employeeProfile: {
        create: {
          employeeCode: 'EMP-001',
          territory: 'Coimbatore North & West',
          notes: 'Senior Field Sales Officer',
        },
      },
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Kavitha R',
      email: 'kavitha@annapoorna.com',
      phone: '9842100003',
      passwordHash: salesPassword,
      role: 'SALES_EMPLOYEE',
      employeeProfile: {
        create: {
          employeeCode: 'EMP-002',
          territory: 'Coimbatore South & Tirupur',
          notes: 'Key Account Executive',
        },
      },
    },
  });

  const warehouseStaff = await prisma.user.create({
    data: {
      name: 'Muthu Pandi',
      email: 'muthu@annapoorna.com',
      phone: '9842100004',
      passwordHash: whPassword,
      role: 'WAREHOUSE_STAFF',
      employeeProfile: {
        create: {
          employeeCode: 'WH-001',
          territory: 'Central Godown',
          notes: 'Warehouse & Logistics Supervisor',
        },
      },
    },
  });

  const deliveryStaff = await prisma.user.create({
    data: {
      name: 'Selvam K',
      email: 'selvam@annapoorna.com',
      phone: '9842100005',
      passwordHash: delPassword,
      role: 'DELIVERY_STAFF',
      employeeProfile: {
        create: {
          employeeCode: 'DEL-001',
          territory: 'Fleet Operations',
          notes: 'Heavy Vehicle Dispatch Driver - TN 38 BJ 4590',
        },
      },
    },
  });

  // 4. Warehouses
  const whCentral = await prisma.warehouse.create({
    data: {
      name: 'Central Godown - Peelamedu',
      code: 'WH-CBE-01',
      address: 'Plot 45, Industrial Estate, Peelamedu',
      city: 'Coimbatore',
      managerName: 'Muthu Pandi',
      contactPhone: '9842100004',
    },
  });

  const whTirupur = await prisma.warehouse.create({
    data: {
      name: 'Tirupur Regional Godown',
      code: 'WH-TPR-02',
      address: '22 Ring Road, Avinashi Byepass',
      city: 'Tirupur',
      managerName: 'Ganesan S',
      contactPhone: '9842100008',
    },
  });

  // 5. Product Categories
  const catRice = await prisma.productCategory.create({
    data: { name: 'Rice & Grains', code: 'RICE', description: 'Raw, Boiled, Basmati & Specialty Rice Varieties' },
  });
  const catPulses = await prisma.productCategory.create({
    data: { name: 'Pulses & Dals', code: 'PULSES', description: 'Toor, Moong, Urad, Chana & Lentils' },
  });
  const catOils = await prisma.productCategory.create({
    data: { name: 'Edible Oils & Ghee', code: 'OILS', description: 'Sunflower, Sesame, Groundnut, Palm & Ghee' },
  });
  const catFlour = await prisma.productCategory.create({
    data: { name: 'Flour & Atta', code: 'FLOUR', description: 'Wheat Atta, Maida, Sooji, Rava, Besan' },
  });
  const catSugar = await prisma.productCategory.create({
    data: { name: 'Sugar & Sweeteners', code: 'SUGAR', description: 'Refined Sugar, Jaggery, Country Sugar' },
  });
  const catSpices = await prisma.productCategory.create({
    data: { name: 'Spices & Masalas', code: 'SPICES', description: 'Chilli, Coriander, Turmeric, Pepper, Salt' },
  });
  const catCleaning = await prisma.productCategory.create({
    data: { name: 'Cleaning & Detergents', code: 'CLEANING', description: 'Soaps, Detergent Powders, Floor Cleaners' },
  });
  const catFMCG = await prisma.productCategory.create({
    data: { name: 'Packaged FMCG & Tea', code: 'FMCG', description: 'Tea, Coffee, Biscuits, Packaged Dry Foods' },
  });

  // 6. Price Categories
  const pcBulk = await prisma.priceCategory.create({
    data: { name: 'Bulk', code: 'BULK', description: 'High-volume orders (50+ units), competitive wholesale margins' },
  });
  const pcLoose = await prisma.priceCategory.create({
    data: { name: 'Loose', code: 'LOOSE', description: 'Split bags and small quantity orders with handling cost' },
  });
  const pcWholesale = await prisma.priceCategory.create({
    data: { name: 'Wholesale', code: 'WHOLESALE', description: 'Standard B2B tier for mid-sized supermarkets' },
  });
  const pcRetail = await prisma.priceCategory.create({
    data: { name: 'Retail', code: 'RETAIL', description: 'Direct kirana store retail pricing' },
  });
  const pcSpecial = await prisma.priceCategory.create({
    data: { name: 'Special', code: 'SPECIAL', description: 'Key account contracted rate with special subsidy' },
  });

  // 7. Products and Prices Matrix
  const productDefinitions = [
    {
      sku: 'RICE-PON-01',
      barcode: '890100100001',
      name: 'Ponni Boiled Rice Deluxe (25kg)',
      brand: 'Annapoorna Royal',
      categoryId: catRice.id,
      uom: 'BAG',
      packSize: '25 kg Bag',
      hsnCode: '10063010',
      gstRate: 5.0,
      mrp: 1650,
      purchasePrice: 1100,
      minStockLevel: 50,
      prices: { Bulk: 1200, Loose: 1300, Wholesale: 1250, Retail: 1450, Special: 1180 },
      stockCentral: 450,
      batches: [
        { num: 'BAT-2026-R01', mfg: new Date('2026-06-15'), exp: new Date('2027-06-14'), qty: 250, price: 1100 },
        { num: 'BAT-2026-R02', mfg: new Date('2026-07-20'), exp: new Date('2027-07-19'), qty: 200, price: 1120 },
      ],
    },
    {
      sku: 'RICE-SON-02',
      barcode: '890100100002',
      name: 'Sona Masoori Raw Rice Premium (25kg)',
      brand: 'Kaveri Pure',
      categoryId: catRice.id,
      uom: 'BAG',
      packSize: '25 kg Bag',
      hsnCode: '10063010',
      gstRate: 5.0,
      mrp: 1550,
      purchasePrice: 1050,
      minStockLevel: 40,
      prices: { Bulk: 1150, Loose: 1250, Wholesale: 1200, Retail: 1380, Special: 1130 },
      stockCentral: 320,
      batches: [
        { num: 'BAT-2026-SM01', mfg: new Date('2026-05-10'), exp: new Date('2027-05-09'), qty: 320, price: 1050 },
      ],
    },
    {
      sku: 'PUL-TOOR-01',
      barcode: '890100200001',
      name: 'Unpolished Toor Dal Grade A (per kg)',
      brand: 'Desi Gold',
      categoryId: catPulses.id,
      uom: 'KG',
      packSize: 'Loose / 50kg Gunny',
      hsnCode: '07136000',
      gstRate: 5.0,
      mrp: 160,
      purchasePrice: 102,
      minStockLevel: 300,
      prices: { Bulk: 110, Loose: 118, Wholesale: 114, Retail: 128, Special: 108 },
      stockCentral: 2500,
      batches: [
        { num: 'BAT-2026-TD01', mfg: new Date('2026-07-01'), exp: new Date('2027-01-01'), qty: 1500, price: 102 },
        { num: 'BAT-2026-TD02', mfg: new Date('2026-08-01'), exp: new Date('2027-02-01'), qty: 1000, price: 104 },
      ],
    },
    {
      sku: 'PUL-URAD-02',
      barcode: '890100200002',
      name: 'Urad Dal Gota White (per kg)',
      brand: 'Desi Gold',
      categoryId: catPulses.id,
      uom: 'KG',
      packSize: 'Loose / 30kg Bag',
      hsnCode: '07133110',
      gstRate: 5.0,
      mrp: 155,
      purchasePrice: 98,
      minStockLevel: 200,
      prices: { Bulk: 108, Loose: 116, Wholesale: 112, Retail: 125, Special: 105 },
      stockCentral: 1800,
      batches: [
        { num: 'BAT-2026-UD01', mfg: new Date('2026-06-25'), exp: new Date('2026-12-25'), qty: 1800, price: 98 },
      ],
    },
    {
      sku: 'PUL-MOON-03',
      barcode: '890100200003',
      name: 'Moong Dal Washed Yellow (per kg)',
      brand: 'Desi Gold',
      categoryId: catPulses.id,
      uom: 'KG',
      packSize: 'Loose / 30kg Bag',
      hsnCode: '07133100',
      gstRate: 5.0,
      mrp: 140,
      purchasePrice: 90,
      minStockLevel: 150,
      prices: { Bulk: 98, Loose: 106, Wholesale: 102, Retail: 115, Special: 95 },
      stockCentral: 1200,
      batches: [
        { num: 'BAT-2026-MD01', mfg: new Date('2026-07-10'), exp: new Date('2027-01-10'), qty: 1200, price: 90 },
      ],
    },
    {
      sku: 'SUG-M30-01',
      barcode: '890100300001',
      name: 'Crystal Pure Sugar M30 (per kg)',
      brand: 'Bannari Sugar',
      categoryId: catSugar.id,
      uom: 'KG',
      packSize: '50 kg Bag',
      hsnCode: '17019990',
      gstRate: 5.0,
      mrp: 50,
      purchasePrice: 38,
      minStockLevel: 500,
      prices: { Bulk: 42, Loose: 45, Wholesale: 44, Retail: 48, Special: 41.5 },
      stockCentral: 8000,
      batches: [
        { num: 'BAT-2026-SG01', mfg: new Date('2026-07-01'), exp: new Date('2028-06-30'), qty: 8000, price: 38 },
      ],
    },
    {
      sku: 'OIL-SUN-01',
      barcode: '890100400001',
      name: 'Gold Winner Refined Sunflower Oil (Carton 15L)',
      brand: 'Gold Winner',
      categoryId: catOils.id,
      uom: 'CARTON',
      packSize: '15 x 1L Pouches',
      hsnCode: '15121910',
      gstRate: 5.0,
      mrp: 2150,
      purchasePrice: 1550,
      minStockLevel: 30,
      prices: { Bulk: 1650, Loose: 1750, Wholesale: 1700, Retail: 1900, Special: 1620 },
      stockCentral: 220,
      batches: [
        { num: 'BAT-2026-GW01', mfg: new Date('2026-07-15'), exp: new Date('2027-04-14'), qty: 220, price: 1550 },
      ],
    },
    {
      sku: 'OIL-SES-02',
      barcode: '890100400002',
      name: 'Idhayam Gingelly Sesame Oil (Carton 10L)',
      brand: 'Idhayam',
      categoryId: catOils.id,
      uom: 'CARTON',
      packSize: '10 x 1L Bottles',
      hsnCode: '15155091',
      gstRate: 5.0,
      mrp: 3300,
      purchasePrice: 2400,
      minStockLevel: 20,
      prices: { Bulk: 2550, Loose: 2750, Wholesale: 2650, Retail: 2950, Special: 2500 },
      stockCentral: 140,
      batches: [
        { num: 'BAT-2026-ID01', mfg: new Date('2026-06-01'), exp: new Date('2027-05-31'), qty: 140, price: 2400 },
      ],
    },
    {
      sku: 'FLR-ATTA-01',
      barcode: '890100500001',
      name: 'Aashirvaad Shudh Chakki Atta (10kg Bag)',
      brand: 'ITC Aashirvaad',
      categoryId: catFlour.id,
      uom: 'BAG',
      packSize: '10 kg Poly Bag',
      hsnCode: '11010000',
      gstRate: 5.0,
      mrp: 490,
      purchasePrice: 360,
      minStockLevel: 40,
      prices: { Bulk: 390, Loose: 425, Wholesale: 410, Retail: 460, Special: 380 },
      stockCentral: 350,
      batches: [
        { num: 'BAT-2026-AT01', mfg: new Date('2026-08-01'), exp: new Date('2026-11-01'), qty: 350, price: 360 },
      ],
    },
    {
      sku: 'FLR-MAI-02',
      barcode: '890100500002',
      name: 'Superior Maida Superfine (25kg Bag)',
      brand: 'Annapoorna Royal',
      categoryId: catFlour.id,
      uom: 'BAG',
      packSize: '25 kg Bag',
      hsnCode: '11010000',
      gstRate: 5.0,
      mrp: 980,
      purchasePrice: 680,
      minStockLevel: 25,
      prices: { Bulk: 740, Loose: 800, Wholesale: 770, Retail: 880, Special: 720 },
      stockCentral: 180,
      batches: [
        { num: 'BAT-2026-MA01', mfg: new Date('2026-07-15'), exp: new Date('2026-10-15'), qty: 180, price: 680 },
      ],
    },
    {
      sku: 'SPC-CHL-01',
      barcode: '890100600001',
      name: 'Everest Tikhalal Red Chilli Powder (Box 10kg)',
      brand: 'Everest',
      categoryId: catSpices.id,
      uom: 'BOX',
      packSize: '20 x 500g Pouches',
      hsnCode: '09042211',
      gstRate: 5.0,
      mrp: 2900,
      purchasePrice: 2000,
      minStockLevel: 15,
      prices: { Bulk: 2150, Loose: 2350, Wholesale: 2250, Retail: 2550, Special: 2100 },
      stockCentral: 95,
      batches: [
        { num: 'BAT-2026-EV01', mfg: new Date('2026-06-01'), exp: new Date('2027-05-31'), qty: 95, price: 2000 },
      ],
    },
    {
      sku: 'SPC-SLT-02',
      barcode: '890100600002',
      name: 'Tata Salt Vacuum Evaporated Iodized (Carton 25kg)',
      brand: 'Tata Consumer',
      categoryId: catSpices.id,
      uom: 'CARTON',
      packSize: '25 x 1kg Packets',
      hsnCode: '25010010',
      gstRate: 0.0,
      mrp: 625,
      purchasePrice: 420,
      minStockLevel: 30,
      prices: { Bulk: 460, Loose: 500, Wholesale: 480, Retail: 550, Special: 450 },
      stockCentral: 210,
      batches: [
        { num: 'BAT-2026-TS01', mfg: new Date('2026-04-01'), exp: new Date('2028-03-31'), qty: 210, price: 420 },
      ],
    },
    {
      sku: 'CLN-SRF-01',
      barcode: '890100700001',
      name: 'Surf Excel Quick Wash Detergent (Carton 12kg)',
      brand: 'Hindustan Unilever',
      categoryId: catCleaning.id,
      uom: 'CARTON',
      packSize: '12 x 1kg Packs',
      hsnCode: '34022010',
      gstRate: 18.0,
      mrp: 1980,
      purchasePrice: 1380,
      minStockLevel: 20,
      prices: { Bulk: 1490, Loose: 1620, Wholesale: 1550, Retail: 1750, Special: 1460 },
      stockCentral: 120,
      batches: [
        { num: 'BAT-2026-SE01', mfg: new Date('2026-05-15'), exp: new Date('2028-05-14'), qty: 120, price: 1380 },
      ],
    },
    {
      sku: 'FMC-TEA-01',
      barcode: '890100800001',
      name: 'Tata Tea Premium Leaf (Master Box 10kg)',
      brand: 'Tata Consumer',
      categoryId: catFMCG.id,
      uom: 'BOX',
      packSize: '20 x 500g Cartons',
      hsnCode: '09024020',
      gstRate: 5.0,
      mrp: 3400,
      purchasePrice: 2400,
      minStockLevel: 15,
      prices: { Bulk: 2580, Loose: 2780, Wholesale: 2680, Retail: 3000, Special: 2520 },
      stockCentral: 85,
      batches: [
        { num: 'BAT-2026-TT01', mfg: new Date('2026-06-20'), exp: new Date('2027-06-19'), qty: 85, price: 2400 },
      ],
    },
  ];

  const priceCategoryMap = {
    Bulk: pcBulk.id,
    Loose: pcLoose.id,
    Wholesale: pcWholesale.id,
    Retail: pcRetail.id,
    Special: pcSpecial.id,
  };

  for (const p of productDefinitions) {
    const createdProduct = await prisma.product.create({
      data: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        brand: p.brand,
        categoryId: p.categoryId,
        uom: p.uom,
        packSize: p.packSize,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        mrp: p.mrp,
        purchasePrice: p.purchasePrice,
        minStockLevel: p.minStockLevel,
      },
    });

    // Create Price Matrix
    for (const [catName, priceVal] of Object.entries(p.prices)) {
      const pcId = priceCategoryMap[catName as keyof typeof priceCategoryMap];
      if (pcId) {
        await prisma.productPrice.create({
          data: {
            productId: createdProduct.id,
            priceCategoryId: pcId,
            price: priceVal,
          },
        });
      }
    }

    // Inventory Stock
    await prisma.inventoryStock.create({
      data: {
        warehouseId: whCentral.id,
        productId: createdProduct.id,
        availableQuantity: p.stockCentral,
        reservedQuantity: 0,
        dispatchedQuantity: 0,
        damagedQuantity: 0,
        returnedQuantity: 0,
      },
    });

    // Batches
    for (const b of p.batches) {
      const batch = await prisma.inventoryBatch.create({
        data: {
          warehouseId: whCentral.id,
          productId: createdProduct.id,
          batchNumber: b.num,
          manufacturingDate: b.mfg,
          expiryDate: b.exp,
          quantity: b.qty,
          purchasePrice: b.price,
          status: 'ACTIVE',
        },
      });

      await prisma.stockMovement.create({
        data: {
          warehouseId: whCentral.id,
          productId: createdProduct.id,
          batchId: batch.id,
          movementType: 'PURCHASE_RECEIPT',
          quantity: b.qty,
          referenceType: 'MANUAL_INITIAL_SEED',
          referenceId: b.num,
          performedByUserId: admin.id,
          notes: `Initial opening stock receipt for ${p.name}`,
        },
      });
    }
  }

  // 8. Customers
  const customerList = [
    {
      code: 'CUST-001',
      storeName: 'Sri Lakshmi Stores',
      ownerName: 'V. Ramasamy',
      phone: '9843012345',
      altPhone: '0422-2567890',
      email: 'srilakshmistores@gmail.com',
      billingAddress: '142 Cross Cut Road, Gandhipuram',
      deliveryAddress: '142 Cross Cut Road, Gandhipuram',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '641012',
      gstin: '33AAACL1234F1Z1',
      pan: 'AAACL1234F',
      customerType: 'SUPERMARKET',
      assignedEmployeeId: sales1.id,
      creditLimit: 500000,
      paymentTermsDays: 30,
      openingBalance: 45000,
      currentOutstanding: 145000,
      notes: 'Premier supermarket client, high bulk buyer on 30-day cycle',
    },
    {
      code: 'CUST-002',
      storeName: 'ABC Supermarket',
      ownerName: 'K. Balaji',
      phone: '9843054321',
      altPhone: '0422-2345678',
      email: 'orders@abcsupermarket.in',
      billingAddress: '88 Mettupalayam Road, RS Puram',
      deliveryAddress: '88 Mettupalayam Road, RS Puram',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '641002',
      gstin: '33BBBPB5678G1Z2',
      pan: 'BBBPB5678G',
      customerType: 'SUPERMARKET',
      assignedEmployeeId: sales1.id,
      creditLimit: 800000,
      paymentTermsDays: 21,
      openingBalance: 0,
      currentOutstanding: 284000,
      notes: 'Large multi-aisle grocery store',
    },
    {
      code: 'CUST-003',
      storeName: 'Kumar Traders',
      ownerName: 'P. Kumar',
      phone: '9843098765',
      altPhone: null,
      email: 'kumartraders.tpr@gmail.com',
      billingAddress: '15 Kumaran Road',
      deliveryAddress: 'Warehouse No 4, Ring Road Industrial Area',
      city: 'Tirupur',
      district: 'Tirupur',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '641601',
      gstin: '33CCCPA9876H1Z3',
      pan: 'CCCPA9876H',
      customerType: 'WHOLESALER',
      assignedEmployeeId: sales2.id,
      creditLimit: 300000,
      paymentTermsDays: 15,
      openingBalance: 15000,
      currentOutstanding: 85000,
      notes: 'Semi-wholesaler supplying local tea stalls and bakeries',
    },
    {
      code: 'CUST-004',
      storeName: 'XYZ Mega Mart (Bangalore)',
      ownerName: 'Anil Deshmukh',
      phone: '9880198801',
      altPhone: '080-25589999',
      email: 'purchase@xyzmart.com',
      billingAddress: '404 100ft Road, Indiranagar',
      deliveryAddress: 'Central Logistics Hub, Hosur Road',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560038',
      gstin: '29DDDPA4321J1Z4',
      pan: 'DDDPA4321J',
      customerType: 'SUPERMARKET',
      assignedEmployeeId: sales1.id,
      creditLimit: 600000,
      paymentTermsDays: 15,
      openingBalance: 0,
      currentOutstanding: 0,
      notes: 'Interstate customer - IGST 5% applicable',
    },
    {
      code: 'CUST-005',
      storeName: 'Murugan Kirana & Provisions',
      ownerName: 'M. Murugesan',
      phone: '9443211223',
      altPhone: null,
      email: null,
      billingAddress: '12 Bazaar Street, Market Gate',
      deliveryAddress: '12 Bazaar Street, Market Gate',
      city: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '642001',
      gstin: null,
      pan: null,
      customerType: 'KIRANA_STORE',
      assignedEmployeeId: sales2.id,
      creditLimit: 100000,
      paymentTermsDays: 7,
      openingBalance: 5000,
      currentOutstanding: 32000,
      notes: 'Unregistered Kirana store, weekly cash/UPI payments',
    },
  ];

  for (const c of customerList) {
    const cust = await prisma.customer.create({
      data: {
        customerCode: c.code,
        storeName: c.storeName,
        ownerName: c.ownerName,
        phone: c.phone,
        altPhone: c.altPhone,
        email: c.email,
        billingAddress: c.billingAddress,
        deliveryAddress: c.deliveryAddress,
        city: c.city,
        district: c.district,
        state: c.state,
        stateCode: c.stateCode,
        pincode: c.pincode,
        gstin: c.gstin,
        pan: c.pan,
        customerType: c.customerType,
        assignedEmployeeId: c.assignedEmployeeId,
        creditLimit: c.creditLimit,
        paymentTermsDays: c.paymentTermsDays,
        openingBalance: c.openingBalance,
        currentOutstanding: c.currentOutstanding,
        notes: c.notes,
      },
    });

    if (c.openingBalance > 0) {
      await prisma.customerLedger.create({
        data: {
          customerId: cust.id,
          transactionDate: new Date('2026-04-01'),
          type: 'OPENING_BALANCE',
          referenceNumber: 'OPB-2026',
          debitAmount: c.openingBalance,
          creditAmount: 0,
          runningBalance: c.openingBalance,
          notes: 'FY 2026-27 Opening Balance',
        },
      });
    }
  }

  // 9. Initial Order, Invoice & Ledger for Sri Lakshmi Stores
  const lakshmiCust = await prisma.customer.findFirst({ where: { customerCode: 'CUST-001' } });
  const ponniProduct = await prisma.product.findFirst({ where: { sku: 'RICE-PON-01' } });
  const toorProduct = await prisma.product.findFirst({ where: { sku: 'PUL-TOOR-01' } });
  const sugarProduct = await prisma.product.findFirst({ where: { sku: 'SUG-M30-01' } });
  const oilProduct = await prisma.product.findFirst({ where: { sku: 'OIL-SUN-01' } });

  if (lakshmiCust && ponniProduct && toorProduct && sugarProduct && oilProduct) {
    // Order 1: Bulk order
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-5001',
        customerId: lakshmiCust.id,
        salesEmployeeId: sales1.id,
        priceCategoryId: pcBulk.id,
        warehouseId: whCentral.id,
        status: 'DELIVERED',
        orderDate: new Date('2026-08-20'),
        itemCount: 4,
        totalQuantity: 220,
        subtotal: 100000,
        discountAmount: 0,
        taxableAmount: 100000,
        cgstAmount: 2500,
        sgstAmount: 2500,
        igstAmount: 0,
        cessAmount: 0,
        roundOff: 0,
        grandTotal: 105000,
        notes: 'Monthly bulk replenishment order',
        items: {
          create: [
            {
              productId: ponniProduct.id,
              productName: ponniProduct.name,
              hsnCode: ponniProduct.hsnCode,
              uom: ponniProduct.uom,
              quantity: 50,
              unitRate: 1200,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 60000,
              gstRate: 5,
              cgstRate: 2.5,
              cgstAmount: 1500,
              sgstRate: 2.5,
              sgstAmount: 1500,
              igstRate: 0,
              igstAmount: 0,
              totalAmount: 63000,
            },
            {
              productId: sugarProduct.id,
              productName: sugarProduct.name,
              hsnCode: sugarProduct.hsnCode,
              uom: sugarProduct.uom,
              quantity: 100,
              unitRate: 42,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 4200,
              gstRate: 5,
              cgstRate: 2.5,
              cgstAmount: 105,
              sgstRate: 2.5,
              sgstAmount: 105,
              igstRate: 0,
              igstAmount: 0,
              totalAmount: 4410,
            },
            {
              productId: toorProduct.id,
              productName: toorProduct.name,
              hsnCode: toorProduct.hsnCode,
              uom: toorProduct.uom,
              quantity: 50,
              unitRate: 110,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 5500,
              gstRate: 5,
              cgstRate: 2.5,
              cgstAmount: 137.5,
              sgstRate: 2.5,
              sgstAmount: 137.5,
              igstRate: 0,
              igstAmount: 0,
              totalAmount: 5775,
            },
            {
              productId: oilProduct.id,
              productName: oilProduct.name,
              hsnCode: oilProduct.hsnCode,
              uom: oilProduct.uom,
              quantity: 20,
              unitRate: 1650,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 33000,
              gstRate: 5,
              cgstRate: 2.5,
              cgstAmount: 825,
              sgstRate: 2.5,
              sgstAmount: 825,
              igstRate: 0,
              igstAmount: 0,
              totalAmount: 34650,
            },
          ],
        },
      },
    });

    const invoice1 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-1001',
        orderId: order1.id,
        customerId: lakshmiCust.id,
        invoiceDate: new Date('2026-08-20'),
        dueDate: new Date('2026-09-19'),
        placeOfSupplyStateCode: '33',
        isInterstate: false,
        billingAddress: lakshmiCust.billingAddress,
        shippingAddress: lakshmiCust.deliveryAddress,
        customerGstin: lakshmiCust.gstin,
        taxableAmount: 102700,
        cgstAmount: 2567.5,
        sgstAmount: 2567.5,
        igstAmount: 0,
        cessAmount: 0,
        roundOff: 0,
        grandTotal: 107835,
        amountInWords: 'One Lakh Seven Thousand Eight Hundred and Thirty Five Rupees Only',
        paidAmount: 50000,
        balanceAmount: 57835,
        paymentStatus: 'PARTIALLY_PAID',
        items: {
          create: [
            {
              productId: ponniProduct.id,
              productName: ponniProduct.name,
              hsnCode: ponniProduct.hsnCode,
              uom: ponniProduct.uom,
              quantity: 50,
              unitRate: 1200,
              taxableAmount: 60000,
              gstRate: 5,
              cgstAmount: 1500,
              sgstAmount: 1500,
              igstAmount: 0,
              totalAmount: 63000,
            },
            {
              productId: sugarProduct.id,
              productName: sugarProduct.name,
              hsnCode: sugarProduct.hsnCode,
              uom: sugarProduct.uom,
              quantity: 100,
              unitRate: 42,
              taxableAmount: 4200,
              gstRate: 5,
              cgstAmount: 105,
              sgstAmount: 105,
              igstAmount: 0,
              totalAmount: 4410,
            },
            {
              productId: toorProduct.id,
              productName: toorProduct.name,
              hsnCode: toorProduct.hsnCode,
              uom: toorProduct.uom,
              quantity: 50,
              unitRate: 110,
              taxableAmount: 5500,
              gstRate: 5,
              cgstAmount: 137.5,
              sgstAmount: 137.5,
              igstAmount: 0,
              totalAmount: 5775,
            },
            {
              productId: oilProduct.id,
              productName: oilProduct.name,
              hsnCode: oilProduct.hsnCode,
              uom: oilProduct.uom,
              quantity: 20,
              unitRate: 1650,
              taxableAmount: 33000,
              gstRate: 5,
              cgstAmount: 825,
              sgstAmount: 825,
              igstAmount: 0,
              totalAmount: 34650,
            },
          ],
        },
      },
    });

    // Ledger for Invoice
    await prisma.customerLedger.create({
      data: {
        customerId: lakshmiCust.id,
        transactionDate: new Date('2026-08-20'),
        type: 'INVOICE',
        referenceId: invoice1.id,
        referenceNumber: invoice1.invoiceNumber,
        debitAmount: 107835,
        creditAmount: 0,
        runningBalance: 45000 + 107835,
        notes: 'Tax Invoice INV-2026-1001 for Bulk grocery order',
      },
    });

    // Payment of 50,000 against invoice
    const pay1 = await prisma.payment.create({
      data: {
        paymentNumber: 'PAY-2026-0801',
        customerId: lakshmiCust.id,
        invoiceId: invoice1.id,
        amount: 50000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/20260822/9843012345/99812',
        paymentDate: new Date('2026-08-22'),
        receivedByUserId: sales1.id,
        notes: 'Advance part-payment received via GPay by Field Officer Arun',
      },
    });

    // Ledger for Payment
    await prisma.customerLedger.create({
      data: {
        customerId: lakshmiCust.id,
        transactionDate: new Date('2026-08-22'),
        type: 'PAYMENT',
        referenceId: pay1.id,
        referenceNumber: pay1.paymentNumber,
        debitAmount: 0,
        creditAmount: 50000,
        runningBalance: 45000 + 107835 - 50000,
        notes: 'UPI Part-payment against INV-2026-1001',
      },
    });

    // Delivery record
    await prisma.delivery.create({
      data: {
        orderId: order1.id,
        invoiceId: invoice1.id,
        deliveryEmployeeId: deliveryStaff.id,
        vehicleNumber: 'TN 38 BJ 4590',
        dispatchTimestamp: new Date('2026-08-21T09:30:00Z'),
        expectedDeliveryDate: new Date('2026-08-21T14:00:00Z'),
        actualDeliveryDate: new Date('2026-08-21T13:45:00Z'),
        status: 'DELIVERED',
        proofOfDeliveryNotes: 'Delivered in full. Signed by store manager K. Senthil.',
        recipientName: 'K. Senthil',
        recipientPhone: '9843012345',
      },
    });
  }

  // 10. Audit Log Initial Entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: 'Rajesh Sharma',
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'ROOT',
      newValuesJson: JSON.stringify({ status: 'Initialized with master data and seed records' }),
      ipAddress: '127.0.0.1',
    },
  });

  // 11. Notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'NEW_ORDER',
        title: 'New Order Received',
        message: 'Order ORD-2026-5001 received from Sri Lakshmi Stores (₹1,07,835)',
        isRead: false,
        linkUrl: '/orders',
      },
      {
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: 'Tata Tea Premium Leaf is nearing minimum stock limit (85 units remaining)',
        isRead: false,
        linkUrl: '/inventory',
      },
      {
        type: 'OVERDUE_PAYMENT',
        title: 'Customer Payment Reminder',
        message: 'Murugan Kirana & Provisions has ₹32,000 outstanding beyond 7 days credit term',
        isRead: false,
        linkUrl: '/outstanding',
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
