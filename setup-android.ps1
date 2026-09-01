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
Write-Host "🔨 [Step 4/6] Building production web assets (dist/)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build web assets. Please check for compile errors." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "✅ Web assets compiled successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Initialize Capacitor & Add Android platform
Write-Host "📱 [Step 5/6] Initializing Capacitor & configuring Android platform..." -ForegroundColor Yellow

# Check if capacitor.config.ts or capacitor.config.json already exists
if (-not (Test-Path "capacitor.config.*")) {
    npx cap init "Expense Tracker" "com.personal.expensetracker" --web-dir dist
}

# Check if android folder already exists
if (-not (Test-Path "android")) {
    npx cap add android
} else {
    Write-Host "ℹ️  Android folder already exists, syncing latest web build..." -ForegroundColor Cyan
    npx cap sync android
}

Write-Host "✅ Android project ready!" -ForegroundColor Green
Write-Host ""

# Step 6: Open in Android Studio
Write-Host "🚀 [Step 6/6] Launching Android Studio..." -ForegroundColor Yellow
npx cap open android

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 🎉 Setup Complete!" -ForegroundColor Green
Write-Host " When Android Studio opens:" -ForegroundColor White
Write-Host " 1. Wait for Gradle Sync to finish." -ForegroundColor White
Write-Host " 2. Go to: Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
