# KOACH AI App Store Submission Guide

## Overview

KOACH AI is a Progressive Web App (PWA) that can be submitted to both Apple App Store and Google Play Store. This document covers all steps needed for submission and native app wrapping.

## Quick Timeline

- **PWA Launch**: Immediate (no review)
- **iOS TestFlight**: 1-3 days
- **iOS App Store**: 1-7 days
- **Android Play Store**: 1-3 days
- **Parallel submission recommended**: Submit both simultaneously

---

## Part 1: PWA-First Launch Strategy

### Why PWA First?

1. **Immediate availability** — No App Store review delays
2. **Single codebase** — iOS and Android use same app
3. **Automatic updates** — No user download needed
4. **Testing ground** — Validate before native submission

### PWA Distribution

**App URL**: https://app.koachai.com

Users access via:
- Direct link from marketing
- QR code
- Email/SMS
- Browser bookmark
- Home screen add (prompted after 3 visits)

---

## Part 2: iOS App Store Submission

### Prerequisites

**Apple Developer Account Setup** ($99/year):
1. Go to developer.apple.com
2. Enroll in Apple Developer Program
3. Verify email and complete legal agreements
4. Create App ID:
   - Bundle ID: `com.koachai.app`
   - Capabilities: Push Notifications, HomeKit
5. Create provisioning profiles:
   - Development profile (testing)
   - Distribution profile (submission)

### Build Native iOS App

**Step 1: Wrap PWA with Capacitor**

```bash
npm install -g @capacitor/cli
npx cap init "KOACH AI" com.koachai.app
npx cap add ios
npx cap add android
npx cap sync
```

**Step 2: Add iOS-Specific Assets**

Create folders in `ios/App/App/Assets.xcassets`:
- `AppIcon.appiconset/` — App icons (all sizes)
- `LaunchScreen/` — Launch image

**Step 3: Configure Push Notifications**

In Xcode:
1. Select App target
2. Signing & Capabilities → + Capability
3. Add "Push Notifications"
4. Add "Background Modes" → "Remote notifications"
5. Add "App Groups" (for shared data)

**Step 4: Build & Archive**

```bash
cd ios/App
pod install
npx cap copy
```

Open in Xcode:
```bash
open ios/App/App.xcworkspace
```

In Xcode:
1. Select "Any iOS Device" or simulator
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload to App Store Connect

### App Store Connect Setup

**Create App Record**:
1. Go to appstoreconnect.apple.com
2. Apps → + App
3. Platform: iOS
4. Name: "KOACH AI"
5. Primary Language: English (US)
6. Bundle ID: `com.koachai.app`
7. SKU: `KOACH-AI-001`

### App Metadata

**General Information**:
- **App Name**: KOACH AI
- **Subtitle**: Personal Coaching Platform
- **Category**: Health & Fitness
- **Content Rating**: 4+ (Everyone)

**Description** (up to 4000 chars):

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

**Keywords** (100 chars max):
```
fitness coach,workout tracker,nutrition log,personal training,coaching,check-in,progress
```

**Support URL**: https://support.koachai.com
**Privacy Policy URL**: https://koachai.com/privacy
**Copyright**: © 2026 KOACH AI, Inc.

### Screenshots

