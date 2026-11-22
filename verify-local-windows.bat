@echo off
setlocal
cd /d "%~dp0"

echo MANGO WORLD - verifica locale (nessun deployment)
echo.
where node >nul 2>nul || (echo ERRORE: installa Node.js 20 o superiore. & exit /b 1)
where npm >nul 2>nul || (echo ERRORE: npm non trovato. & exit /b 1)

call npm install || (echo ERRORE: installazione dipendenze non riuscita. & exit /b 1)
call npm run qa:static || exit /b 1
call npm run build || exit /b 1
call npm run contracts:compile || exit /b 1
call npm run contracts:test || exit /b 1

echo.
echo VERIFICA COMPLETATA: build, compilazione e test sono terminati senza errori.
echo Nessun token e stato distribuito.
pause
