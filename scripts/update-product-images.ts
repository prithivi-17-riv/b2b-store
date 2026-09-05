import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCT_IMAGES: Record<string, string> = {
  'RICE-PON-01': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'RICE-SON-02': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&auto=format&fit=crop&q=80',
  'PUL-TOOR-01': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
  'PUL-URAD-02': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'PUL-MOON-03': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'SUG-M30-01': 'https://images.unsplash.com/photo-1622484212850-cab596d66e74?w=400&auto=format&fit=crop&q=80',
  'OIL-SUN-01': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
  'OIL-SES-02': 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&auto=format&fit=crop&q=80',
  'FLR-ATTA-01': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  'FLR-MAI-02': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'SPC-CHL-01': 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&auto=format&fit=crop&q=80',
  'SPC-SLT-02': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&auto=format&fit=crop&q=80',
  'CLN-SRF-01': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80',
  'FMC-TEA-01': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
};

async function main() {
  console.log('Updating product photos in database...');
  for (const [sku, imageUrl] of Object.entries(PRODUCT_IMAGES)) {
    const updated = await prisma.product.updateMany({
      where: { sku },
      data: { imageUrl },
    });
    console.log(`Updated ${sku}: ${updated.count} record(s) with photo URL`);
  }
  console.log('Product photos update complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
