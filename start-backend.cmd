@echo off
setlocal
cd /d "%~dp0backend"
node --no-deprecation node_modules\@nestjs\cli\bin\nest.js start --watch