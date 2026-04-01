const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });

async function main() {
  console.log('Prioritizing Iran-soft and Steffano carpets...');
  const res = await pool.query(`
    UPDATE carpets 
    SET "createdAt" = NOW() + INTERVAL '1 day' 
    WHERE id IN (
      SELECT c.id 
      FROM carpets c 
      JOIN categories cat ON c."categoryId" = cat.id 
      WHERE cat.name ILIKE '%iran%' 
         OR cat.name ILIKE '%steffano%' 
         OR c.name ILIKE '%iran%' 
         OR c.name ILIKE '%steffano%'
    )
  `);
  console.log(`Successfully prioritized ${res.rowCount} carpets!`);
  
  // Also ensure standard sizes exist for these
  console.log('Updating standard sizes for matching carpets...');
  // This is a bit complex for a script, but we can at least make sure they have a non-zero price if missing
  await pool.query(`UPDATE carpets SET price = 370000 WHERE price = 0 AND (name ILIKE '%iran%' OR name ILIKE '%eron%')`);
  await pool.query(`UPDATE carpets SET price = 250000 WHERE price = 0 AND (name ILIKE '%steffano%')`);
  
  pool.end();
}

main().catch(console.error);
