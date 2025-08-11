@echo off
chcp 65001 >nul
echo ========================================
echo     DBD All Perk Streak - Server
echo ========================================
echo.
echo Checking for available servers...

REM Check if Node.js is installed for streamer mode
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js found! Starting with STREAMER FEATURES...
    echo.
    echo 🌐 Main app: http://localhost:8000
    echo 📺 Streamer overlay: http://localhost:8000/streamer-overlay.html
    echo.
    echo 📋 OBS Setup:
    echo 1. Add Browser Source in OBS
    echo 2. Set URL to: http://localhost:8000/streamer-overlay.html  
    echo 4. Overlay updates automatically when you make progress!
    echo.
    echo ✨ STREAMER MODE: Auto-updating overlay enabled!
    echo.
    echo Press Ctrl+C to stop the server.
    echo ========================================
    echo.
    node server.js
    goto end
)

echo ⚠️ Node.js not found - checking for Python...

REM Check if Python 3 is installed (try py command first as it's more reliable on Windows)
py -3 --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Python found! Starting basic server...
    echo.
    echo 🌐 Main app: http://localhost:8000
    echo.
    echo ⚠️ BASIC MODE: No streamer overlay features
    echo 💡 Install Node.js for streamer overlay support
    echo.
    echo Press Ctrl+C to stop the server.
    echo ========================================
    echo.
    py -3 -m http.server 8000
    goto end
)

REM Try py command without version
py --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Python found! Starting basic server...
    echo.
    echo 🌐 Main app: http://localhost:8000
    echo.
    echo ⚠️ BASIC MODE: No streamer overlay features
    echo 💡 Install Node.js for streamer overlay support
    echo.
    echo Press Ctrl+C to stop the server.
    echo ========================================
    echo.
    py -m http.server 8000
    goto end
)

REM Try python3 command
python3 --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Python found! Starting basic server...
    echo.
    echo 🌐 Main app: http://localhost:8000
    echo.
    echo ⚠️ BASIC MODE: No streamer overlay features
    echo 💡 Install Node.js for streamer overlay support
    echo.
    echo Press Ctrl+C to stop the server.
    echo ========================================
    echo.
    python3 -m http.server 8000
    goto end
)

REM Last resort: try python command (but this often fails on Windows due to Store redirect)
python --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Python found! Starting basic server...
    echo.
    echo 🌐 Main app: http://localhost:8000
    echo.
    echo ⚠️ BASIC MODE: No streamer overlay features
    echo 💡 Install Node.js for streamer overlay support
    echo.
    echo Press Ctrl+C to stop the server.
    echo ========================================
    echo.
    python -m http.server 8000
    goto end
)

echo ❌ No server found! Please install one of the following:
echo.
echo 🚀 FOR STREAMERS ^(recommended^):
echo   • Node.js: https://nodejs.org
echo   • Enables real-time overlay updates for OBS
echo.
echo 🔧 FOR BASIC USE:
echo   • Python: https://python.org
echo   • Basic functionality only
echo.
echo 📂 ALTERNATIVE:
echo   • Open index.html directly in your browser
echo   • Some features may not work due to CORS
echo.
echo Press any key to exit...
pause >nul
exit

:end

echo.
echo Server stopped. Press any key to exit.
pause
