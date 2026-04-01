const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/yec_tashkent?schema=public'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT c.id, c.name, c.images, cat.name as category 
    FROM carpets c 
    JOIN categories cat ON c."categoryId" = cat.id 
    WHERE cat.name ILIKE '%iran%' 
       OR c.name ILIKE '%iran%'
  `);
  
  const carpets = res.rows;
  console.log("Iran-soft carpets total:", carpets.length);
  
  const greenCarpets = carpets.filter(c => 
    c.name.toLowerCase().includes('yashil') || 
    c.name.toLowerCase().includes('green') || 
    c.name.toLowerCase().includes('zelen') || 
    c.images.some(img => img.toLowerCase().includes('yashil') || img.toLowerCase().includes('green'))
  );
  
  if (greenCarpets.length > 0) {
    console.log("Found Green:", JSON.stringify(greenCarpets.slice(0, 5), null, 2));
  } else {
    for (const c of carpets.slice(0, 10)) {
      console.log(c.name, c.images);
    }
  }
}

main().catch(console.error).finally(() => client.end());
