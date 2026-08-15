@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo [1/2] 의존성 설치...
python -m pip install -q -r requirements.txt
if errorlevel 1 (
  echo pip 설치 실패
  exit /b 1
)

echo [2/2] Chrome 앱 UI 실행파일 빌드...
REM --windowed: 검은 콘솔 없음. 스케줄은 UI 종료 시에도 백엔드 유지 후 UI 재실행.
python -m PyInstaller --noconfirm --clean --windowed --name "제주도감귤농장웹문서생성기" ^
  --add-data "indexnow.py;." ^
  --add-data "blob_sync.py;." ^
  --add-data "project_paths.py;." ^
  --add-data "combo_queue.py;." ^
  --add-data "scheduler.py;." ^
  --add-data "settings_store.py;." ^
  --add-data "naver_register.py;." ^
  --add-data "content_gen.py;." ^
  --add-data "runtime.py;." ^
  --add-data "webui.py;." ^
  --add-data "templates;templates" ^
  --add-data "naver_vm;naver_vm" ^
  --hidden-import "flask" ^
  --hidden-import "blob_sync" ^
  --hidden-import "project_paths" ^
  --hidden-import "indexnow" ^
  --hidden-import "combo_queue" ^
  --hidden-import "scheduler" ^
  --hidden-import "settings_store" ^
  --hidden-import "naver_register" ^
  --hidden-import "content_gen" ^
  --hidden-import "runtime" ^
  --hidden-import "webui" ^
  --hidden-import "undetected_chromedriver" ^
  --hidden-import "selenium" ^
  --collect-all "undetected_chromedriver" ^
  --collect-all "selenium" ^
  --collect-all "flask" ^
  app.py
if errorlevel 1 (
  echo 빌드 실패
  exit /b 1
)

echo.
echo 완료: dist\제주도감귤농장웹문서생성기\제주도감귤농장웹문서생성기.exe
echo 실행 시 Chrome 앱 GUI만 열립니다 (콘솔 없음).
exit /b 0
