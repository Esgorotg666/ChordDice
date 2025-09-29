# 🚀 Google Play Store Deployment Checklist

## ✅ Pre-Deployment Setup (One-Time)

### 1. Google Play Developer Account
- [ ] Register at [Google Play Console](https://play.google.com/console/) ($25 fee)
- [ ] Complete identity verification
- [ ] Accept developer policies

### 2. Google Cloud Service Account
- [ ] Create Google Cloud project
- [ ] Enable "Google Play Android Developer API"
- [ ] Create service account named `play-store-deploy`
- [ ] Download JSON key file
- [ ] Add service account to Play Console with release permissions

### 3. Android Keystore
- [ ] Generate keystore: `keytool -genkey -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
- [ ] Save keystore file securely (never lose this!)
- [ ] Note passwords and alias name

### 4. GitHub Secrets Configuration
Add these secrets to your GitHub repository (Settings → Secrets → Actions):
- [ ] `SERVICE_ACCOUNT_JSON` - Complete JSON content from service account
- [ ] `KEYSTORE_BASE64` - Base64 encoded keystore file
- [ ] `KEYSTORE_PASSWORD` - Your keystore password
- [ ] `KEY_ALIAS` - Your keystore alias (e.g., "upload")
- [ ] `KEY_PASSWORD` - Your key password

### 5. First Manual Upload
- [ ] Build AAB using GitHub Actions
- [ ] Create app in Google Play Console
- [ ] Upload AAB to Internal Testing track manually
- [ ] Complete store listing information
- [ ] This enables automatic uploads for future releases

## 🔄 Regular Deployment Process

### Method 1: Version Tag (Recommended)
1. [ ] Make your changes in the app
2. [ ] Create version tag: `git tag v1.2.0`
3. [ ] Push tag: `git push origin v1.2.0`
4. [ ] ✅ GitHub Actions automatically builds and uploads to Play Store

### Method 2: Manual Workflow
1. [ ] Make your changes in the app
2. [ ] Go to GitHub → Actions → "Build and Deploy Android App"
3. [ ] Click "Run workflow"
4. [ ] Enable "Deploy to Google Play Store"
5. [ ] ✅ Manual deployment triggered

### Method 3: Manual Upload (Backup)
1. [ ] Push changes to trigger build
2. [ ] Download AAB from GitHub Actions artifacts
3. [ ] Upload manually to Google Play Console

## 📊 Release Promotion Path

1. [ ] **Internal Testing** (Automatic) - Up to 100 testers
2. [ ] **Alpha** (Manual promote) - Closed testing
3. [ ] **Beta** (Manual promote) - Open testing
4. [ ] **Production** (Manual promote) - Live release

## 🛠️ Troubleshooting

### Build Fails
- [ ] Check all GitHub secrets are set correctly
- [ ] Verify keystore is valid and passwords match
- [ ] Check Android SDK compatibility

### Upload Fails
- [ ] Verify service account permissions in Play Console
- [ ] Ensure app exists in Play Console (first manual upload required)
- [ ] Check version code increments properly

### Version Conflicts
- [ ] Ensure each release has unique version code
- [ ] Version codes auto-increment with releases
- [ ] Check no duplicate versions in any track

## 🎯 Success Indicators

- [ ] GitHub Actions build completes successfully
- [ ] AAB and APK artifacts are generated
- [ ] Play Store upload succeeds (check console logs)
- [ ] Release appears in Google Play Console Internal Testing
- [ ] App can be installed from Internal Testing track

## 📱 App Store Compliance Met

- [x] Target API level 35 (Android 15) - 2025 compliant
- [x] AAB format required for new apps
- [x] Account deletion functionality implemented
- [x] Demo mode available for reviewers
- [x] Secure keystore management
- [x] Automatic version management

## 🆘 Emergency Procedures

### If Keystore is Lost
1. Generate new upload key
2. Contact Google Play Support for key reset
3. Update GitHub secrets with new keystore

### If Service Account is Compromised
1. Revoke service account in Google Cloud
2. Create new service account
3. Update Play Console permissions
4. Update GitHub secrets

---

**Your app is ready for millions of users!** 🌟