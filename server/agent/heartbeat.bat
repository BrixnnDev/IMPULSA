@echo off
title Agent StockFlow - Heartbeat
color 0A

REM === Leer configuración ===
set SERVER_URL=http://localhost:8787
set PC_NAME=%COMPUTERNAME%
set INTERVALO=30

REM === Si existe config.json, leer valores ===
if exist "%~dp0config.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr /i "servidor" "%~dp0config.json"') do (
        set SERVER_URL=%%~a
    )
    for /f "tokens=2 delims=:," %%a in ('findstr /i "pc" "%~dp0config.json"') do (
        set PC_NAME=%%~a
    )
)

REM === Limpiar espacios y comillas ===
set SERVER_URL=%SERVER_URL: =%
set SERVER_URL=%SERVER_URL:"=%
set SERVER_URL=%SERVER_URL:~1%
set PC_NAME=%PC_NAME: =%
set PC_NAME=%PC_NAME:"=%
set PC_NAME=%PC_NAME:~1%

echo ============================================
echo   Agent StockFlow - Heartbeat v1.0
echo ============================================
echo   Servidor: %SERVER_URL%
echo   PC:       %PC_NAME%
echo   Intervalo: %INTERVALO% segundos
echo ============================================
echo.

REM === Loop infinito ===
:loop
curl -s -X POST "%SERVER_URL%/api/pc/heartbeat" -H "Content-Type: application/json" -d "{\"pc\":\"%PC_NAME%\",\"status\":\"online\"}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [%time%] Heartbeat enviado - %PC_NAME% OK
) else (
    echo [%time%] Sin conexion al servidor
)
timeout /t %INTERVALO% /nobreak >nul
goto loop
