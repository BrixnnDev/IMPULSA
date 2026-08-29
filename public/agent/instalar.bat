@echo off
title Instalar Agent IMPULSA
color 0B
cls

echo ============================================
echo   Instalador Agent IMPULSA
echo ============================================
echo.
echo   Este agente conecta tu PC con el sistema.
echo.

REM === Pedir URL del servidor ===
set /p SERVER_URL="   URL del servidor (Enter = http://localhost:8787): "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:8787

REM === Pedir codigo de emparejamiento ===
set /p PAIR_CODE="   Codigo de emparejamiento: "
if "%PAIR_CODE%"=="" (
    echo.
    echo   [ERROR] Debes ingresar un codigo.
    pause
    exit /b 1
)

REM === Obtener info PC real ===
set "PC_NAME=%COMPUTERNAME%"

echo.
echo   PC: %PC_NAME%
echo   Servidor: %SERVER_URL%
echo   Codigo: %PAIR_CODE%
echo.

REM === Crear carpeta destino ===
set "DEST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\IMPULSA-Agent"

if exist "%DEST%" (
    taskkill /f /im wscript.exe >nul 2>&1
    rmdir /s /q "%DEST%" >nul 2>&1
)
mkdir "%DEST%" 2>nul
timeout /t 1 /nobreak >nul

REM === Crear config.json ===
echo {"servidor":"%SERVER_URL%","codigo":"%PAIR_CODE%","pc":"%PC_NAME%"} > "%DEST%\config.json"

REM === Crear ocultar.vbs ===
echo Set WshShell = CreateObject("WScript.Shell") > "%DEST%\ocultar.vbs"
echo WshShell.Run Chr(34) ^& CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) ^& "\heartbeat.bat" ^& Chr(34), 0, False >> "%DEST%\ocultar.vbs"

REM === Crear heartbeat.bat con delayed expansion ===
echo @echo off > "%DEST%\heartbeat.bat"
echo setlocal EnableDelayedExpansion >> "%DEST%\heartbeat.bat"
echo title Agent IMPULSA >> "%DEST%\heartbeat.bat"
echo color 0A >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo set "SERVER_URL=%SERVER_URL%" >> "%DEST%\heartbeat.bat"
echo set "PC_NAME=%PC_NAME%" >> "%DEST%\heartbeat.bat"
echo set "PAIR_CODE=%PAIR_CODE%" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener IP real === >> "%DEST%\heartbeat.bat"
echo set "IP_LOCAL=" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=2 delims=:" %%%%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do if "!IP_LOCAL!"=="" set "IP_LOCAL=%%%%a" >> "%DEST%\heartbeat.bat"
echo set "IP_LOCAL=!IP_LOCAL: =!" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener MAC real === >> "%DEST%\heartbeat.bat"
echo set "MAC=" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=1 delims= " %%%%a in ('getmac /fo csv /nh ^| findstr /v "00-00-00-00-00-00"') do if "!MAC!"=="" set "MAC=%%%%a" >> "%DEST%\heartbeat.bat"
echo set "MAC=!MAC:"=!" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener SO real === >> "%DEST%\heartbeat.bat"
echo set "SO=Windows" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=2 delims==" %%%%a in ('wmic os get Caption /value ^| findstr "Caption"') do if "!SO!"=="" set "SO=%%%%a" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Registrar y emparejar === >> "%DEST%\heartbeat.bat"
echo curl -s -X POST "!SERVER_URL!/api/pc/register-from-script" -H "Content-Type: application/json" -d "{\"codigo\":\"!PAIR_CODE!\",\"pc\":\"!PC_NAME!\",\"ip\":\"!IP_LOCAL!\",\"mac\":\"!MAC!\",\"sistema\":\"!SO!\"}" ^>nul 2^>^1 >> "%DEST%\heartbeat.bat"
echo echo [%time%] Vinculado: !PC_NAME! ^(!IP_LOCAL!^) >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Loop heartbeat cada 30s === >> "%DEST%\heartbeat.bat"
echo :loop >> "%DEST%\heartbeat.bat"
echo curl -s -X POST "!SERVER_URL!/api/pc/heartbeat" -H "Content-Type: application/json" -d "{\"pc\":\"!PC_NAME!\",\"ip\":\"!IP_LOCAL!\",\"mac\":\"!MAC!\",\"sistema\":\"!SO!\",\"codigo\":\"!PAIR_CODE!\"}" ^>nul 2^>^1 >> "%DEST%\heartbeat.bat"
echo if !errorlevel! equ 0 (echo [%time%] OK - !PC_NAME!) else (echo [%time%] Sin conexion) >> "%DEST%\heartbeat.bat"
echo timeout /t 30 /nobreak ^>nul >> "%DEST%\heartbeat.bat"
echo goto loop >> "%DEST%\heartbeat.bat"

REM === Verificar archivos ===
echo.
echo   Verificando:
if exist "%DEST%\config.json" (echo   [OK] config.json) else (echo   [FAIL] config.json)
if exist "%DEST%\ocultar.vbs" (echo   [OK] ocultar.vbs) else (echo   [FAIL] ocultar.vbs)
if exist "%DEST%\heartbeat.bat" (echo   [OK] heartbeat.bat) else (echo   [FAIL] heartbeat.bat)

REM === Iniciar ===
echo.
echo   Iniciando agente en segundo plano...
wscript.exe "%DEST%\ocultar.vbs"

echo.
echo ============================================
echo   VINCULADO
echo ============================================
echo   PC:       %PC_NAME%
echo   Codigo:   %PAIR_CODE%
echo   Servidor: %SERVER_URL%
echo.
echo   Tu PC ya esta conectada al sistema.
echo   El agente enviara heartbeat cada 30s.
echo ============================================
echo.
pause
