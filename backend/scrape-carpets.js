require('dotenv').config();
const { Pool } = require('pg');
const cheerio = require('cheerio');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const BASE_URL = 'https://catalog.yec.uz';

// Generate CUID-like ID
function generateId() {
  return 'c' + crypto.randomBytes(11).toString('hex');
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function scrapeCollections() {
  console.log('Fetching collections from multiple types...');
  const types = ['/type/kover/', '/type/tafting/'];
  const collections = [];

  for (const type of types) {
    const html = await fetchHtml(BASE_URL + type);
    if (!html) continue;

    const $ = cheerio.load(html);
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/collection/')) {
        const parts = href.split('/').filter(Boolean);
        const name = $(el).text().trim() || parts[1];
        if (name && !name.includes('catalog.yec.uz') && !collections.find((c) => c.href === href)) {
          collections.push({ 
            href: '/' + parts.join('/') + '/', 
            name: name.replace(/-/g, ' ').toUpperCase() 
          });
        }
      }
    });
  }

  // Priority: put iran-soft and steffano at the very end to be scraped last (newest createdAt)
  const priorityKeywords = ['IRAN SOFT', 'STEFFANO', 'ERON SOFT', 'ERON', 'SOFT'];
  collections.sort((a, b) => {
    const aIsPriority = priorityKeywords.some(k => a.name.includes(k));
    const bIsPriority = priorityKeywords.some(k => b.name.includes(k));
    
    if (aIsPriority && !bIsPriority) return 1;
    if (!aIsPriority && bIsPriority) return -1;
    return 0;
  });

  return collections;
}

async function getOrCreateCategory(name, isOval = false) {
  let finalName = name.toUpperCase();
  if (isOval && !finalName.includes('OVAL')) {
    finalName = 'OVAL ' + finalName;
  }
  
  const res = await pool.query('SELECT * FROM categories WHERE UPPER(name) = $1 LIMIT 1', [finalName]);
  if (res.rows.length > 0) {
    return res.rows[0].id;
  }
  
  console.log(`Creating new category: ${finalName}`);
  const id = generateId();
  await pool.query(
    'INSERT INTO categories (id, name, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
    [id, finalName]
  );
  return id;
}

async function scrapeCarpetsForCollection(collectionHref, dbCategoryId) {
  const targetUrl = BASE_URL + collectionHref + '?filter=static';
  console.log(`\nFetching ${targetUrl}...`);
  const html = await fetchHtml(targetUrl);
  if (!html) return;

  const $ = cheerio.load(html);
  const carpetsFromPage = [];
  
  $('.item').each((i, el) => {
      const name = $(el).find('.kod, .name, .title').text().trim();
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      
      if (name && img) {
         if (!carpetsFromPage.find(c => c.name === name)) {
            carpetsFromPage.push({ name, img: img.startsWith('http') ? img : BASE_URL + img });
         }
      }
  });

  if (carpetsFromPage.length === 0) {
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/product/')) {
         const name = $(el).text().trim() || $(el).attr('title');
         const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || $(el).parent().find('img').attr('src');
         
         if (name && img) {
            if (!carpetsFromPage.find(c => c.name === name)) {
               carpetsFromPage.push({ name, img: img.startsWith('http') ? img : BASE_URL + img });
            }
         }
      }
    });
  }

  console.log(`Found ${carpetsFromPage.length} carpets for this collection`);

  let added = 0;
  for (const c of carpetsFromPage) {
     const existsRes = await pool.query(
       'SELECT id FROM carpets WHERE name = $1 AND "categoryId" = $2 LIMIT 1',
       [c.name, dbCategoryId]
     );
     
      if (existsRes.rows.length === 0) {
        // Standard sizes from 3x3 to 5x8 as requested by user
        const sizes = ['3x3', '3x4', '3x5', '4x5', '4x6', '5x7', '5x8']; 
        for (const size of sizes) {
          const carpetId = generateId();
          const price = 0; 
          const material = collectionHref.includes('iran-soft') ? 'Acrylic + Poly' : (collectionHref.includes('steffano') ? 'Polypropylene + Polyester' : 'Paxta + Akril');
          const images = `{${c.img}}`;

          await pool.query(
             `INSERT INTO carpets (id, name, price, size, material, images, "categoryId", "createdAt", "updatedAt") 
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
             [carpetId, c.name, price, size, material, images, dbCategoryId]
          );
          added++;
          console.log(`  [+] Added carpet: ${c.name} (size: ${size})`);
          
          await new Promise(r => setTimeout(r, 10)); // stagger createdAt
        }
     }
  }
  console.log(`  Added ${added} new carpets to category.`);
}

async function main() {
   const collections = await scrapeCollections();
   console.log(`Found ${collections.length} collections!`);
   
   for (const coll of collections) {
     const isOval = coll.name.toLowerCase().includes('oval');
     const dbCategoryId = await getOrCreateCategory(coll.name, isOval);
     await scrapeCarpetsForCollection(coll.href, dbCategoryId);
   }

   console.log('\nAll done!');
   await pool.end();
}

main().catch(e => {
  console.error(e);
  pool.end();
});
