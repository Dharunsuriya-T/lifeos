# LifeOS Mobile Client Guide

This document provides step-by-step instructions on how to set up, run locally, build, and release the **LifeOS Mobile App** built with **React Native** and **Expo 51**.

---

## 📱 Web Deployment vs. Mobile Release

| Concept | Web Client (Vercel / Render) | Mobile Client (Android & iOS) |
| :--- | :--- | :--- |
| **Delivery Model** | Static website files (HTML/JS/CSS) served via a URL. | Compiled binary packages (.apk/.aab for Android, .ipa for iOS) installed on the device. |
| **Hosting / Store** | Render (Web service API) + Vercel (Frontend CDN). | Google Play Store + Apple App Store. |
| **Updates** | Immediate. Pushing code to `main` redeploys the site instantly. | Requires store approval for code changes (or Expo Updates OTA). |
| **Offline Cache** | Browser LocalStorage / IndexedDB. | Device native `AsyncStorage` cache. |

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed:
1. **Node.js** (v18 or v20 recommended)
2. **Git**
3. **Expo Go app** on your physical Android or iOS device (download from Google Play Store or Apple App Store).
4. **Android Studio** (for running on local Android Emulator) and/or **Xcode** (macOS only, for running on iOS Simulator).

---

## 🚀 Running the Mobile App Locally

### 1. Install Dependencies
Navigate to the `mobile` directory and run npm install:
```bash
cd mobile
npm install
```

### 2. Start the Expo Dev Server
Launch the Expo bundler:
```bash
npm run start
# or: npx expo start
```

This starts the Expo CLI and displays a **QR Code** in your terminal.

### 3. Open and View the App

#### Option A: Run on a Physical Device (Recommended)
1. Ensure your computer and mobile phone are connected to the **same Wi-Fi network**.
2. Open the **Expo Go** app:
   - **Android**: Tap "Scan QR Code" in Expo Go and scan the terminal QR code.
   - **iOS**: Open the native iOS **Camera** app, scan the QR code, and tap the prompt to open in Expo Go.
3. The app will fetch the bundle from your computer and render locally.

> [!TIP]
> **If you encounter network errors (e.g. timeout connecting to your local IP):**
> Run the server in **Tunnel Mode** using ngrok to bypass local firewalls:
> ```bash
> npx expo start --tunnel
> ```

#### Option B: Run on Android Emulator
1. Launch your Android Emulator from Android Studio (AVD Manager).
2. Once the emulator is booted, press `a` in your terminal where `expo start` is running.
3. The CLI will automatically install and open Expo Go inside the emulator.

#### Option C: Run on iOS Simulator (macOS Only)
1. Open the simulator using Xcode or via command line.
2. Press `i` in your terminal where `expo start` is running.
3. The CLI will open the app in the simulated iOS environment.

---

## 📦 Building and Packaging (EAS Build)

To package your application for public release, Expo uses **EAS (Expo Application Services)** to compile binary packages in the cloud.

### Step 1: Set Up an Expo Account
1. Go to [expo.dev](https://expo.dev) and register for a free account.
2. Install the EAS CLI tool globally on your computer:
   - `npm install -g eas-cli`
3. Log in to your Expo account via command line:
   - `eas login`

### Step 2: Configure EAS Build
Initialize your configuration (creates `eas.json` in the root of your mobile folder):
```bash
cd mobile
eas build:configure
```
Select "All" when asked which platforms to configure.

### Step 3: Run the Cloud Build
To build release packages, run:

```bash
# Build Android App Bundle (.aab) for Google Play Store upload
eas build --platform android

# Build iOS Package (.ipa) for App Store / TestFlight upload
eas build --platform ios
```

The build will compile on Expo's remote servers. You will receive a link to monitor progress and download the completed bundle.

---

## 🚀 Releasing to App Stores

Once EAS generates the binaries, follow these steps to release the mobile application to users:

### 🤖 Android: Releasing to Google Play Store
1. **Google Play Console**: Create a developer account on the [Google Play Console](https://play.google.com/console) (one-time $25 fee).
2. **Create App**: Click "Create App", choose app name, default language, and select "App" type.
3. **Submit Binary**:
   - Auto-submit using EAS: `eas submit --platform android`
   - Alternatively, download the generated `.aab` file from Expo dashboard and upload it manually under the **Production** or **Internal testing** tracks.
4. **App Details**: Fill in the Store Listing details (screenshots, description, icons, privacy policy).
5. **Review and Release**: Send the app for Google's review. Once approved, the app will be live on the Google Play Store!

### 🍎 iOS: Releasing to Apple App Store
1. **Apple Developer Program**: Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year fee).
2. **App Store Connect**: Log in to [App Store Connect](https://appstoreconnect.apple.com/).
3. **Register App**: Create a new App record with your Bundle ID.
4. **Submit Binary**:
   - Auto-submit using EAS: `eas submit --platform ios`
   - This uploads the build directly to Apple's **TestFlight** servers.
5. **TestFlight Beta Testing**: Invite internal team members or external beta testers via email to test the app using Apple's TestFlight app before sending it to public review.
6. **Submit for App Store Review**: Fill in metadata, icons, app previews, and submit the build. Once Apple's reviewers approve the build, release it to the App Store.

---

## 🔄 OTA (Over-The-Air) Updates
One major benefit of using Expo is the ability to deploy instant updates to users' devices **without** submitting a new app store update. 
By setting up **Expo Updates**, JavaScript and asset changes are fetched automatically on app startup, matching the speed and convenience of web deployments.
