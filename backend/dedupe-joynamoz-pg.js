require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function dedupeJoynamoz() {
  // Find all joynamoz
  const res = await pool.query(`
    SELECT c.id, c.name, c.size, c.images, c.stock, c."categoryId"
    FROM carpets c
    JOIN categories cat ON c."categoryId" = cat.id
    WHERE cat.name ILIKE '%joynamoz%'
  `);

  const carpets = res.rows;
  
  // Group by "name|size|image0"
  const groups = {};
  
  for (const c of carpets) {
    const img0 = (c.images && c.images.length > 0) ? c.images[0] : 'no-image';
    const key = `${c.size}|${img0}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      // We have duplicates
      const keep = group[0];
      const duplicates = group.slice(1);
      
      // Calculate total stock: sum of current stocks, but treat 0 as 1 so we actually count physical items
      let totalStock = Math.max(1, keep.stock);
      for (const dup of duplicates) {
        totalStock += Math.max(1, dup.stock);
      }

      // Update the kept item's stock
      await pool.query('UPDATE carpets SET stock = $1 WHERE id = $2', [totalStock, keep.id]);

      // Reassign order items and delete duplicates
      for (const dup of duplicates) {
        await pool.query('UPDATE order_items SET "carpetId" = $1 WHERE "carpetId" = $2', [keep.id, dup.id]);
        await pool.query('DELETE FROM carpets WHERE id = $1', [dup.id]);
        deletedCount++;
      }
      mergedCount++;
    }
  }

  console.log(`Merged ${mergedCount} groups of duplicate Joynamoz.`);
  console.log(`Deleted ${deletedCount} duplicate rows.`);
  await pool.end();
}

dedupeJoynamoz().catch(console.error);
