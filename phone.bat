@echo off
REM Open the Clinical Nutrition DSS website on a phone connected via USB.
REM Requirements:
REM   1. Phone connected by USB cable
REM   2. USB debugging enabled (Settings > Developer options > USB debugging)
REM   3. Phone and PC on the same network OR no internet needed - the
REM      app is served from the PC over the USB connection.
echo.
echo ============================================================
echo  Connect phone over USB
echo ============================================================
echo.

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" (
  echo [ERROR] Android platform-tools not found at:
  echo         %ADB%
  echo         Install the Android platform-tools, or add adb.exe to your PATH.
  pause
  exit /b 1
)

echo [1/2] Checking connected devices...
"%ADB%" devices
echo.

echo [2/2] Setting up port reverse: phone localhost:5000 -^> PC :5000
"%ADB%" reverse tcp:5000 tcp:5000
if errorlevel 1 (
  echo.
  echo [ERROR] adb reverse failed.
  echo  - Make sure USB debugging is enabled on the phone
  echo    (Settings -^> Developer options -^> USB debugging) and
  echo    accept the "Allow USB debugging?" prompt on the phone.
  pause
  exit /b 1
)
echo.
echo ============================================================
echo  Done!
echo  Open http://localhost:5000 on your phone browser.
echo  Camera access works over this USB connection
echo  (localhost is a secure context, so the browser
echo  allows camera and upload features).
echo ============================================================
echo.
pause