---
description: Firebase Analytics Setup Guide for React Native Expo
---

# Firebase Analytics Setup Guide for React Native Expo

This guide will walk you through setting up Firebase Analytics in your React Native Expo app with best practices for production.

## Overview

Firebase Analytics provides:

- **Event Tracking**: Track user actions and custom events
- **Funnels**: Analyze user journey through conversion paths
- **Retention**: Measure user engagement over time
- **Feature Usage**: Monitor which features users interact with
- **Subscription Events**: Track subscription lifecycle events

## Prerequisites

1. Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Expo app with EAS Build configured (Firebase Analytics requires native code)
3. Google Services files (google-services.json for Android, GoogleService-Info.plist for iOS)

## Step 1: Install Required Packages

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

## Step 2: Configure Firebase for Android

1. Download `google-services.json` from Firebase Console
2. Place it in the project root or `android/app/` directory
3. Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Step 3: Configure Firebase for iOS

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in the project root
3. Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

## Step 4: Configure App Config

Add Firebase Analytics configuration to your app config to enable automatic screen tracking and other features.

## Step 5: Create Analytics Service

Create a centralized analytics service to manage all tracking logic with TypeScript support.

## Step 6: Implement Event Tracking

Set up tracking for:

- Screen views
- User interactions
- Custom events
- E-commerce events
- Subscription events

## Step 7: Build with EAS

Firebase Analytics requires native code, so you need to build with EAS:

```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

## Best Practices

### 1. Event Naming Conventions

- Use snake_case for event names: `button_click`, `screen_view`
- Keep names under 40 characters
- Use descriptive, consistent names
- Prefix custom events: `app_feature_used`, `app_subscription_started`

### 2. Parameter Best Practices

- Maximum 25 parameters per event
- Parameter names: 40 characters max
- Parameter values: 100 characters max for strings
- Use consistent parameter names across events

### 3. User Properties

- Set user properties for segmentation
- Maximum 25 user properties
- Update when user state changes
- Examples: subscription_status, user_type, preferred_language

### 4. Privacy & Compliance

- Respect user privacy settings
- Implement analytics consent
- Disable analytics for users who opt out
- Follow GDPR, CCPA guidelines

### 5. Performance

- Batch events when possible
- Avoid tracking PII (Personally Identifiable Information)
- Use predefined events when available
- Limit custom events to meaningful actions

### 6. Testing

- Use debug mode during development
- Verify events in Firebase Console DebugView
- Test on real devices
- Monitor data quality regularly

## Common Events to Track

### User Engagement

- `screen_view`: Automatic with proper setup
- `session_start`: Automatic
- `first_open`: Automatic

### Feature Usage

- `feature_used`: When user uses a specific feature
- `button_click`: Important button interactions
- `search`: Search queries
- `share`: Content sharing

### Subscription Events

- `begin_checkout`: User starts subscription flow
- `purchase`: Successful subscription
- `refund`: Subscription refunded
- `subscription_cancel`: User cancels subscription
- `subscription_renew`: Subscription renewed

### Funnels

- `onboarding_start`
- `onboarding_step_complete`
- `onboarding_complete`
- `profile_create_start`
- `profile_create_complete`

### Retention

- `daily_active`: Track daily active users
- `feature_discovery`: New feature discovered
- `return_visit`: User returns after X days

## Debugging

### Enable Debug Mode

**Android:**

```bash
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

**iOS:**
Add `-FIRAnalyticsDebugEnabled` to Xcode scheme arguments

### View Debug Events

1. Go to Firebase Console
2. Navigate to Analytics > DebugView
3. Select your device
4. See events in real-time

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [React Native Firebase Docs](https://rnfirebase.io/analytics/usage)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
