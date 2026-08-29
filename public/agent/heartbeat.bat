@echo off
title Agent IMPULSA
color 0A
cls

echo ============================================
echo   Agent IMPULSA
echo ============================================
echo.
echo   Ingresa el codigo de emparejamiento
echo   que aparece en la pagina web.
echo.

REM === Pedir codigo ===
set /p PAIR_CODE="   Codigo: "

if "%PAIR_CODE%"=="" (
    echo.
    echo   [ERROR] Debes ingresar un codigo.
    pause
    exit /b 1
)

REM === Pedir URL del servidor ===
set SERVER_URL=http://localhost:8787
set /p SERVER_URL="   Servidor (Enter = http://localhost:8787): "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:8787

echo.
echo   Conectando...

REM === Obtener info REAL de la PC ===
set PC_NAME=%COMPUTERNAME%

set IP_LOCAL=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    if "!IP_LOCAL!"=="" set IP_LOCAL=%%a
)
set IP_LOCAL=%IP_LOCAL: =%

set MAC=
for /f "tokens=1 delims= " %%a in ('getmac /fo csv /nh ^| findstr /v "00-00-00-00-00-00"') do (
    if "!MAC!"=="" set MAC=%%a
)
set MAC=%MAC:"=%

set SO=
for /f "tokens=2 delims==" %%a in ('wmic os get Caption /value ^| findstr "Caption"') do (
    if "!SO!"=="" set SO=%%a
)
if "!SO!"=="" set SO=Windows

REM === Registrar y emparejar ===
curl -s -X POST "%SERVER_URL%/api/pc/register-from-script" ^
    -H "Content-Type: application/json" ^
    -d "{\"codigo\":\"%PAIR_CODE%\",\"pc\":\"%PC_NAME%\",\"ip\":\"%IP_LOCAL%\",\"mac\":\"%MAC%\",\"sistema\":\"%SO%\"}" >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   VINCULADO
    echo ============================================
    echo.
    echo   PC:       %PC_NAME%
    echo   IP:       %IP_LOCAL%
    echo   MAC:      %MAC%
    echo   SO:       %SO%
    echo.
) else (
    echo.
    echo   [!] Sin conexion al servidor.
    echo   Verifica que el servidor este corriendo.
    echo.
    pause
    exit /b 1
)

REM === Guardar config ===
echo {"servidor":"%SERVER_URL%","codigo":"%PAIR_CODE%","pc":"%PC_NAME%"} > "%~dp0config.json"

echo   Enviando heartbeat cada 30 segundos...
echo   No cierres esta ventana.
echo.

REM === Loop heartbeat (envia info real cada 30s) ===
:loop
curl -s -X POST "%SERVER_URL%/api/pc/heartbeat" ^
    -H "Content-Type: application/json" ^
    -d "{\"pc\":\"%PC_NAME%\",\"ip\":\"%IP_LOCAL%\",\"mac\":\"%MAC%\",\"sistema\":\"%SO%\",\"codigo\":\"%PAIR_CODE%\"}" >nul 2>&1

if %errorlevel% equ 0 (
    echo [%time%] OK - %PC_NAME% (%IP_LOCAL%)
) else (
    echo [%time%] Sin conexion
)

timeout /t 30 /nobreak >nul
goto loop
