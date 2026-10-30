@echo off
setlocal
cd /d "C:\Dev\Jobs\Code"

set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

if not exist "scraper\venv\Scripts\python.exe" (
    echo [ERROR] Python-Umgebung nicht gefunden: scraper\venv\Scripts\python.exe
    exit /b 1
)

"scraper\venv\Scripts\python.exe" "scraper\run_pipeline.py" %*
set "EXITCODE=%ERRORLEVEL%"

endlocal & exit /b %EXITCODE%
