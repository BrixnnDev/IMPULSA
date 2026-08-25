@echo off
title Agent StockFlow - Heartbeat
color 0A
cls

REM === Leer config existente ===
set SERVER_URL=http://localhost:8787
set EXISTING_CODE=
if exist "%~dp0config.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr /i "servidor" "%~dp0config.json"') do set SERVER_URL=%%a
    for /f "tokens=2 delims=:," %%a in ('findstr /i "codigo" "%~dp0config.json"') do set EXISTING_CODE=%%a
)
set SERVER_URL=%SERVER_URL: =%
set SERVER_URL=%SERVER_URL:"=%
set SERVER_URL=%SERVER_URL:~1%
if defined EXISTING_CODE (
    set EXISTING_CODE=%EXISTING_CODE: =%
    set EXISTING_CODE=%EXISTING_CODE:"=%
    set EXISTING_CODE=%EXISTING_CODE:~1%
)

REM === Si no tiene código, generar uno ===
if not defined EXISTING_CODE (
    setlocal EnableDelayedExpansion
    set "CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    set "CODE="
    for /L %%i in (1,1,8) do (
        set /a "rand=!random! %% 36"
        for %%j in (!rand!) do set "CODE=!CODE!!CHARS:~%%j,1!"
    )
    endlocal & set "PAIR_CODE=%CODE%"
) else (
    set "PAIR_CODE=%EXISTING_CODE%"
)

REM === Obtener info de la PC ===
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

echo ============================================
echo   Agent StockFlow
echo ============================================
echo.
echo   Tu codigo de emparejamiento es:
echo.
echo         %PAIR_CODE%
echo.
echo   Copia este codigo y pega en la pagina web:
echo   Historial de impresion > Crear carpeta
echo   > Campo "Codigo" > Vincular
echo.
echo ============================================
echo.
echo   PC:       %PC_NAME%
echo   IP:       %IP_LOCAL%
echo   MAC:      %MAC%
echo   SO:       %SO%
echo   Servidor: %SERVER_URL%
echo.

REM === Registrar en servidor ===
curl -s -X POST "%SERVER_URL%/api/pc/register-from-script" ^
    -H "Content-Type: application/json" ^
    -d "{\"codigo\":\"%PAIR_CODE%\",\"pc\":\"%PC_NAME%\",\"ip\":\"%IP_LOCAL%\",\"mac\":\"%MAC%\",\"sistema\":\"%SO%\"}" >nul 2>&1

if %errorlevel% equ 0 (
    echo   [OK] Registrado en servidor.
) else (
    echo   [!] Sin conexion al servidor.
)

REM === Guardar config ===
echo {"servidor":"%SERVER_URL%","codigo":"%PAIR_CODE%","pc":"%PC_NAME%"} > "%~dp0config.json"

echo.
echo   El agente enviara datos cada 30 segundos.
echo   No cierres esta ventana.
echo.

REM === Loop heartbeat ===
:loop
curl -s -X POST "%SERVER_URL%/api/pc/heartbeat" ^
    -H "Content-Type: application/json" ^
    -d "{\"pc\":\"%PC_NAME%\",\"ip\":\"%IP_LOCAL%\",\"mac\":\"%MAC%\",\"sistema\":\"%SO%\"}" >nul 2>&1

if %errorlevel% equ 0 (
    echo [%time%] OK
) else (
    echo [%time%] Sin conexion
)

timeout /t 30 /nobreak >nul
goto loop
