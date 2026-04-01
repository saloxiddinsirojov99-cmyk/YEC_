const { existsSync } = require('fs');
const path = require('path');

function resolve(rel) {
  const normalized = rel.replace(/\\/g, '/');
  const withoutLeading = normalized.replace(/^\/+/, '');
  
  if (withoutLeading.startsWith('images/')) {
    const pub = path.join(__dirname, '..', 'front', 'public');
    const full = path.join(pub, withoutLeading);
    return existsSync(full) ? full : null;
  }
  
  const rp = withoutLeading.startsWith('uploads/') ? withoutLeading : 'uploads/' + withoutLeading;
  const lp = path.join(__dirname, rp);
  return existsSync(lp) ? lp : null;
}

console.log("Uploads test:", resolve('/uploads/1773644674972-a925c6e1-e15a-4abf-a636-9b6673640305.jpg'));
console.log("Images test:", resolve('/images/collections/mardin/M505C.jpg'));
console.log("Images test 2:", resolve('/images/collections/verona/2T.jpg'));
