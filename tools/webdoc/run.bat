@echo off
chcp 65001 >nul
cd /d "%~dp0"
python -m pip install -q requests >=nul 2>&1
python app.py
pause
