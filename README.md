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

### Step 5: Initialize Capacitor & Add Android
Initialize the native Android container and generate the native Android Studio project:

```bash
npx cap init "Expense Tracker" "com.personal.expensetracker" --web-dir dist
npx cap add android
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

1. When Android Studio opens for the first time, wait 1–2 minutes for the bottom status bar to complete **"Gradle Sync"** and indexing.
2. In the top menu bar, go to:
   - **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**
3. When the compilation completes, a notification banner will pop up in the bottom-right corner:
   > *"APK(s) generated successfully for 1 module"*
4. Click the blue **"locate"** link inside that notification.

### 📍 Where to find the generated `.apk` file:
The compiled APK file will be located at:
```text
<your-project-folder>\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📲 Step 8: Install the APK on Your Android Phone

### Method A: Direct Transfer (Easiest)
1. Send the `app-debug.apk` file to your phone via:
   - **USB Cable** (drag & drop into your phone's *Download* folder)
   - **Google Drive / WhatsApp / Telegram / Email**
2. On your phone, tap the `app-debug.apk` file to install it.
3. If prompted with *"Install unknown apps"*, toggle **Allow from this source**.
4. Tap **Install** and open the app!

### Method B: Install Directly from Android Studio (via USB)
1. Enable **Developer Options** and **USB Debugging** on your phone:
   - Go to phone **Settings** ➔ **About Phone** ➔ tap **Build Number** 7 times.
   - Go to **Developer Options** ➔ enable **USB Debugging**.
2. Connect your phone to your PC via USB.
3. In Android Studio's top toolbar, select your connected device from the device dropdown.
4. Click the green **▶ Run ('app')** button. The app will build, install, and open on your phone automatically.

---

## 🔄 How to Update the App After Making Changes
If you edit code or add features in the future, follow these 3 quick commands to sync the changes into your Android project:

```bash
npm run build
npx cap sync android
```
Then re-run **Build ➔ Build APK(s)** in Android Studio.

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
