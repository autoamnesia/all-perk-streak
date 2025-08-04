@echo off
echo Starting a local server http://localhost:8000
echo Press Ctrl+C to stop the server.
python -m http.server 8000
pause
