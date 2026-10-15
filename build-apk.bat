@echo off
echo =========================================================
echo    Smart Expense Tracker AI - Android APK Builder
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/3] Building production Frontend static web bundle...
call npm.cmd --prefix Frontend run build
if %errorlevel% neq 0 (
    echo Error during Frontend build!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Syncing web assets with native Android platform...
cd Frontend
call npx.cmd cap sync android
if %errorlevel% neq 0 (
    echo Error syncing Capacitor Android!
    cd ..
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Compiling Android APK with Gradle...
cd android
if exist gradlew.bat (
    call gradlew.bat assembleDebug
    if %errorlevel% equ 0 (
        echo.
        echo =========================================================
        echo SUCCESS! APK successfully generated at:
        echo Frontend\android\app\build\outputs\apk\debug\app-debug.apk
        echo =========================================================
    ) else (
        echo.
        echo Gradle build completed with code %errorlevel%.
        echo Note: If Java or Android SDK is not in PATH, open the folder
        echo '%~dp0Frontend\android' in Android Studio and click Build APK.
    )
) else (
    echo gradlew.bat not found in Frontend\android.
)

cd /d "%~dp0"
echo.
pause
