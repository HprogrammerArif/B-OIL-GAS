# 🔥 Firebase Analytics Implementation Guide

## Beginner-Friendly Tutorial for Co-Parenting App

---

## 📚 Table of Contents

1. [What is Firebase Analytics?](#what-is-firebase-analytics)
2. [Core Concepts](#core-concepts)
3. [Implementation by Feature](#implementation-by-feature)
4. [Real Examples for Your App](#real-examples-for-your-app)
5. [Testing & Debugging](#testing--debugging)

---

## 🎯 What is Firebase Analytics?

Firebase Analytics is like a **"spy camera"** for your app that tells you:

- 📱 Which screens users visit most
- 🖱️ Which buttons they click
- ⏱️ How long they spend on each screen
- 🚪 Where they drop off (leave the app)
- 👥 Who your users are (demographics, behavior patterns)

**Why it matters:** You can make better decisions about what features to build, what to improve, and what users actually care about!

---

## 🧠 Core Concepts

### 1. **Events**

Think of events as "things that happen" in your app.

- Example: User clicks "Add Expense" button → That's an event!
- Example: User views the Calendar screen → That's an event!

### 2. **Parameters**

Extra details about an event.

- Event: "button_click"
- Parameters: `{ button_name: "add_expense", screen_name: "expenses" }`

### 3. **User Properties**

Characteristics of your users that don't change often.

- Example: `user_type: "premium"` or `subscription_status: "active"`

### 4. **Screen Tracking**

Automatically tracks which screens users visit.

- ✅ Already set up in your `_layout.tsx`!

---

## 🚀 Implementation by Feature

### ✅ **1. Screen Tracking (Already Done!)**

**What it does:** Automatically tracks every screen a user visits.

**Where it's implemented:**

```typescript
// In app/_layout.tsx (lines 44-45)
useAnalyticsScreenTracking();
```

**What you get:**

- See which screens are most popular
- Understand user navigation flow
- Identify screens where users spend the most time

**No action needed** - This is already working! 🎉

---

### 🔐 **2. User Authentication Tracking**

**When to use:** Track when users sign up or log in.

**Why:** Understand user acquisition and retention.

#### Implementation:

**File:** `app/(auth)/sign-in.tsx` or wherever you handle login

```typescript
import analyticsService from "@/services/analytics";

// After successful login
const handleLogin = async (email: string, password: string) => {
  try {
    // Your login logic here...
    const user = await loginUser(email, password);

    // 🔥 Track the login
    await analyticsService.logLogin("email");

    // 🔥 Set user ID for tracking
    await analyticsService.setUserId(user.id);

    // 🔥 Set user properties
    await analyticsService.setUserProperties({
      user_type: user.isPremium ? "premium" : "free",
      subscription_status: user.subscriptionStatus,
      onboarding_completed: user.hasCompletedOnboarding,
    });

    // Navigate to home...
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

**For Sign Up:**

```typescript
// After successful registration
const handleSignUp = async (email: string, password: string) => {
  try {
    const newUser = await registerUser(email, password);

    // 🔥 Track the signup
    await analyticsService.logSignUp("email");

    // 🔥 Set user ID
    await analyticsService.setUserId(newUser.id);

    // 🔥 Track onboarding start
    await analyticsService.logOnboardingStart();
  } catch (error) {
    console.error("Signup failed:", error);
  }
};
```

---

### 🖱️ **3. Button Click Tracking**

**When to use:** Track important button clicks to see what users interact with.

**Why:** Understand which features users actually use.

#### Example: Track "Add Expense" Button

**File:** `app/add-expense.tsx`

```typescript
import { useButtonTracking } from '@/hooks/useAnalytics';

export default function AddExpenseScreen() {
  const trackClick = useButtonTracking();

  const handleSaveExpense = async () => {
    // 🔥 Track the button click
    trackClick('save_expense');

    // Your save logic here...
    try {
      await saveExpense(expenseData);
      // Success!
    } catch (error) {
      console.error('Failed to save expense');
    }
  };

  return (
    <View>
      <Button onPress={handleSaveExpense}>
        Save Expense
      </Button>
    </View>
  );
}
```

#### More Button Examples:

```typescript
// Track different buttons
trackClick("add_document");
trackClick("schedule_event");
trackClick("send_message");
trackClick("share_calendar");
trackClick("invite_coparent");
```

---

### 🎯 **4. Feature Usage Tracking**

**When to use:** Track when users use specific features (more detailed than button clicks).

**Why:** Measure feature adoption and engagement.

#### Example: Track Chat Bot Usage

**File:** `app/chat-bot.tsx`

```typescript
import { useFeatureTracking } from '@/hooks/useAnalytics';

export default function ChatBotScreen() {
  const trackFeature = useFeatureTracking();

  const handleSendMessage = async (message: string) => {
    // 🔥 Track feature usage
    trackFeature('chat_message_sent', 'messaging', 1);

    // Send the message...
    await sendChatMessage(message);
  };

  const handleVoiceInput = () => {
    // 🔥 Track voice feature
    trackFeature('voice_input_used', 'messaging');

    // Handle voice input...
  };

  return (
    // Your UI here...
  );
}
```

---

### 🔍 **5. Search Tracking**

**When to use:** Track what users search for.

**Why:** Understand user intent and improve search results.

#### Example: Track Document Search

**File:** `app/documents.tsx`

```typescript
import { useSearchTracking } from '@/hooks/useAnalytics';

export default function DocumentsScreen() {
  const trackSearch = useSearchTracking(1000); // 1 second debounce

  const handleSearch = (query: string) => {
    // 🔥 Track the search (automatically debounced)
    trackSearch(query, 'documents');

    // Perform the search...
    searchDocuments(query);
  };

  return (
    <TextInput
      placeholder="Search documents..."
      onChangeText={handleSearch}
    />
  );
}
```

---

### 📊 **6. Funnel Tracking**

**When to use:** Track multi-step processes (like onboarding, subscription flow).

**Why:** See where users drop off in important flows.

#### Example: Expense Creation Funnel

**File:** `app/add-expense.tsx`

```typescript
import { useFunnelTracking } from '@/hooks/useAnalytics';

export default function AddExpenseScreen() {
  const { trackStep, completeStep } = useFunnelTracking('expense_creation');

  useEffect(() => {
    // 🔥 Track funnel start
    trackStep(1, 'expense_form_opened');
  }, []);

  const handleAmountEntered = () => {
    // 🔥 Track step completion
    completeStep(1, 'expense_form_opened');
    trackStep(2, 'amount_entered');
  };

  const handleCategorySelected = () => {
    completeStep(2, 'amount_entered');
    trackStep(3, 'category_selected');
  };

  const handleSaveExpense = async () => {
    completeStep(3, 'category_selected');

    // 🔥 Track funnel completion
    trackStep(4, 'expense_saved');
    completeStep(4, 'expense_saved');

    // Save the expense...
  };

  return (
    // Your UI...
  );
}
```

---

### ⏱️ **7. Time Tracking**

**When to use:** Measure how long users spend on important screens.

**Why:** Understand engagement levels.

#### Example: Track Time on Calendar

**File:** `app/(tabs)/calendar.tsx`

```typescript
import { useTimeTracking } from '@/hooks/useAnalytics';

export default function CalendarScreen() {
  // 🔥 Automatically tracks time spent on this screen
  useTimeTracking('calendar_screen');

  // When user leaves, it automatically logs the duration!

  return (
    // Your calendar UI...
  );
}
```

---

### 🎁 **8. Referral Program Tracking**

**When to use:** Track referral actions.

**Why:** Measure referral program success.

#### Example: Track Referral Sharing

**File:** `app/referral-program.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function ReferralProgramScreen() {

  const handleShareReferral = async (method: 'whatsapp' | 'email' | 'sms') => {
    // 🔥 Track the share
    await analyticsService.logShare(
      'referral_link',
      'referral_program',
      method
    );

    // Share the referral link...
    await shareReferralLink(method);
  };

  const handleCopyReferralCode = () => {
    // 🔥 Track copy action
    analyticsService.logButtonClick('copy_referral_code', 'referral_program');

    // Copy to clipboard...
  };

  return (
    // Your UI...
  );
}
```

---

### 📄 **9. Document Management Tracking**

**When to use:** Track document uploads, views, and downloads.

**Why:** Understand document usage patterns.

#### Example: Track Document Actions

**File:** `app/add-document.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function AddDocumentScreen() {

  const handleDocumentUpload = async (documentType: string) => {
    // 🔥 Track document upload start
    await analyticsService.logEvent('document_upload_started', {
      document_type: documentType,
    });

    try {
      await uploadDocument(documentData);

      // 🔥 Track successful upload
      await analyticsService.logEvent('document_uploaded', {
        document_type: documentType,
        file_size: documentData.size,
      });

    } catch (error) {
      // 🔥 Track upload failure
      await analyticsService.logError('document_upload_failed', error.message);
    }
  };

  return (
    // Your UI...
  );
}
```

---

### 💰 **10. Expense Tracking Analytics**

**When to use:** Track expense-related actions.

**Why:** Understand financial feature usage.

#### Example: Track Expense Actions

**File:** `app/add-expense.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function AddExpenseScreen() {

  const handleSaveExpense = async (expense: Expense) => {
    // 🔥 Track expense creation
    await analyticsService.logEvent('expense_created', {
      amount: expense.amount,
      category: expense.category,
      is_recurring: expense.isRecurring,
      split_type: expense.splitType, // e.g., '50-50', 'custom'
    });

    // Save the expense...
  };

  return (
    // Your UI...
  );
}

// In expense-details.tsx
const handleExpenseView = async (expenseId: string) => {
  // 🔥 Track expense view
  await analyticsService.logViewItem(
    expenseId,
    'expense_details',
    'expenses'
  );
};
```

---

### 📅 **11. Calendar & Schedule Tracking**

**When to use:** Track calendar interactions.

**Why:** Measure scheduling feature adoption.

#### Example: Track Schedule Creation

**File:** `app/add-schedule.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function AddScheduleScreen() {

  const handleCreateSchedule = async (schedule: Schedule) => {
    // 🔥 Track schedule creation
    await analyticsService.logEvent('schedule_created', {
      event_type: schedule.type, // e.g., 'pickup', 'dropoff', 'activity'
      duration_hours: schedule.durationHours,
      is_recurring: schedule.isRecurring,
      participants: schedule.participants.length,
    });

    // Save the schedule...
  };

  const handleScheduleReminder = () => {
    // 🔥 Track reminder setting
    analyticsService.logEvent('schedule_reminder_set', {
      reminder_time: '1_hour_before',
    });
  };

  return (
    // Your UI...
  );
}
```

---

### 🎓 **12. Onboarding Tracking**

**When to use:** Track user onboarding flow.

**Why:** Optimize onboarding completion rates.

#### Example: Track Onboarding Steps

**File:** `app/(auth)/onboarding.tsx` (if you have one)

```typescript
import analyticsService from '@/services/analytics';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // 🔥 Track onboarding start
    analyticsService.logOnboardingStart();
  }, []);

  const handleNextStep = async () => {
    const nextStep = step + 1;

    // 🔥 Track each step
    await analyticsService.logOnboardingStep(nextStep, `step_${nextStep}`);

    setStep(nextStep);
  };

  const handleComplete = async () => {
    // 🔥 Track onboarding completion
    await analyticsService.logOnboardingComplete();

    // 🔥 Update user property
    await analyticsService.setUserProperties({
      onboarding_completed: true,
    });

    // Navigate to main app...
  };

  return (
    // Your onboarding UI...
  );
}
```

---

### 🔔 **13. Notification Tracking**

**When to use:** Track notification interactions.

**Why:** Measure notification effectiveness.

#### Example: Track Notification Actions

**File:** `app/notifications.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function NotificationsScreen() {

  const handleNotificationClick = async (notification: Notification) => {
    // 🔥 Track notification interaction
    await analyticsService.logEvent('notification_clicked', {
      notification_type: notification.type,
      notification_category: notification.category,
      time_since_received: calculateTimeSince(notification.receivedAt),
    });

    // Handle notification action...
  };

  const handleNotificationDismiss = (notificationType: string) => {
    // 🔥 Track dismissal
    analyticsService.logEvent('notification_dismissed', {
      notification_type: notificationType,
    });
  };

  return (
    // Your UI...
  );
}
```

---

### ⚙️ **14. Settings & Preferences Tracking**

**When to use:** Track settings changes.

**Why:** Understand user preferences.

#### Example: Track Settings Changes

**File:** `app/profile-setting.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function ProfileSettingsScreen() {

  const handleNotificationToggle = async (enabled: boolean) => {
    // 🔥 Track setting change
    await analyticsService.logEvent('setting_changed', {
      setting_name: 'notifications_enabled',
      setting_value: enabled,
    });

    // Save the setting...
  };

  const handleLanguageChange = async (language: string) => {
    // 🔥 Track language change
    await analyticsService.logEvent('setting_changed', {
      setting_name: 'language',
      setting_value: language,
    });

    // 🔥 Update user property
    await analyticsService.setUserProperties({
      preferred_language: language,
    });
  };

  return (
    // Your UI...
  );
}
```

---

### 🎯 **15. Milestone Tracking**

**When to use:** Track important achievements or milestones.

**Why:** Celebrate user progress and engagement.

#### Example: Track Milestones

**File:** `app/milestones.tsx`

```typescript
import analyticsService from '@/services/analytics';

export default function MilestonesScreen() {

  const handleMilestoneCreated = async (milestone: Milestone) => {
    // 🔥 Track milestone creation
    await analyticsService.logEvent('milestone_created', {
      milestone_type: milestone.type,
      child_age: milestone.childAge,
      has_photo: !!milestone.photo,
    });
  };

  const handleMilestoneShared = async (milestoneId: string, method: string) => {
    // 🔥 Track milestone sharing
    await analyticsService.logShare('milestone', milestoneId, method);
  };

  return (
    // Your UI...
  );
}
```

---

### ❌ **16. Error Tracking**

**When to use:** Track non-fatal errors.

**Why:** Identify and fix issues proactively.

#### Example: Track Errors

```typescript
import analyticsService from "@/services/analytics";

// In any component
const handleApiCall = async () => {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    // 🔥 Track the error
    await analyticsService.logError(
      "api_fetch_failed",
      error.message,
      false, // not fatal
    );

    // Show error to user...
  }
};
```

---

## 📱 Real Examples for Your App

### Complete Example: Add Expense Screen

Here's a **fully implemented** example showing multiple analytics in one screen:

```typescript
// app/add-expense.tsx
import { useState, useEffect } from 'react';
import { View, TextInput, Button } from 'react-native';
import { useButtonTracking, useFunnelTracking, useTimeTracking } from '@/hooks/useAnalytics';
import analyticsService from '@/services/analytics';

export default function AddExpenseScreen() {
  // 🔥 Track time spent on this screen
  useTimeTracking('add_expense_screen');

  // 🔥 Track button clicks
  const trackClick = useButtonTracking();

  // 🔥 Track the expense creation funnel
  const { trackStep, completeStep } = useFunnelTracking('expense_creation');

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    // 🔥 Track funnel start when screen opens
    trackStep(1, 'form_opened');
  }, []);

  const handleAmountChange = (value: string) => {
    setAmount(value);

    if (value.length > 0) {
      // 🔥 Track step completion
      completeStep(1, 'form_opened');
      trackStep(2, 'amount_entered');
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);

    // 🔥 Track category selection
    trackClick('select_category');
    completeStep(2, 'amount_entered');
    trackStep(3, 'category_selected');
  };

  const handleSave = async () => {
    // 🔥 Track save button click
    trackClick('save_expense');

    try {
      // Save the expense
      const expense = await saveExpense({ amount, category });

      // 🔥 Track successful save
      await analyticsService.logEvent('expense_created', {
        amount: parseFloat(amount),
        category: category,
        currency: 'USD',
      });

      // 🔥 Complete the funnel
      completeStep(3, 'category_selected');
      trackStep(4, 'expense_saved');
      completeStep(4, 'expense_saved');

      // Navigate back...

    } catch (error) {
      // 🔥 Track error
      await analyticsService.logError('expense_save_failed', error.message);
    }
  };

  const handleCancel = () => {
    // 🔥 Track cancellation
    trackClick('cancel_expense');

    // 🔥 Track funnel abandonment
    analyticsService.logEvent('funnel_abandoned', {
      funnel_name: 'expense_creation',
      last_step: 'form_opened',
    });

    // Navigate back...
  };

  return (
    <View>
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={handleAmountChange}
        keyboardType="numeric"
      />

      <Button title="Select Category" onPress={() => handleCategorySelect('food')} />

      <Button title="Save" onPress={handleSave} />
      <Button title="Cancel" onPress={handleCancel} />
    </View>
  );
}
```

---

## 🧪 Testing & Debugging

### 1. **Enable Debug Mode**

You're already logging events to console! Check your terminal:

```
Firebase Analytics initialized
Event logged: button_click { button_name: 'save_expense', screen_name: 'add_expense' }
Screen view logged: add_expense
```

### 2. **View Events in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Analytics** → **Events**
4. Wait 24 hours for data to appear (or use DebugView for real-time)

### 3. **Use DebugView for Real-Time Testing**

Enable debug mode on your device:

```bash
# For Android
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME

