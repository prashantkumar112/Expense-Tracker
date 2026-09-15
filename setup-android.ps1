# ====================================================================
# Expense Tracker - Automated Android Setup & Build Script (PowerShell)
# This script runs Steps 3 to 6 automatically:
# 1. Installs Capacitor & Android dependencies
# 2. Builds the web distribution assets (dist)
# 3. Initializes the Capacitor Android project
# 4. Opens the project in Android Studio
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Starting Automated Android APK Setup & Build" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Install Dependencies
Write-Host "📦 [Step 3/6] Installing dependencies and Capacitor packages..." -ForegroundColor Yellow
npm install
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Build Web Assets
Write-Host "🔨 [Step 4/6] Building clean production web assets (dist/)..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build web assets. Please check for compile errors." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "✅ Web assets compiled successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Initialize Capacitor & Add Android platform
Write-Host "📱 [Step 5/6] Initializing Capacitor & configuring Android platform..." -ForegroundColor Yellow

# Clean any stale build folders in Android to prevent cached white screens
if (Test-Path "android\app\build") {
    Write-Host "🧹 Cleaning stale Android build artifacts..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
}

# Remove any conflicting capacitor.config.ts if it exists
if (Test-Path "capacitor.config.ts") {
    Write-Host "ℹ️  Removing conflicting capacitor.config.ts (using capacitor.config.json)..." -ForegroundColor Cyan
    Remove-Item "capacitor.config.ts" -Force -ErrorAction SilentlyContinue
}

# Check if capacitor.config.json already exists
if (-not (Test-Path "capacitor.config.json")) {
    npx cap init "Expense Tracker" "com.personal.expensetracker" --web-dir dist
}

# Check if android folder already exists
if (-not (Test-Path "android")) {
    Write-Host "Creating Android platform container..." -ForegroundColor Cyan
    npx cap add android
}

# Patch AndroidManifest.xml for cleartext & WebView permissions
$manifestPath = "android\app\src\main\AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw
    if ($manifest -notmatch "android:usesCleartextTraffic") {
        $manifest = $manifest -replace "<application", "<application`n        android:usesCleartextTraffic=`"true`""
        Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8
        Write-Host "🔧 Configured android:usesCleartextTraffic in AndroidManifest.xml" -ForegroundColor Green
    }
}

Write-Host "ℹ️  Syncing compiled relative web assets into Android project..." -ForegroundColor Cyan
npx cap sync android

Write-Host "✅ Android project synchronized with fresh assets!" -ForegroundColor Green
Write-Host ""

# Optional: Try automated direct build with Gradle wrapper
$gradlew = "android\gradlew.bat"
$directBuildSuccess = $false

if (Test-Path $gradlew) {
    Write-Host "⚡ Attempting direct APK build via Gradle..." -ForegroundColor Cyan
    Push-Location "android"
    try {
        cmd.exe /c "gradlew.bat assembleDebug"
        Pop-Location
        $builtApk = "android\app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $builtApk) {
            Copy-Item $builtApk ".\ExpenseTracker.apk" -Force
            $directBuildSuccess = $true
            Write-Host ""
            Write-Host "========================================================" -ForegroundColor Green
            Write-Host " 🚀 DIRECT APK GENERATION SUCCEEDED!" -ForegroundColor Green
            Write-Host " 📍 Your new APK is ready at: ExpenseTracker.apk" -ForegroundColor Yellow
            Write-Host " Simply transfer 'ExpenseTracker.apk' to your phone and install!" -ForegroundColor Cyan
            Write-Host "========================================================" -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        Pop-Location
        Write-Host "ℹ️  Direct command-line build finished. Android Studio will open for visual build." -ForegroundColor Yellow
    }
}

# Step 6: Open in Android Studio
Write-Host "🚀 [Step 6/6] Launching Android Studio..." -ForegroundColor Yellow
npx cap open android

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 🎉 Setup & Sync Complete!" -ForegroundColor Green
Write-Host " In Android Studio:" -ForegroundColor White
Write-Host " 1. Go to: Build -> Clean Project  (IMPORTANT: clears old white-screen cache)" -ForegroundColor Yellow
Write-Host " 2. Go to: Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor White
Write-Host " 3. Click 'locate' and install the freshly built app-debug.apk on your phone." -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
