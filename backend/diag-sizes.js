require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const r = await p.query('SELECT size, count(*) FROM carpets GROUP BY size ORDER BY count(*) DESC');
  const d = { totalSizes: r.rows.length, sizes: r.rows, carpets: 0 };
  const total = await p.query('SELECT count(*) FROM carpets');
  d.carpets = total.rows[0].count;
  fs.writeFileSync('diag.json', JSON.stringify(d, null, 2));
  await p.end();
}

run().catch(console.error);