Create 6 screenshots (1242×2208 for 6.7" devices):

**Screenshot 1**: Home Dashboard
- Headline: "Your daily coaching hub"
- Show: Coach card, daily goals, upcoming workout
- Branding: KOACH AI logo top

**Screenshot 2**: Workout Logging
- Headline: "Track every rep, every set"
- Show: Active workout screen with exercises

**Screenshot 3**: Nutrition Tracking
- Headline: "Fuel your transformation"
- Show: Macro ring, meal cards

**Screenshot 4**: Coach Messaging
- Headline: "Your coach, always available"
- Show: Message thread, coach response

**Screenshot 5**: Progress Tracking
- Headline: "See how far you've come"
- Show: Weight chart, achievements

**Screenshot 6**: Community
- Headline: "Train together, grow together"
- Show: Community feed, posts

### Test Account

Provide in App Review Notes:
```
Test Account:
Email: reviewer@koachai.com
Password: TestCoach2026!

Demo Coach Account:
Email: demo@koachai.com
Password: DemoCoach2026!

Note: This PWA-wrapped app provides the full coaching platform experience. All features are functional. Test account is pre-populated with sample data for demo purposes.
```

### Version & Build

- **Version Number**: 1.0.0
- **Build Number**: 1

### Before You Submit

**Checklist**:
- [ ] All text spelled correctly (no Lorem Ipsum)
- [ ] All links functional
- [ ] Privacy policy and terms of service accessible
- [ ] Camera permissions explained
- [ ] Photo library permissions explained
- [ ] Notification permissions explained
- [ ] No references to competing platforms
- [ ] Screenshots match actual app functionality
- [ ] Test account works and is responsive
- [ ] No console errors or crashes

### Submit for Review

1. App Store Connect → Your App → Version 1.0
2. Scroll to "Submit for Review"
3. Fill in export compliance (select "No" for encryption)
4. Add app review notes (see above)
5. Agree to export compliance terms
6. Select demo account info
7. Click "Submit for Review"

**Expected Review Time**: 1-7 days

---

## Part 3: Google Play Store Submission

### Prerequisites

**Google Play Developer Account** ($25 one-time):
1. Go to play.google.com/console
2. Create Developer account
3. Accept developer program agreements
4. Complete payment

### Build Native Android App

**Step 1: Generate Signing Key**

```bash
cd android/app
keytool -genkey -v -keystore koach-ai-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias koach-ai-key
```

**Step 2: Configure Signing**

Edit `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('koach-ai-release.jks')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

**Step 3: Build Release APK/AAB**

```bash
cd android
./gradlew bundleRelease
```

Generated file: `app/release/app-release.aab`

### Play Console Setup

**Create App Record**:
1. Google Play Console → Create app
2. App name: "KOACH AI — Personal Coaching"
3. Default language: English (US)
4. Category: Health & Fitness
5. Content rating: Everyone

### App Metadata

**Short Description** (80 chars):
```
Connect with your coach, track workouts, and crush your goals
```

**Full Description**:
(Same as iOS, formatted for Play Store with bullet points)

**Screenshots**:

Create 8 screenshots (1080×1920 for 5.4" phones):
- Same 6 as iOS
- Plus 2 additional showing key features

### Minimum Specifications

- **Min SDK**: Android 7 (API 24)
- **Target SDK**: Android 14 (API 34)
- **Screen sizes**: Requires support for phones
- **Densities**: All screen densities

### Content Rating

Complete questionnaire:
- No violence
- No mature content
- No sexual content
- Allows in-app purchases: Yes (premium features)

### Pricing & Distribution

- **Pricing**: Free
- **Countries**: All available

### Add Release

1. Internal Testing Track
2. Upload AAB file
3. Fill in release name: "v1.0"
4. Release notes: "Initial launch of KOACH AI"
5. Test on internal track first

### TestFlight-Equivalent: Internal Testing Track

Add 20-50 testers:
- Google accounts to test
- They receive email with testing link
- Get feedback before public release

### Submit to Production

1. Complete review of all required sections
2. Internal Testing Track → Production
3. Accept Play Store policies
4. Submit for review

**Expected Review Time**: 1-3 days

---

## Part 4: Post-Launch

### Monitor & Respond

**iOS App Store**:
- Monitor reviews daily
- Respond to all 1-star reviews
- Aim for 4.5+ rating
- Track crashes in App Store Connect

**Google Play**:
- Monitor reviews and ratings
- Track ANR (Application Not Responding) rates
- Monitor crash reports
- Fix critical bugs within 48 hours

### Update Cycle

**Week 1 Post-Launch**:
- Monitor feedback
- Identify critical bugs
- Plan v1.1 hotfix release

**v1.1 (Week 2)**:
- Bug fixes from user feedback
- Performance improvements
- Resubmit to both stores

### Analytics

Track:
- Daily active users
- Crash rate
- Average session duration
- User retention (1-day, 7-day, 30-day)
- Feature usage (workouts logged, check-ins submitted)

---

## Part 5: App Store Optimization (ASO)

### Keyword Strategy

Focus on high-intent keywords:
- "fitness coach" (High volume, competitive)
- "workout tracker" (High volume)
- "nutrition log" (Medium volume)
- "personal trainer" (High volume)
- "check-in app" (Lower volume, specific)

### Ongoing Updates

- Update screenshots seasonally
- Refresh app description based on new features
- Run A/B tests on store copy
- Monitor competitor keywords

---

## Part 6: Compliance Checklist

Before submission, verify:

- [ ] Privacy Policy is public and links from app
- [ ] Terms of Service are accessible
- [ ] All external URLs are working
- [ ] No placeholder text or Lorem Ipsum
- [ ] No references to competing platforms
- [ ] Age rating is appropriate (4+)
- [ ] Permissions are explained in-app
- [ ] No crash on first launch
- [ ] Test account credentials provided
- [ ] Screenshots match actual app
- [ ] App works on min and max SDK devices
- [ ] No hardcoded test data
- [ ] Push notifications request permission first

---

## Appendix: Environment Variables for App Submission

Store securely in CI/CD (GitHub Actions, Bitbucket Pipelines):

```
KEYSTORE_PASSWORD=...
KEY_ALIAS=koach-ai-key
KEY_PASSWORD=...
APPLE_ID=...
APPLE_ID_PASSWORD=...
TEAM_ID=...
APP_STORE_CONNECT_KEY_ID=...
```

Never commit these to version control.

---

## Support

- **iOS Issues**: Visit developer.apple.com/app-store-connect
- **Android Issues**: Visit play.google.com/console
- **General Questions**: Contact support@koachai.com