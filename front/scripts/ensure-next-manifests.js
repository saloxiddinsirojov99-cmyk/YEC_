const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', '.next');
const serverDistDir = path.join(distDir, 'server');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonIfMissing(filePath, value) {
  if (fs.existsSync(filePath)) return;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

// In some constrained environments `.next/*-manifest.json` may fail to be
// generated early enough, which makes Next.js throw ENOENT and return 500.
// Create minimal placeholders so the dev server can boot and keep running.

writeJsonIfMissing(path.join(distDir, 'routes-manifest.json'), {
  version: 3,
  caseSensitive: false,
  basePath: '',
  rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
  redirects: [],
  headers: [],
  i18n: undefined,
  skipMiddlewareUrlNormalize: false,
});

writeJsonIfMissing(path.join(serverDistDir, 'middleware-manifest.json'), {
  version: 3,
  middleware: {},
  functions: {},
  sortedMiddleware: [],
});

