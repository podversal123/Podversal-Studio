import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  {
    type: ServiceType.PODCAST,
    name: 'Podcast Studio',
    description: 'Professional podcast recording with high-end microphones, acoustic treatment, and multi-channel mixing.',
    pricePerHour: 1500,
    minDuration: 1,
  },
  {
    type: ServiceType.VFX_PODCAST,
    name: 'VFX Podcast',
    description: 'Podcast recording with dynamic visual effects, LED backdrops, and live motion graphics.',
    pricePerHour: 2500,
    minDuration: 2,
  },
  {
    type: ServiceType.MONOLOGUE,
    name: 'Monologue Shoot',
    description: 'Single-speaker video production with teleprompter support, professional lighting, and multi-angle cameras.',
    pricePerHour: 2000,
    minDuration: 1,
  },
  {
    type: ServiceType.NEWS_SHOOT,
    name: 'News Shoot',
    description: 'Broadcast-quality news segment production with chroma key backgrounds and professional anchor setups.',
    pricePerHour: 2000,
    minDuration: 1,
  },
  {
    type: ServiceType.ONLINE_CLASS,
    name: 'Online Classes',
    description: 'Distraction-free filming environment for educators with screen recording integration.',
    pricePerHour: 1200,
    minDuration: 1,
  },
  {
    type: ServiceType.PRODUCT_SHOOT,
    name: 'Product Shoot',
    description: 'Studio-grade product photography and videography with controlled lighting and multiple backdrops.',
    pricePerHour: 3000,
    minDuration: 2,
  },
];

async function main() {
  console.log('Seeding services...');

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { type: service.type },
      update: {},
      create: service,
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
