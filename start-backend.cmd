@echo off
setlocal
cd /d "%~dp0backend"
node node_modules\@nestjs\cli\bin\nest.js start --watch
