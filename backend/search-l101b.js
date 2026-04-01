require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const r = await pool.query("SELECT * FROM carpets WHERE name ILIKE '%L101B%'");
  r.rows.forEach(row => {
    console.log(`Carpet: ${row.name}, Images:`, row.images);
  });
  await pool.end();
}
run();
