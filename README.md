# 📱 Expense Tracker — Android APK Build & Installation Guide

This guide provides step-by-step instructions to convert this project into an Android `.apk` file using **Android Studio** on Windows, Mac, or Linux, and install it on your mobile phone.

---

## 📋 Prerequisites
Before you begin, ensure you have:
1. **Node.js (LTS version 18 or higher)** installed: [https://nodejs.org/](https://nodejs.org/)
2. **Android Studio** installed: [https://developer.android.com/studio](https://developer.android.com/studio)
3. An Android phone with **USB Debugging** or file transfer enabled.

---

## 🚀 Quick Step-by-Step Instructions

### Step 1: Download & Extract the Project
1. In Google AI Studio, click the **Settings / Menu** icon (top right) and choose **Download ZIP**.
2. Extract the ZIP file into a simple folder path without spaces (for example: `C:\Projects\ExpenseTracker` or `E:\ExpenseTracker`).

---

### Step 2: Open Terminal / Command Prompt
Open your terminal (**Command Prompt** or **PowerShell** on Windows, or **Terminal** on Mac/Linux) and navigate to the project directory:

```bash
cd /d C:\Projects\ExpenseTracker
```
*(Replace with your actual folder path)*

---

## ⚡ Quick One-Click Setup (PowerShell Script)
If you are on Windows, you can run all of Steps 3 through 6 with a single command!

Open PowerShell in the project directory and run:
```powershell
.\setup-android.ps1
```
*(If PowerShell asks about execution policy, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and rerun the script).*

---

### Step 3: Install Dependencies
Run the following commands to install project packages and the Capacitor Android engine:

```bash
npm install
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
```

---

### Step 4: Build the Web Assets
Generate the production web build (`dist/` folder):

```bash
npm run build
```

---

### Step 5: Add Android Platform & Sync Assets
The project already comes pre-configured with `capacitor.config.json`. Simply add the Android platform (first time only) and sync:

```bash
# Add Android platform (run only once if android folder doesn't exist)
npx cap add android

# Sync web assets to Android
npx cap sync android
```
*(Note: If you run `npx cap init`, it will give an error because the project is already initialized with `capacitor.config.json`. You can skip `init`).*

If copying or syncing assets manually on Windows PowerShell to ensure bundle filenames match Android assets:
```powershell
Copy-Item "dist\assets\index.js" "android\app\src\main\assets\public\assets\index-BKAj-yqA.js" -Force
Copy-Item "dist\assets\index.css" "android\app\src\main\assets\public\assets\index-DMD0ubZb.css" -Force
```

---

### Step 6: Open the Project in Android Studio
Launch Android Studio with the generated project:

```bash
npx cap open android
```

*(Alternatively, you can open Android Studio manually, click **Open**, and select the `android` folder inside your project).*

---

## 🛠️ Step 7: Build the APK in Android Studio

1. When Android Studio opens, wait for the bottom status bar to complete **"Gradle Sync"**.
2. **IMPORTANT - Clear previous cache:**
   - In the top menu bar, click: **Build** ➔ **Clean Project**
   - Wait 15–30 seconds for it to finish.
3. Generate the fresh APK:
   - In the top menu bar, click: **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**
4. When compilation finishes, a notification banner will pop up in the bottom-right corner:
   > *"APK(s) generated successfully for 1 module"*
5. Click the blue **"locate"** link inside that notification to find `app-debug.apk`.

*(Note: Running `.\setup-android.ps1` will also attempt to compile `ExpenseTracker.apk` directly into your main folder automatically!)*

### 📍 Where to find the generated `.apk` file:
The compiled APK file will be located at:
```text
<your-project-folder>\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📲 Step 8: Install the APK on Your Android Phone

### Method A: Direct Transfer (Easiest)
1. **Uninstall the old app** from your phone first (long press app icon ➔ Uninstall) to ensure all old WebView cache is completely cleared.
2. Send the `app-debug.apk` file to your phone via:
   - **USB Cable** (drag & drop into your phone's *Download* folder)
   - **Google Drive / WhatsApp / Telegram / Email**
3. On your phone, tap the `app-debug.apk` file to install it.
4. If prompted with *"Install unknown apps"*, toggle **Allow from this source**.
5. Tap **Install** and open the app!

---

## 🔍 Live Remote Debugging with Chrome (If Screen Has Issues)
Because remote web debugging is enabled in `capacitor.config.json`, you can inspect the exact live WebView and Console errors from your computer:

1. Connect your Android phone to your computer with a USB cable (with **USB Debugging** enabled in Developer Options).
2. Open **Google Chrome** on your computer and navigate to:
   ```text
   chrome://inspect/#devices
   ```
3. Under **Remote Target**, locate your phone and the app:
   > **com.personal.expensetracker** (Expense Tracker)
4. Click **inspect** next to it. A Chrome DevTools window will open mirroring your phone's screen with the full **Console** and **Elements** tabs, where you can see any errors or styles live!

### Method B: Install Directly from Android Studio (via USB)
1. Enable **Developer Options** and **USB Debugging** on your phone:
   - Go to phone **Settings** ➔ **About Phone** ➔ tap **Build Number** 7 times.
   - Go to **Developer Options** ➔ enable **USB Debugging**.
2. Connect your phone to your PC via USB.
3. In Android Studio's top toolbar, select your connected device from the device dropdown.
4. Click the green **▶ Run ('app')** button. The app will build, install, and open on your phone automatically.

---

## 🔄 How to Update the App After Making Changes
If you edit code or add features in the future, follow these quick commands to sync the changes into your Android project:

```bash
npm run build
npx cap sync android
```

If on Windows PowerShell, you can also force copy the updated asset bundles directly:
```powershell
Copy-Item "dist\assets\index.js" "android\app\src\main\assets\public\assets\index-BKAj-yqA.js" -Force
Copy-Item "dist\assets\index.css" "android\app\src\main\assets\public\assets\index-DMD0ubZb.css" -Force
```

Then re-run **Build ➔ Clean Project** and **Build ➔ Build APK(s)** in Android Studio.

---

## 📊 Google Sheets Sync & Data Backup on Android
- **1-Click Multi-Tab Google Sheets Export (`.xlsx`)**: In the **Settings ➔ Google Sheets Sync** tab, tap **"Download Workbook (.xlsx)"** to export all 3 sheets (*All Transactions*, *Monthly Summary*, and *Yearly YoY Comparison*). You can open or upload this directly to Google Drive / Google Sheets on your phone without needing any Google sign-in configuration!
- **Live Google Cloud Sync**: For live automatic API syncing directly to your Google account, you can configure your own Google Cloud OAuth 2.0 Web Client ID in the **Advanced Settings** toggle.

---

## 💡 Troubleshooting Tips for Windows Users
- **Gradle sync grayed out**: In Android Studio, go to **File** ➔ **Sync Project with Gradle Files** or click the Elephant icon on the top right.
- **Spaces in folder path**: Keep your project in a directory without spaces (e.g. `C:\ExpenseTracker` instead of `C:\Users\John Doe\My Projects`).
- **Terminal alternative**: You can also compile the APK straight from the terminal without opening Android Studio menus:
  ```bash
  cd android
  gradlew assembleDebug
  ```
  The APK will be saved at `android/app/build/outputs/apk/debug/app-debug.apk`.
