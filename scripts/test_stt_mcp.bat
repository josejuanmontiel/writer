@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================================
echo  🎙️  ANTIGRAVITY WRITER - TEST DE INFERENCIA STT WHISPER VIA MCP
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Verificar archivo de audio de prueba
if not exist "antigravity_dictation.wav" (
    if exist "lib\whisper.cpp\bindings\go\samples\jfk.wav" (
        copy "lib\whisper.cpp\bindings\go\samples\jfk.wav" "antigravity_dictation.wav" > nul
        echo [INFO] Audio de prueba JFK copiado a antigravity_dictation.wav
    ) else (
        echo [ERROR] No se encuentra el archivo de audio antigravity_dictation.wav
        echo Por favor coloca un archivo WAV de prueba llamado antigravity_dictation.wav en esta carpeta.
        pause
        exit /b 1
    )
)

echo [INFO] Audio de prueba listo: antigravity_dictation.wav
echo [INFO] Verificando conexion con servidor MCP en http://localhost:3000/mcp ...
echo.

:: 2. Intentar ejecutar con Python si está disponible
where python >nul 2>nul
if %errorlevel% equ 0 (
    if exist "test_mcp_whisper.py" (
        echo [EJECUTANDO] Lanzando test via Python (test_mcp_whisper.py)...
        echo.
        python test_mcp_whisper.py antigravity_dictation.wav http://localhost:3000
        if %errorlevel% equ 0 (
            echo.
            echo ======================================================================
            echo  [EXITO] Test de transcripción MCP Whisper completado correctamente.
            echo ======================================================================
            pause
            exit /b 0
        )
    )
)

:: 3. Si no hay Python o falló, ejecutar con PowerShell nativo de Windows
echo [EJECUTANDO] Lanzando test via PowerShell nativo (test_mcp_transcribe.ps1)...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test_mcp_transcribe.ps1" -AudioPath "%~dp0antigravity_dictation.wav" -BaseUrl "http://localhost:3000"

if %errorlevel% neq 0 (
    echo.
    echo ======================================================================
    echo  [AVISO] El test ha devuelto un codigo de error.
    echo  Asegurate de que writer.exe esta abierto y ejecutandose.
    echo  Puedes revisar el archivo writer.log para ver los detalles.
    echo ======================================================================
)

echo.
pause
