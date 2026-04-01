const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

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
  const csvPath = path.join(__dirname, '..', 'front', 'carpet_mapping.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
  
  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.includes(',')) continue;
    
    // "Mardin M505C","cuid...","Classic"
    // Handle quotes properly
    const parts = line.split('","');
    if (parts.length < 3) continue;
    
    const fullName = parts[0].replace(/^"/, '');
    const oldId = parts[1];
    const categoryPattern = parts[2].replace(/"$/, '').trim();
    
    // Check if exists
    const existingRes = await pool.query('SELECT id FROM carpets WHERE name = $1 LIMIT 1', [fullName]);
    if (existingRes.rows.length > 0) {
      skipped++;
      continue;
    }

    let categoryRes = await pool.query('SELECT id FROM categories WHERE name = $1 LIMIT 1', [categoryPattern]);
    let categoryId;
    if (categoryRes.rows.length > 0) {
      categoryId = categoryRes.rows[0].id;
    } else {
      // Create category on the fly? We need an ID like cuid. Let's just generate a simple random ID for the category or let the DB do it if default(cuid) is allowed, wait, PostgreSQL doesn't generate cuid automatically, Prisma does it via app layer.
      categoryId = 'cat_' + Math.random().toString(36).substr(2, 9);
      await pool.query('INSERT INTO categories (id, name, "updatedAt") VALUES ($1, $2, NOW())', [categoryId, categoryPattern]);
    }

    const sizeStr = pickRandom(sizeOptions);
    const [w, h] = sizeStr.split('x').map(Number);
    const area = (w * h) / 10000;
    const pricePerM2 = randomInt(58000, 550000, 1000);
    const totalPrice = Math.round((pricePerM2 * area) / 1000) * 1000;
    
    let slug = fullName.split(' ')[0].toLowerCase();
    const rest = fullName.substring(fullName.indexOf(' ') + 1);
    
    if (fullName.toLowerCase().startsWith('eron soft')) slug = 'eron-soft';
    if (fullName.toLowerCase().startsWith('iran soft')) slug = 'iran-soft';
    
    // Often image names are just the code, e.g. "505C". We can reconstruct:
    const imgCode = rest.replace(/[^A-Za-z0-9]/g, '');
    const imageUrl = `/images/collections/${slug}/${imgCode}.jpg`;

    // Make sure we generate the array format for PostgrSQL properly. For String[], we pass an array.
    const imagesArray = `{${imageUrl}}`;

    const stock = randomInt(1, 4, 1);
    const desc = 'YEC korxonasining Eron texnologiyasida ishlab chiqarilgan premium gilami. Yumshoq, chidamli va uzoq xizmat qiladi.';
    
    try {
        await pool.query(`
          INSERT INTO carpets (id, name, price, stock, size, material, description, "categoryId", images, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [oldId, fullName, totalPrice, stock, sizeStr, 'Paxta + akril', desc, categoryId, imagesArray]);
        created++;
    } catch(e) {
        console.error("Failed inserting:", fullName, e.message);
    }
  }
  
  console.log(`Bajarildi. Tiklandi: ${created}. O'tkazib yuborildi: ${skipped}.`);
  await pool.end();
}

run().catch(console.error);
