@echo off
echo Starting a local server http://localhost:8000
echo Press Ctrl+C to stop the server.
echo.
echo Note: "ConnectionAbortedError" messages below are normal and can be ignored.
echo They occur when the browser cancels requests and don't affect functionality.
echo.
python -m http.server 8000
pause
