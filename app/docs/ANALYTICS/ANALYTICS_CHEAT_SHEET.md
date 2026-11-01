# 🚀 Firebase Analytics Quick Reference Cheat Sheet

## 📋 Common Imports

```typescript
// For hooks
import {
  useTimeTracking,
  useButtonTracking,
  useFeatureTracking,
  useFunnelTracking,
  useSearchTracking,
} from "@/hooks/useAnalytics";

// For direct service calls
import analyticsService from "@/services/analytics";
```

---

## 🎯 Quick Implementation Patterns

### 1. Track Screen Time (Add to any screen)

```typescript
export default function MyScreen() {
  useTimeTracking('my_screen_name');

  return <View>...</View>;
}
```

### 2. Track Button Clicks

```typescript
export default function MyScreen() {
  const trackClick = useButtonTracking();

  const handleSave = () => {
    trackClick('save_button');
    // Your logic...
  };

  return <Button onPress={handleSave}>Save</Button>;
}
```

### 3. Track Feature Usage

```typescript
const trackFeature = useFeatureTracking();

const handleAction = () => {
  trackFeature("feature_name", "category", 1);
  // Your logic...
};
```

### 4. Track Search

```typescript
const trackSearch = useSearchTracking(1000); // 1 second debounce

<TextInput
  onChangeText={(text) => trackSearch(text, 'category')}
/>
```

### 5. Track Custom Events

```typescript
await analyticsService.logEvent("custom_event_name", {
  param1: "value1",
  param2: 123,
  param3: true,
});
```

### 6. Track User Login

```typescript
// After successful login
await analyticsService.logLogin("email");
await analyticsService.setUserId(user.id);
await analyticsService.setUserProperties({
  user_type: "premium",
  subscription_status: "active",
});
```

### 7. Track Funnel

```typescript
const { trackStep, completeStep } = useFunnelTracking("funnel_name");

useEffect(() => {
  trackStep(1, "step_1_name");
}, []);

const handleNext = () => {
  completeStep(1, "step_1_name");
  trackStep(2, "step_2_name");
};
```

---

## 📊 Event Naming Conventions

### ✅ Good Event Names

- `expense_created`
- `document_uploaded`
- `schedule_shared`
- `notification_clicked`
- `filter_changed`

### ❌ Bad Event Names

- `ec` (too short, unclear)
- `ExpenseCreated` (use snake_case)
- `user-clicked-the-save-button-on-expense-screen` (too long)

---

## 🎨 Common Event Parameters

```typescript
// User actions
{
  screen_name: 'expenses',
  button_name: 'save',
  action_type: 'create',
}

// Content
{
  content_type: 'document',
  content_id: '12345',
  category: 'medical',
}

// Values
{
  amount: 45.50,
  currency: 'USD',
  quantity: 1,
}

// Metadata
{
  is_premium: true,
  has_photo: false,
  duration_seconds: 120,
}
```

---

## 🔥 Pre-built Events (Firebase Standard)

```typescript
// Authentication
analyticsService.logLogin("email");
analyticsService.logSignUp("email");

// Sharing
analyticsService.logShare("content_type", "item_id", "method");

// Onboarding
analyticsService.logOnboardingStart();
analyticsService.logOnboardingStep(2, "profile_setup");
analyticsService.logOnboardingComplete();

// Tutorial
analyticsService.logTutorialBegin();
analyticsService.logTutorialComplete();

// Errors
analyticsService.logError("error_name", "error_message", false);
```

---

## 🎯 Screen-Specific Examples

### Expense Screen

```typescript
// Track expense creation
analyticsService.logEvent("expense_created", {
  amount: 45.0,
  category: "food",
  is_recurring: false,
  split_type: "50-50",
});
```

### Document Screen

```typescript
// Track document upload
analyticsService.logEvent("document_uploaded", {
  document_type: "medical",
  file_size: 1024000,
  has_signature: true,
});
```

### Calendar Screen

