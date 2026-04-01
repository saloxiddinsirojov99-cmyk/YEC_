const { Client } = require('pg');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = new Client({ connectionString: url });

async function main() {
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM categories');
    console.log('--- CATEGORIES ---');
    console.table(res.rows);
    
    // Look for categoryname
    const catName = res.rows.find(c => c.name.toLowerCase() === 'categoryname');
    if (catName) {
      console.log('Found "categoryname" category. Deleting...');
      await client.query('DELETE FROM categories WHERE id = $1', [catName.id]);
      console.log('Deleted successfully.');
    }
    
    // Check if there are carpets with this categoryId (should be none or cascade)
    // Actually Prisma schema says "Category" has many "Carpet".
    // 
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
