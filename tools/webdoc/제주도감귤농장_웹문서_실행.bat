@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM 개발용 — 콘솔 없이 웹앱 실행 (pythonw)
where pythonw >nul 2>&1
if %errorlevel%==0 (
  start "" pythonw app.py
) else (
  python app.py
)
