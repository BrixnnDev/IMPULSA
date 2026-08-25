@echo off
title Instalar Agent StockFlow
color 0B
cls

echo ============================================
echo   Instalador Agent StockFlow
echo ============================================
echo.

REM === Pedir URL del servidor ===
set /p SERVER_URL="URL del servidor (Enter = http://localhost:8787): "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:8787

REM === Obtener info PC ===
set "PC_NAME=%COMPUTERNAME%"

REM === Generar codigo unico ===
setlocal EnableDelayedExpansion
set "CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
set "CODE="
for /L %%i in (1,1,8) do (
    set /a "rand=!random! %% 36"
    for %%j in (!rand!) do set "CODE=!CODE!!CHARS:~%%j,1!"
)
endlocal & set "PAIR_CODE=%CODE%"

echo.
echo ============================================
echo   Tu codigo de emparejamiento es:
echo.
echo         %PAIR_CODE%
echo.
echo   Copia este codigo y pegalo en la pagina.
echo ============================================
echo.

REM === Crear carpeta destino ===
set "DEST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\StockFlow-Agent"

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
echo title Agent StockFlow >> "%DEST%\heartbeat.bat"
echo color 0A >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo set "SERVER_URL=%SERVER_URL%" >> "%DEST%\heartbeat.bat"
echo set "PC_NAME=%PC_NAME%" >> "%DEST%\heartbeat.bat"
echo set "PAIR_CODE=%PAIR_CODE%" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener IP === >> "%DEST%\heartbeat.bat"
echo set "IP_LOCAL=" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=2 delims=:" %%%%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do if "!IP_LOCAL!"=="" set "IP_LOCAL=%%%%a" >> "%DEST%\heartbeat.bat"
echo set "IP_LOCAL=!IP_LOCAL: =!" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener MAC === >> "%DEST%\heartbeat.bat"
echo set "MAC=" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=1 delims= " %%%%a in ('getmac /fo csv /nh ^| findstr /v "00-00-00-00-00-00"') do if "!MAC!"=="" set "MAC=%%%%a" >> "%DEST%\heartbeat.bat"
echo set "MAC=!MAC:"=!" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Obtener SO === >> "%DEST%\heartbeat.bat"
echo set "SO=Windows" >> "%DEST%\heartbeat.bat"
echo for /f "tokens=2 delims==" %%%%a in ('wmic os get Caption /value ^| findstr "Caption"') do if "!SO!"=="" set "SO=%%%%a" >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo echo [%time%] Iniciando agente... >> "%DEST%\heartbeat.bat"
echo. >> "%DEST%\heartbeat.bat"
echo REM === Loop heartbeat === >> "%DEST%\heartbeat.bat"
echo :loop >> "%DEST%\heartbeat.bat"
echo curl -s -X POST "!SERVER_URL!/api/pc/heartbeat" -H "Content-Type: application/json" -d "{\"pc\":\"!PC_NAME!\",\"ip\":\"!IP_LOCAL!\",\"mac\":\"!MAC!\",\"sistema\":\"!SO!\",\"codigo\":\"!PAIR_CODE!\"}" ^>nul 2^>^1 >> "%DEST%\heartbeat.bat"
echo if !errorlevel! equ 0 (echo [%time%] OK - !PC_NAME!) else (echo [%time%] Sin conexion) >> "%DEST%\heartbeat.bat"
echo timeout /t 30 /nobreak ^>nul >> "%DEST%\heartbeat.bat"
echo goto loop >> "%DEST%\heartbeat.bat"

REM === Verificar ===
echo   Verificando:
if exist "%DEST%\config.json" (echo   [OK] config.json) else (echo   [FAIL] config.json)
if exist "%DEST%\ocultar.vbs" (echo   [OK] ocultar.vbs) else (echo   [FAIL] ocultar.vbs)
if exist "%DEST%\heartbeat.bat" (echo   [OK] heartbeat.bat) else (echo   [FAIL] heartbeat.bat)

REM === Iniciar ===
echo.
echo   Iniciando agente...
wscript.exe "%DEST%\ocultar.vbs"

echo.
echo ============================================
echo   LISTO - Agente corriendo en segundo plano
echo ============================================
echo   Codigo:  %PAIR_CODE%
echo   Copia este codigo y pegalo en la pagina
echo   en la carpeta sin emparejar > Vincular
echo ============================================
echo.
pause
