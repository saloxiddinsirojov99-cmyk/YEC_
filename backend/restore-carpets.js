const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const prisma = new PrismaClient();

const sizeOptions = [
  '300x400', '300x500', '350x500', 
  '400x500', '400x600', '450x600', 
  '500x700', '500x800'
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max, step = 1000) => {
  const span = Math.floor((max - min) / step);
  return min + step * Math.floor(Math.random() * (span + 1));
};

async function run() {
  const csvPath = path.join(__dirname, '..', '..', 'front', 'carpet_mapping.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
  
  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.includes(',')) continue;
    // "Mardin M505C","cuid...","Classic"
    const match = line.match(/"([^"]+)","([^"]+)","([^"]+)"/);
    if (!match) continue;
    
    const [_, fullName, oldId, categoryPattern] = match;
    
    // Check if exists
    const existing = await prisma.carpet.findFirst({ where: { name: fullName } });
    if (existing) {
      skipped++;
      continue;
    }

    let category = await prisma.category.findFirst({ where: { name: categoryPattern } });
    if (!category) {
      category = await prisma.category.create({ data: { name: categoryPattern } });
    }

    const sizeStr = pickRandom(sizeOptions);
    const [w, h] = sizeStr.split('x').map(Number);
    const area = (w * h) / 10000;
    const pricePerM2 = randomInt(58000, 550000, 1000);
    const totalPrice = Math.round((pricePerM2 * area) / 1000) * 1000;
    
    // Parse collection from name e.g. "Mardin M505C" -> "mardin" and "M505C"
    // Eron Soft E302A -> "eron-soft" -> ? Wait, let's just use first word or two.
    let slug = fullName.split(' ')[0].toLowerCase();
    const rest = fullName.substring(fullName.indexOf(' ') + 1);
    
    if (fullName.toLowerCase().startsWith('eron soft')) slug = 'eron-soft';
    if (fullName.toLowerCase().startsWith('iran soft')) slug = 'iran-soft';
    
    const imgCode = rest.replace(/[^A-Za-z0-9]/g, '');
    const imageUrl = `/images/collections/${slug}/${imgCode}.jpg`;

    await prisma.carpet.create({
      data: {
        // id: oldId, // we could keep original ID to avoid breaking old order links? YES! Let's try to restore with original ID!
        id: oldId,
        name: fullName,
        price: totalPrice,
        stock: randomInt(1, 4, 1),
        size: sizeStr,
        material: 'Paxta + akril', // fallback
        description: 'YEC korxonasining Eron texnologiyasida ishlab chiqarilgan premium gilami. Yumshoq, chidamli va uzoq xizmat qiladi.',
        categoryId: category.id,
        images: [imageUrl]
      }
    });
    created++;
  }
  
  console.log(`Bajarildi. Tiklandi: ${created}. O'tkazib yuborildi: ${skipped}.`);
  await prisma.$disconnect();
}

run().catch(console.error);
