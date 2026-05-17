const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', '.next');
const serverDistDir = path.join(distDir, 'server');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonIfMissing(filePath, value) {
  if (fs.existsSync(filePath)) return;
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  } catch (err) {
    // Ignore any directory lock or write conflicts during compilation
  }
}

function runEnsure() {
  // 1. routes-manifest.json
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

  // 2. middleware-manifest.json
  writeJsonIfMissing(path.join(serverDistDir, 'middleware-manifest.json'), {
    version: 3,
    middleware: {},
    functions: {},
    sortedMiddleware: [],
  });

  // 3. prerender-manifest.json
  writeJsonIfMissing(path.join(distDir, 'prerender-manifest.json'), {
    version: 4,
    routes: {},
    dynamicRoutes: {},
    preview: {
      previewModeId: "development-preview-mode",
      previewModeSigningKey: "development-signing-key",
      previewModeEncryptionKey: "development-encryption-key"
    },
    notFoundRoutes: []
  });

  // 4. required-server-files.json
  writeJsonIfMissing(path.join(distDir, 'required-server-files.json'), {
    version: 1,
    config: {},
    appDir: path.join(__dirname, '..'),
    files: [],
    ignore: []
  });

  // 5. images-manifest.json
  writeJsonIfMissing(path.join(distDir, 'images-manifest.json'), {
    version: 1,
    images: {
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      path: "/_next/image",
      loader: "default",
      loaderFile: "",
      domains: [],
      disableStaticImages: false,
      minimumCacheTTL: 60,
      formats: ["image/webp"],
      dangerouslyAllowSVG: false,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
      contentDispositionType: "inline",
      remotePatterns: [],
      unoptimized: false
    }
  });

  // 6. app-path-routes-manifest.json
  writeJsonIfMissing(path.join(serverDistDir, 'app-path-routes-manifest.json'), {});
}

// Run immediately
runEnsure();

// Periodically verify every 2000ms to guarantee they are never deleted by Next.js compiler
setInterval(runEnsure, 2000);
