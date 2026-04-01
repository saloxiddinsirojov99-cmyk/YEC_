const jimp = require('jimp');

async function test() {
  try {
    const imgUrl = 'https://picsum.photos/200/300';
    console.log('Loading remote image...');
    const img1 = await jimp.read(imgUrl);
    
    console.log('Duplicating and slightly editing...');
    const img2 = img1.clone().resize(100, 150).brightness(0.1);

    const dist = jimp.distance(img1, img2); // Perceptual distance
    const diff = jimp.diff(img1, img2);     // Pixel difference
    
    console.log('Distance (pHash)', dist); // 0 = perfectly identical, 1 = completely different
    console.log('Diff', diff.percent); // Pixel difference
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
