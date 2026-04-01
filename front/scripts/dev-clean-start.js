const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, '.next');
const basePort = Number(process.env.PORT || 3002);

function removeDistDir() {
  fs.rmSync(distDir, { recursive: true, force: true });
}

function ensureManifests() {
  require(path.join(__dirname, 'ensure-next-manifests.js'));
}

function canListenOnHost(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function checkPort(port) {
  const ipv6Free = await canListenOnHost(port, '::');
  if (!ipv6Free) return false;
  const ipv4Free = await canListenOnHost(port, '0.0.0.0');
  return ipv4Free;
}

async function start() {
  process.chdir(projectRoot);

  const isPreferredPortFree = await checkPort(basePort);
  if (!isPreferredPortFree) {
    console.warn(
      `[front:dev] ${basePort} port band. Server allaqachon ishlayotgan bo'lishi mumkin: http://localhost:${basePort}`,
    );
    process.exit(0);
    return;
  }

  removeDistDir();
  ensureManifests();

  const nextBin = path.join(
    projectRoot,
    'node_modules',
    'next',
    'dist',
    'bin',
    'next',
  );

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(basePort)], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

start().catch((error) => {
  console.error('[front:dev] Ishga tushirishda xatolik:', error);
  process.exit(1);
});