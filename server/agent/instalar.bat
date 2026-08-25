@echo off
title Instalar Agent StockFlow
color 0B

set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set DEST=%STARTUP%\StockFlow-Agent

echo ============================================
echo   Instalador Agent StockFlow
echo ============================================
echo.
echo   Esto instalara el agente para que se
echo   ejecute automaticamente al encender
echo   el computador.
echo.

if exist "%DEST%" (
    echo   Ya esta instalado. Actualizando...
    rmdir /s /q "%DEST%"
)

mkdir "%DEST%"
copy "%~dp0heartbeat.bat" "%DEST%\" >nul
copy "%~dp0ocultar.vbs" "%DEST%\" >nul
copy "%~dp0config.json" "%DEST%\" >nul 2>&1

echo.
echo   Instalado en: %DEST%
echo   El agente arrancara automaticamente
echo   la proxima vez que enciendas el PC.
echo.
echo   Para iniciar AHORA: doble clic en ocultar.vbs
echo   Para DESINSTALAR: borra la carpeta:
echo   %DEST%
echo.
pause