# For iOS
# Add -FIRDebugEnabled to your scheme's arguments
```

Then go to **Analytics** → **DebugView** in Firebase Console to see events in real-time!

### 4. **Common Issues**

**Events not showing up?**

- ✅ Check if analytics is initialized in `_layout.tsx`
- ✅ Wait 24 hours (events are batched)
- ✅ Use DebugView for real-time testing
- ✅ Check console logs for errors

**User properties not updating?**

- ✅ Make sure you called `setUserId()` after login
- ✅ User properties can take up to 24 hours to appear

---

## 🎓 Best Practices

### ✅ DO:

- Use descriptive event names (`expense_created`, not `ec`)
- Keep event names under 40 characters
- Use snake_case for consistency
- Track important user actions
- Set user properties after login

### ❌ DON'T:

- Track sensitive data (passwords, credit cards)
- Track personally identifiable information without consent
- Create too many custom events (stick to meaningful ones)
- Track every single button click (only important ones)

---

## 📊 What You'll Learn from Analytics

After implementing these, you'll be able to answer:

1. **Which features are most used?**
   - "80% of users use the expense tracker, but only 20% use milestones"

2. **Where do users drop off?**
   - "50% of users abandon expense creation at the category selection step"

3. **How engaged are users?**
   - "Average session duration is 5 minutes"
   - "Users spend most time on the calendar screen"

4. **What drives conversions?**
   - "Users who complete onboarding are 3x more likely to become premium"

5. **What's broken?**
   - "Document upload fails 15% of the time"

---

## 🚀 Next Steps

1. **Start Simple:** Implement login/signup tracking first
2. **Add Button Tracking:** Track 5-10 most important buttons
3. **Track Key Funnels:** Expense creation, schedule creation
4. **Monitor Results:** Check Firebase Console weekly
5. **Iterate:** Add more tracking based on what you learn

---

## 📞 Need Help?

- Check console logs for errors
- Review the `services/analytics.ts` file for available methods
- Look at `hooks/useAnalytics.ts` for available hooks
- Test in DebugView for real-time feedback

---

**Happy Tracking! 🎉**

Remember: The goal is to understand your users better so you can build features they actually want and need!
