const fs = require('fs');

const data = fs.readFileSync('carpet_dump.txt', 'utf16le');
const lines = data.split('\n');

const head = lines[0].split('\t');
console.log('Columns count:', head.length);
console.log('Col 0:', head[0]);
console.log('Col 1:', head[1]);
console.log('Col 2:', head[2]);
console.log('Col 3:', head[3]);
console.log('Col 4:', head[4]);
console.log('Col 5:', head[5]);
