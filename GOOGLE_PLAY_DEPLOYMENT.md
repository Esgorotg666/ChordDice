# 🚀 Deploy to Google Play Store

Your Chord Riff Generator is now ready for Google Play Store! Here's the simple process:

## 📋 Prerequisites

1. **Google Play Developer Account** - $25 one-time registration fee
   - Sign up at: https://play.google.com/console/
   - Complete identity verification and payment

2. **Android Keystore** (for app signing) - **REQUIRED**
   - You need to create a keystore file for signing your app
   - Follow the setup instructions in the "🔐 Keystore Setup" section below

## 🔄 Automatic Build Process (GitHub Actions)

Every time you push code to GitHub, your app will automatically:
- ✅ Build the React web app
- ✅ Generate Android APK (for testing)
- ✅ Generate Android App Bundle (AAB for Google Play)
- ✅ Make files available for download

## 📱 Publishing Steps

### 1. Get Your Built App
- Go to your GitHub repository
- Click "Actions" tab
- Click the latest successful build
- Download the **AAB file** (not APK) from artifacts

### 2. Upload to Google Play Console
- Go to [Google Play Console](https://play.google.com/console/)
- Click "Create app"
- Choose:
  - **App name**: "Chord Riff Generator"
  - **Default language**: English
  - **App or game**: App
  - **Free or paid**: Free (with in-app purchases)

### 3. Upload Your App Bundle
- Go to "Production" → "Releases"
- Click "Create new release"
- Upload your **app-release.aab** file
- Add release notes: "Initial release - AI-powered chord progression generator"

### 4. Complete Store Listing
- **App description**: Copy from your web app
- **Screenshots**: Take screenshots of your app in action
- **App icon**: Use your existing app icon
- **Feature graphic**: Create a banner image (1024x500px)

### 5. Content Rating & Policies
- Complete content rating questionnaire
- Add privacy policy (required for music apps)
- Review and accept Google Play policies

### 6. Review & Publish
- Review all sections for completeness
- Submit for review (usually takes 1-3 days)
- Once approved, your app goes live!

## 🔐 Keystore Setup (CRITICAL - Do This First!)

Before your app can build for Google Play, you MUST create an Android keystore:

### Step 1: Create Keystore
Run this command on your computer (requires Java):
```bash
keytool -genkey -v -keystore chordriff-release.keystore -alias chordriff -keyalg RSA -keysize 2048 -validity 10000
```

When prompted, enter:
- **Store password**: Create a strong password (save this!)
- **Key password**: Same as store password (or different - save this!)
- **Name details**: Your name/company info

### Step 2: Add to GitHub Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `KEYSTORE_BASE64`: Your keystore file encoded as base64
   - `KEYSTORE_PASSWORD`: Your keystore password
   - `KEY_ALIAS`: `chordriff` (or whatever alias you used)
   - `KEY_PASSWORD`: Your key password

### Step 3: Encode Keystore as Base64
Run this command (replace with your actual keystore path):
```bash
base64 -i chordriff-release.keystore | tr -d '\n'
```
Copy the output and paste it as `KEYSTORE_BASE64` secret.

**⚠️ IMPORTANT**: Keep your keystore file safe! If you lose it, you can never update your app on Google Play.

## 🔄 Future Updates

To update your app:
1. Make changes in Replit
2. Push to GitHub
3. Download new AAB from GitHub Actions (automatically signed!)
4. Upload to Google Play Console as new release

## 🎵 Ready to Launch!

Your app includes:
- ✅ Professional chord progression generator
- ✅ Premium subscription system ($4.99/month)
- ✅ Real-time chat with audio sharing
- ✅ Comprehensive referral program
- ✅ Enterprise-grade security

**Your music app is ready for millions of users!** 🌟