require('dotenv').config();
const { Pool } = require('pg');
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const res = await pool.query(`
    SELECT c.id, c.name, c.size, c.images, c.stock, c."categoryId"
    FROM carpets c
    JOIN categories cat ON c."categoryId" = cat.id
    WHERE cat.name ILIKE '%joynamoz%'
  `);

  const carpets = res.rows;
  console.log(`Found ${carpets.length} joynamoz`);

  // Compute hash for all
  for (const c of carpets) {
    c.hash = 'no-image';
    if (c.images && c.images.length > 0) {
      let relativePath = c.images[0];
      if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);
      
      const fullPath = path.join(__dirname, relativePath);
      
      if (fs.existsSync(fullPath)) {
        try {
          const img = await jimp.read(fullPath);
          c.hash = img.hash(); // Base64 perceptual hash
          console.log(\`[Hash] \${c.id} -> \${c.hash}\`);
        } catch (e) {
          console.error(\`Failed to read \${fullPath}: \`, e.message);
        }
      } else {
        console.warn('File not found:', fullPath);
      }
    }
  }

  // Group by "size|hash"
  const groups = {};
  for (const c of carpets) {
    const key = \`\${c.size}|\${c.hash}\`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      const keep = group[0];
      const duplicates = group.slice(1);

      let totalStock = Math.max(1, keep.stock);
      for (const dup of duplicates) {
        totalStock += Math.max(1, dup.stock);
      }

      await pool.query('UPDATE carpets SET stock = $1 WHERE id = $2', [totalStock, keep.id]);

      for (const dup of duplicates) {
        await pool.query('UPDATE order_items SET "carpetId" = $1 WHERE "carpetId" = $2', [keep.id, dup.id]);
        await pool.query('DELETE FROM carpets WHERE id = $1', [dup.id]);
        deletedCount++;
        
        // Let's also delete the physical image file so space is saved, BUT ONLY IF they are different paths!
        if (dup.images && dup.images.length > 0) {
            const dupFile = dup.images[0];
            const keepFile = keep.images && keep.images[0];
            if (dupFile !== keepFile) {
                let delRelPath = dupFile;
                if (delRelPath.startsWith('/')) delRelPath = delRelPath.slice(1);
                const fullDelPath = path.join(__dirname, delRelPath);
                if (fs.existsSync(fullDelPath)) {
                    fs.unlinkSync(fullDelPath);
                }
            }
        }
      }
      mergedCount++;
    }
  }

  console.log(\`Merged \${mergedCount} groups, deleted \${deletedCount} rows and files.\`);
  await pool.end();
}

run().catch(console.error);
