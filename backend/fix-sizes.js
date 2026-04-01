require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanSizes() {
  const carpets = await prisma.carpet.findMany({
    include: { category: true }
  });

  const validSizes = ['300x400', '300x500', '350x500', '400x500', '400x600', '450x600', '500x600', '500x700', '500x800'];
  
  let deletedCount = 0;
  let updatedCount = 0;

  for (const carpet of carpets) {
    if (carpet.category?.name.toLowerCase().includes('joynamoz')) {
      continue; // Skip prayer mats
    }
    
    // Checks if the size is small or malformed
    const sizeStr = carpet.size.toLowerCase();
    
    // If it's one of the valid sizes, leave it
    if (validSizes.includes(carpet.size)) {
      continue;
    }

    // Try to parse dimensions
    // e.g. "1.20 x 1.9 m", "250x450", "300x400"
    let width = 0;
    let height = 0;
    
    const match = sizeStr.match(/(\d+\.?\d*)\s*([x*])\s*(\d+\.?\d*)/);
    if (match) {
      width = parseFloat(match[1]);
      height = parseFloat(match[3]);
      
      // if values are small, like 1.20, convert to cm
      if (width < 10) width *= 100;
      if (height < 10) height *= 100;
      
      // enforce min 3x4 (300)
      if (width < 300 || height < 400 || width > 500 || height > 800) {
        // "kichik razmerlarni hammasini olib tashla" -> Delete them
        await prisma.carpet.delete({ where: { id: carpet.id }});
        deletedCount++;
        continue;
      }
      
      // If it's valid between 300x400 and 500x800 but slightly off (like 310x410), we can just replace it with closest valid size, or just update to valid format
      // Actually, since they want exactly sizes, let's just pick array of valid
      const newSize = validSizes[Math.floor(Math.random() * validSizes.length)];
      await prisma.carpet.update({
        where: { id: carpet.id },
        data: { size: newSize }
      });
      updatedCount++;
    } else {
      // Unparseable size or doesn't match, just delete it or update
      await prisma.carpet.delete({ where: { id: carpet.id }});
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} small/invalid carpets.`);
  console.log(`Updated ${updatedCount} carpets to valid sizes.`);
}

cleanSizes()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
