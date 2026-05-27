# KOACH AI App Store Submission Guide

## Overview

This document covers submitting KOACH AI to both Apple App Store (iOS) and Google Play Store (Android) as native apps wrapped from the PWA using Capacitor.

**Timeline:**
- PWA live immediately (no approval needed)
- iOS review: 1-7 days
- Android review: 1-3 days
- Submit both simultaneously for best results

---

## Part 1: iOS App Store Submission

### 1.1 Apple Developer Account Setup

1. Enroll in Apple Developer Program ($99/year)
   - Visit https://developer.apple.com
   - Complete identity verification
   - Set up billing

2. Create App Record in App Store Connect
   - App name: **KOACH AI**
   - Bundle ID: **com.koachai.app**
   - SKU: **KOACHAI001**
   - Platforms: iOS, visionOS (leave tvOS unchecked)

3. Generate Certificates & Provisioning Profiles
   ```bash
   # In Xcode: Preferences > Accounts > Manage Certificates
   # Generate Development and Distribution certificates
   ```

4. Configure Push Notification Certificates
   - In App Store Connect, create Push Notification certificate
   - Download and import into Xcode

### 1.2 App Metadata

**Display Name (shown on app icon):**
```
KOACH AI
```

**Subtitle (under app name in App Store):**
```
Personal Coaching Platform
```

**Description (4000 character limit):**
```
KOACH AI is the ultimate coaching platform that connects you with your personal fitness coach. Track workouts, log nutrition, submit weekly check-ins, and communicate directly with your coach — all in one beautiful app.

FEATURES:
• Personalized workout programs built by your coach
• Nutrition tracking with 1M+ food database
• Weekly check-in submissions with photo uploads
• Direct messaging with your coach
• Progress tracking with charts and before/after photos
• Achievement system to celebrate your wins
• Community feed to connect with other clients
• AI-powered insights and recommendations

YOUR COACH IS WITH YOU EVERY STEP.
Whether you're just starting out or pushing to new heights, KOACH AI keeps you connected to your coach and accountable to your goals.
```

**Category:** Health & Fitness

**Age Rating:** 4+
- No alcohol, tobacco, or drug use
- No graphic violence
- No profane language

**Keywords (100 chars max):**
```
fitness coach,workout tracker,nutrition log,personal training,online coaching,check-in,progress
```

**Support URL:**
```
https://support.koachai.com
```

**Privacy Policy URL:**
```
https://koachai.com/privacy
```

**Copyright:**
```
© 2026 KOACH AI, Inc.
```

### 1.3 App Icon

**Requirements:**
- Dimensions: 1024×1024px (at 72 dpi)
- Format: PNG with no transparency
- Apple adds rounded corners automatically — design with flat corners
- Avoid alpha channel/transparency

**Design:**
- White "K" logo on gradient background
- Use brand colors: #2563EB to #7C3AED gradient
- Ensure legibility at 180×180px (small size)

### 1.4 Screenshots

**iPhone Screenshots (5 required, max 6):**

