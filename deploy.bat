@echo off
echo ===================================================
echo   AGENTFLOW ENTERPRISE AUTOMATED DEPLOYMENT
echo ===================================================
echo.

echo [1/5] Installing project dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error during npm install. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

echo [2/5] Installing local pglite-server...
call npm install pglite-server --save-dev

echo [3/5] Installing bot dependencies...
cd bot
call npm install
cd ..

echo [4/5] Generating database schema and building production files...
call npx prisma generate
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error during Next.js build. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

echo [5/5] Launching applications via PM2...
call pm2 delete all
call pm2 cleardump
call pm2 start ecosystem.config.js
call pm2 save

echo.
echo Opening port 3000 in Windows Firewall...
powershell -Command "New-NetFirewallRule -DisplayName 'AgentFlow Web Port 3000' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"

echo.
echo ===================================================
echo   DEPLOYMENT COMPLETED SUCCESSFULLY!
echo   Access the web at http://localhost:3000
echo ===================================================
pause