```typescript
// Track schedule creation
analyticsService.logEvent("schedule_created", {
  event_type: "pickup",
  duration_hours: 2,
  is_recurring: true,
  participants: 2,
});
```

### Chat Screen

```typescript
// Track message sent
trackFeature("chat_message_sent", "messaging", 1);
```

### Settings Screen

```typescript
// Track setting change
analyticsService.logEvent("setting_changed", {
  setting_name: "notifications_enabled",
  setting_value: true,
});
```

---

## 🧪 Testing Your Analytics

### 1. Check Console Logs

Look for these in your terminal:

```
Firebase Analytics initialized
Event logged: button_click { button_name: 'save', screen_name: 'expenses' }
Screen view logged: expenses
```

### 2. Enable Debug Mode

**Android:**

```bash
adb shell setprop debug.firebase.analytics.app com.yourapp
```

**iOS:**
Add `-FIRDebugEnabled` to scheme arguments

### 3. View in Firebase Console

1. Go to Firebase Console
2. Analytics → DebugView (real-time)
3. Analytics → Events (24-hour delay)

---

## ⚡ Performance Tips

### ✅ DO:

- Use hooks at component level
- Debounce search tracking
- Track important actions only
- Use descriptive names

### ❌ DON'T:

- Track every render
- Track PII (passwords, emails)
- Create 100s of custom events
- Track in tight loops

---

## 🎓 Common Use Cases

### Track Form Completion

```typescript
const { trackStep, completeStep } = useFunnelTracking("form_name");

// Step 1: Form opened
useEffect(() => trackStep(1, "opened"), []);

// Step 2: Field filled
const handleFieldChange = () => {
  completeStep(1, "opened");
  trackStep(2, "field_filled");
};

// Step 3: Submitted
const handleSubmit = () => {
  completeStep(2, "field_filled");
  trackStep(3, "submitted");
  completeStep(3, "submitted");
};
```

### Track User Engagement

```typescript
// Track time on screen
useTimeTracking("screen_name");

// Track interactions
const trackClick = useButtonTracking();

// Track feature discovery
useComponentTracking("premium_feature_modal");
```

### Track Errors

```typescript
try {
  await riskyOperation();
} catch (error) {
  analyticsService.logError(
    "operation_failed",
    error.message,
    false, // not fatal
  );
}
```

---

## 📱 Real Example: Complete Screen

```typescript
import { useTimeTracking, useButtonTracking } from '@/hooks/useAnalytics';
import analyticsService from '@/services/analytics';

export default function ExpenseScreen() {
  // Track screen time
  useTimeTracking('expense_screen');

  // Track button clicks
  const trackClick = useButtonTracking();

  const handleSave = async () => {
    trackClick('save_expense');

    try {
      await saveExpense(data);

      // Track success
      analyticsService.logEvent('expense_created', {
        amount: data.amount,
        category: data.category,
      });

    } catch (error) {
      // Track error
      analyticsService.logError('expense_save_failed', error.message);
    }
  };

  return (
    <View>
      <Button onPress={handleSave}>Save</Button>
    </View>
  );
}
```

---

## 🎯 Priority Implementation Order

1. **✅ Already Done:** Screen tracking (automatic)
2. **High Priority:** Login/Signup tracking
3. **High Priority:** Button clicks on key features
4. **Medium Priority:** Feature usage tracking
5. **Medium Priority:** Funnel tracking for key flows
6. **Low Priority:** Search tracking
7. **Low Priority:** Error tracking

---

## 📞 Quick Debugging

**Events not showing?**

```typescript
// Check if analytics is initialized
console.log("Analytics initialized");

// Check if events are being logged
console.log("Event logged:", eventName, params);

// Wait 24 hours or use DebugView
```

**TypeScript errors?**

```typescript
// Make sure imports are correct
import { useButtonTracking } from "@/hooks/useAnalytics";
import analyticsService from "@/services/analytics";
```

---

## 🎉 You're Ready!

Start with simple tracking and gradually add more as you learn what insights you need!

**Remember:** The goal is to understand your users, not to track everything!
