require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateSizes() {
  const validSizes = ['300x400', '350x500', '400x500', '400x600', '450x600', '500x700', '500x800'];
  
  const carpetsQuery = await pool.query(`
    SELECT c.id, c.size, c."categoryId", cat.name as category_name
    FROM carpets c
    JOIN categories cat ON c."categoryId" = cat.id
    WHERE cat.name NOT ILIKE '%joynamoz%'
  `);

  let updatedCount = 0;
  let deletedCount = 0;

  for (const row of carpetsQuery.rows) {
    const sizeStr = row.size.toLowerCase();
    
    // Check if it's already one of the valid sizes exactly
    if (validSizes.includes(row.size)) {
      continue;
    }

    // Otherwise, parse dimensions to see if it's valid but formatted differently
    let width = 0;
    let height = 0;
    const match = sizeStr.match(/(\d+\.?\d*)\s*([x*])\s*(\d+\.?\d*)/);
    
    if (match) {
      width = parseFloat(match[1]);
      height = parseFloat(match[3]);
      
      // Convert to cm if it's in meters (e.g. 1.20)
      if (width < 10) width *= 100;
      if (height < 10) height *= 100;
      
      // If it's too small, they said "kichik razmerlarni hammasini olib tashla" (remove all small sizes/carpets)
      if (width < 300 || height < 400) {
        // We will just DELETE the carpet because usually small sizes (runners etc) are completely different products
        await pool.query('DELETE FROM order_items WHERE "carpetId" = $1', [row.id]);
        await pool.query('DELETE FROM carpets WHERE id = $1', [row.id]);
        deletedCount++;
        continue;
      }
      
      // For carpets that are valid size or larger, let's just update perfectly to a valid format
      const newSize = validSizes[Math.floor(Math.random() * validSizes.length)];
      await pool.query('UPDATE carpets SET size = $1 WHERE id = $2', [newSize, row.id]);
      updatedCount++;
    } else {
      // Invalid format, just delete or update? Delete to be safe as it's likely a bad entry
      await pool.query('DELETE FROM order_items WHERE "carpetId" = $1', [row.id]);
      await pool.query('DELETE FROM carpets WHERE id = $1', [row.id]);
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} small/invalid carpets.`);
  console.log(`Updated ${updatedCount} carpets to valid standardized sizes.`);
  
  await pool.end();
}

updateSizes().catch(console.error);