Format: 1242×2688px (6.7" Pro Max aspect ratio)

1. **Home Screen** 
   - Headline: "Your Daily Coaching Hub"
   - Shows dashboard with workout card, stats, check-in reminder
   - Subtext: "Stay connected to your coach every day"

2. **Workout Logging**
   - Headline: "Track Every Rep, Every Set"
   - Shows active workout screen with exercise log
   - Subtext: "Build strength with precision tracking"

3. **Nutrition Tracking**
   - Headline: "Fuel Your Transformation"
   - Shows macro ring and meal logging
   - Subtext: "1M+ foods, 2 minutes to log"

4. **Coach Messaging**
   - Headline: "Your Coach, Always Available"
   - Shows messaging screen with coach responses
   - Subtext: "Real-time feedback and guidance"

5. **Progress Tracking**
   - Headline: "See How Far You've Come"
   - Shows progress charts, weight journey, photos
   - Subtext: "Data-driven insights into your growth"

**iPad Screenshots (same 5, sized for 12.9"):**
- Use 2048×2732px format
- Optimize layout for tablet viewing

### 1.5 App Preview Video (Optional but Recommended)

**Specifications:**
- Duration: 15-30 seconds
- Format: H.264 MP4 at 30fps
- Resolution: 1242×2688px (matches screenshots)
- Audio: Optional (music recommended, no voiceover needed)
- File size: Max 500MB

**Sequence:**
1. Home screen (3s) — dashboard overview
2. Workout logging (5s) — tap workout, log exercise
3. Nutrition (5s) — log meal, check macros
4. Messaging (5s) — send message to coach
5. Progress (5s) — view charts and achievements
6. Logo (2s) — KOACH AI logo with music crescendo

### 1.6 Permissions Explanation

**Privacy Policy:**
Ensure your privacy policy clearly explains:
- Camera use: Progress photos, barcode scanning
- Notifications: Coaching reminders, messages
- Health data: Optional syncing with Apple Health
- Photo library access: Upload progress photos
- Device location: Optional for session recordings

All permissions must be explicitly requested at appropriate moments in the app.

### 1.7 Build & Submission Process

#### Step 1: Set up Capacitor project

```bash
npm install @capacitor/core @capacitor/cli
npx cap init KOACH-AI com.koachai.app

# Add iOS
npx cap add ios

# Sync capacitor code
npx cap sync
```

#### Step 2: Build for production

```bash
npm run build
npx cap copy ios
```

#### Step 3: Open in Xcode

```bash
npx cap open ios
```

In Xcode:
1. Select "KOACH AI" project in left panel
2. Go to "Signing & Capabilities" tab
3. Select team (your Apple Developer team)
4. Xcode auto-generates provisioning profiles
5. Verify Bundle ID is `com.koachai.app`

#### Step 4: Configure Push Notifications

1. In Xcode project settings:
   - Click "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" (enable Remote Notifications)

#### Step 5: Archive and Submit

```bash
# In Xcode: Product > Archive
# (or use command line)
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/KOACH.xcarchive \
  archive
```

Then in App Store Connect:
1. Click "Create New Version"
2. Upload archive via Xcode or Transporter
3. Complete all required information
4. Submit for review

### 1.8 TestFlight (Beta Testing)

Before submitting for public review:

```
App Store Connect > TestFlight
```

1. Create new version for internal testing
2. Add up to 100 testers
3. Invite beta testers via email
4. TestFlight app automatically installs on their devices
5. Collect feedback for 1-2 weeks
6. Fix critical issues found by testers
7. Then submit for public review

---

## Part 2: Google Play Store Submission

### 2.1 Google Play Developer Account Setup

1. Create Google Play Developer Account
   - One-time fee: $25
   - Visit https://play.google.com/console
   - Sign in with Google account
   - Complete registration

2. Create Signing Keystore
   ```bash
   # Generate keystore (do this once, store securely)
   keytool -genkey -v -keystore koach-release.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias koach-key \
     -storepass YourStrongPassword \
     -keypass YourStrongPassword \
     -dname "CN=KOACH AI Inc, O=KOACH AI, C=US"
   
   # Store this file securely (backup to encrypted drive)
   ```

3. Create App Record
   - App name: **KOACH AI — Personal Coaching**
   - Package name: **com.koachai.app**
   - App category: Health & Fitness
   - Content rating: Everyone

### 2.2 App Metadata

**App Name (shown on store):**
```
KOACH AI — Personal Coaching
```

**Short Description (80 chars):**
```
Connect with your coach, track workouts, and crush your goals
```

**Full Description (4000 chars):**
```
KOACH AI is the ultimate coaching platform that connects you with your personal fitness coach. Track workouts, log nutrition, submit weekly check-ins, and communicate directly with your coach — all in one beautiful app.

FEATURES:
• Personalized workout programs built by your coach
• Nutrition tracking with 1M+ food database
• Weekly check-in submissions with photo uploads
• Direct messaging with your coach
• Progress tracking with charts and before/after photos
• Achievement system to celebrate your wins
• Community feed to connect with other clients
• AI-powered insights and recommendations

YOUR COACH IS WITH YOU EVERY STEP.
Whether you're just starting out or pushing to new heights, KOACH AI keeps you connected to your coach and accountable to your goals.
```

**Category:** Health & Fitness

**Content Rating:** Everyone

**Tags (max 5):**
```
fitness, coaching, workout, nutrition, health
```

### 2.3 App Icon

**Requirements:**
- Dimensions: 512×512px
- Format: PNG with transparency (32-bit)
- Adaptive icon with safe zone (192×192px center)

**Adaptive Icon Structure:**
- Foreground layer (192×192px): White "K" logo
- Background layer (512×512px): Gradient background
- Google adds safe zone cropping — stay centered

### 2.4 Screenshots

Same 6 screenshots as iOS, but adapted for Android:
- Format: Full phone screenshots (1080×1920px minimum)
- Show Android bottom navigation visible
- Ensure text is readable (min 12sp)

### 2.5 Build & Submission Process

#### Step 1: Set up Capacitor (same as iOS)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init KOACH-AI com.koachai.app
npx cap add android
npx cap sync
```

#### Step 2: Build release APK/AAB

```bash
npm run build
npx cap copy android
```

Open `android/` folder in Android Studio:
1. File > Open > Select `android/` folder
2. Build > Generate Signed Bundle/APK
3. Select "Android App Bundle" (AAB format preferred)
4. Choose your keystore (koach-release.keystore)
5. Select Release build variant
6. Click Generate

#### Step 3: Enable Google Play Signing

In Play Console:
```
Release > Production > App signing
```
- Google manages your signing key securely
- Upload first APK/AAB and Google takes it from there
- You keep backup of original keystore

#### Step 4: Set up Release Track

```
Release > Internal Testing
```

1. Create internal test release
2. Upload AAB file
3. Add internal test users (test accounts)
4. Test thoroughly for 3-5 days
5. Move to Closed Testing (external testers)
6. Collect feedback for 1 week
7. Move to Production

#### Step 5: Submit for Review

```
Release > Production
```

1. Create production release
2. Upload final AAB
3. Complete required fields (all screenshots, description, etc.)
4. Review "Rights and certification" requirements
5. Click "Review release"
6. Fix any warnings/errors
7. Click "Rollout to production"

### 2.6 Android Content Rating

Complete Google Play's Content Rating Questionnaire:
- No violence
- No sexual content
- No profanity
- Target audience: Fitness enthusiasts, health-conscious users

---

## Part 3: Common Submission Issues & Solutions

### App Rejection Checklist

- [ ] **Functionality:** All features in screenshots are actually functional
- [ ] **Placeholder text:** No Lorem Ipsum, no "TODO" text anywhere
- [ ] **Demo account:** demo@koachai.com / DemoCoach123! is set up and works
- [ ] **Privacy policy:** URL is live, accessible, and relevant
- [ ] **Permissions:** All permission requests explained and necessary
- [ ] **Links:** All external links (support, privacy, terms) are live
- [ ] **Age ratings:** Accurate for content
- [ ] **No deceptive claims:** All feature descriptions are truthful
- [ ] **Performance:** App doesn't crash, no major bugs
- [ ] **Offline handling:** App gracefully handles offline states
- [ ] **No references to other platforms:** iOS app shouldn't mention "Android exclusive"
- [ ] **Consistent branding:** Logo, colors, fonts match across app

### iOS Common Rejections

1. **Misleading metadata:** Description doesn't match actual app
   - Solution: Update description to match implemented features

2. **Incomplete onboarding:** Reviewers can't figure out how to use app
   - Solution: Demo account with sample workout/nutrition data pre-loaded

3. **Missing privacy policy:** URL is broken or incomplete
   - Solution: Host complete privacy policy, ensure URL is live

4. **Crash on launch:** App doesn't open on reviewer's device
   - Solution: Test on latest iOS version, fix memory leaks

### Android Common Rejections

1. **Security issues:** App permissions misused or overly broad
   - Solution: Only request necessary permissions, explain each

2. **Performance:** App crashes or ANRs (Application Not Responding)
   - Solution: Profile app, fix memory leaks, optimize network calls

3. **Deceptive behavior:** App does things not disclosed
   - Solution: Be transparent about background processes

---

## Part 4: Beta Testing Setup

### TestFlight (iOS)

```
App Store Connect > TestFlight > Internal Testing
```

1. Add up to 25 internal testers (your team)
2. Invite 100+ external testers for wider feedback
3. Create feedback form:
   - "Tap here to send beta feedback"
   - Users can email: feedback@koachai.com
4. Monitor crash logs weekly
5. Check ratings in TestFlight (separate from App Store)

### Play Console (Android)

```
Release > Internal Testing
```

1. Create internal test release
2. Add up to 100 internal testers
3. Test for 1 week minimum
4. Fix all crashes/ANRs from Crash reporting
5. Move to Closed Testing (5-100 testers)
6. Get 1-2 weeks feedback
7. Move to Open Testing (anyone with link) if needed
8. Move to Production when confident

---

## Part 5: Post-Launch Operations

### Week 1: Monitor for Crashes

```
App Store Connect (iOS):
  Analytics > Performance > Crash logs
  
Google Play Console (Android):
  Analytics > Android Vitals > Crashes
```

- Fix all critical crashes immediately
- Prepare hotfix release if needed
- Monitor user feedback

### Respond to Reviews

**iOS:**
```
App Store Connect > Sales and Trends > Reviews
```
- Respond to all negative reviews
- Thank users for positive reviews
- Address concerns professionally

**Android:**
```
Google Play Console > User reviews
```
- Respond within 24-48 hours
- Max 350 characters per response
- Be helpful and professional

### Version Updates Strategy

**Week 2 after launch:**
- Collect user feedback
- Fix reported bugs
- Push v1.1 update
- Update release notes with fixes/improvements

**Monthly after that:**
- Add new features based on user requests
- Optimize performance
- Push updates on consistent schedule (e.g., first Monday of month)

---

## Part 6: Capacitor Setup Details

### Full Build Instructions

```bash
# 1. Update manifest for PWA
# (Already in public/manifest.json)

# 2. Install Capacitor
npm install @capacitor/core @capacitor/cli

# 3. Initialize Capacitor project
npx cap init KOACH-AI com.koachai.app

# 4. Add iOS and Android platforms
npx cap add ios
npx cap add android

# 5. Build React app
npm run build

# 6. Copy built files to native projects
npx cap copy

# 7. Sync configuration
npx cap sync

# 8. Open in Xcode or Android Studio
npx cap open ios
npx cap open android
```

### Capacitor Configuration (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koachai.app',
  appName: 'KOACH AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOption: 'badge | sound | alert',
    },
  },
};

export default config;
```

---

## Part 7: Continuous Deployment

### Recommended Release Schedule

```
iOS:
  - Submit to TestFlight immediately (auto-review: ~1 hour)
  - External TestFlight for 1 week
  - Submit to App Store
  - Review: 1-7 days (usually 2-3)

Android:
  - Submit to Internal Testing immediately
  - Closed Testing for 1 week
  - Submit to Production
  - Review: 1-3 days
  
Both:
  - PWA goes live immediately
  - Have both submitted at same time
  - Stagger releases if bugs found
```

---

## Resources

- **Apple Developer:** https://developer.apple.com
- **Google Play Console:** https://play.google.com/console
- **Capacitor Docs:** https://capacitorjs.com
- **iOS App Distribution:** https://developer.apple.com/app-store/
- **Android Publishing:** https://play.google.com/console/about/
- **TestFlight Guide:** https://developer.apple.com/testflight/

---

## Checklist for Launch

- [ ] Capacitor initialized and configured
- [ ] iOS certificates and provisioning profiles created
- [ ] Android keystore generated and securely stored
- [ ] App Store Connect record created with all metadata
- [ ] Google Play Console record created with all metadata
- [ ] Screenshots designed for both platforms
- [ ] App icon created (iOS 1024×1024, Android 512×512)
- [ ] Privacy policy published and URL working
- [ ] Support page set up
- [ ] Demo account created and tested
- [ ] Internal TestFlight build uploaded and tested
- [ ] Android internal test build uploaded and tested
- [ ] External TestFlight testers invited
- [ ] All critical bugs fixed
- [ ] TestFlight version released and approved
- [ ] Android internal testing completed
- [ ] Final builds ready for submission
- [ ] Both submitted to stores simultaneously
- [ ] Monitoring setup for crash logs and reviews