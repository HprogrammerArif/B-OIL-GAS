# 🚀 Firebase Analytics - 5 Minute Quick Start

## ✅ Already Done (No Action Needed)

1. ✅ Firebase Analytics is initialized
2. ✅ Screen tracking is automatic
3. ✅ All hooks are ready to use
4. ✅ Analytics service is configured

---

## 🎯 Add Analytics to Any Screen in 3 Steps

### Step 1: Import the hooks

```typescript
import { useTimeTracking, useButtonTracking } from "@/hooks/useAnalytics";
import analyticsService from "@/services/analytics";
```

### Step 2: Add hooks to your component

```typescript
export default function MyScreen() {
  // Track time spent on screen
  useTimeTracking('my_screen_name');

  // Track button clicks
  const trackClick = useButtonTracking();

  return <View>...</View>;
}
```

### Step 3: Track button clicks

```typescript
<Button onPress={() => {
  trackClick('save_button');
  // Your logic here...
}}>
  Save
</Button>
```

**That's it!** 🎉

---

## 📋 Copy-Paste Templates

### Template 1: Simple Screen (Just Time Tracking)

```typescript
import { useTimeTracking } from '@/hooks/useAnalytics';

export default function MyScreen() {
  useTimeTracking('my_screen_name');

  return (
    <View>
      {/* Your UI */}
    </View>
  );
}
```

### Template 2: Screen with Button Tracking

```typescript
import { useTimeTracking, useButtonTracking } from '@/hooks/useAnalytics';

export default function MyScreen() {
  useTimeTracking('my_screen_name');
  const trackClick = useButtonTracking();

  const handleSave = () => {
    trackClick('save_button');
    // Your save logic...
  };

  return (
    <View>
      <Button onPress={handleSave}>Save</Button>
    </View>
  );
}
```

### Template 3: Screen with Custom Events

```typescript
import { useTimeTracking, useButtonTracking } from '@/hooks/useAnalytics';
import analyticsService from '@/services/analytics';

export default function MyScreen() {
  useTimeTracking('my_screen_name');
  const trackClick = useButtonTracking();

  const handleSave = async () => {
    trackClick('save_button');

    try {
      await saveData();

      // Track success
      analyticsService.logEvent('data_saved', {
        data_type: 'document',
        has_image: true,
      });

    } catch (error) {
      // Track error
      analyticsService.logError('save_failed', error.message);
    }
  };

  return (
    <View>
      <Button onPress={handleSave}>Save</Button>
    </View>
  );
}
```

### Template 4: Form with Funnel Tracking

```typescript
import { useTimeTracking, useFunnelTracking } from '@/hooks/useAnalytics';
import analyticsService from '@/services/analytics';
import { useEffect } from 'react';

export default function MyFormScreen() {
  useTimeTracking('my_form_screen');
  const { trackStep, completeStep } = useFunnelTracking('my_form');

  useEffect(() => {
    trackStep(1, 'form_opened');
  }, []);

  const handleFieldChange = (value) => {
    if (value.length === 1) {
      completeStep(1, 'form_opened');
      trackStep(2, 'field_filled');
    }
  };

  const handleSubmit = async () => {
    completeStep(2, 'field_filled');
    trackStep(3, 'submitted');

    await submitForm();

    completeStep(3, 'submitted');

    analyticsService.logEvent('form_completed', {
      form_type: 'my_form',
    });
  };

  return (
    <View>
      <TextInput onChangeText={handleFieldChange} />
      <Button onPress={handleSubmit}>Submit</Button>
    </View>
  );
}
```

---

## 🎯 Common Use Cases

### Track Login

```typescript
// In your login handler
const handleLogin = async (email, password) => {
  try {
    const user = await loginUser(email, password);

    // Track login
    await analyticsService.logLogin("email");
    await analyticsService.setUserId(user.id);
    await analyticsService.setUserProperties({
      user_type: user.isPremium ? "premium" : "free",
    });
  } catch (error) {
    analyticsService.logError("login_failed", error.message);
  }
};
```

### Track Search

```typescript
import { useSearchTracking } from '@/hooks/useAnalytics';

export default function SearchScreen() {
  const trackSearch = useSearchTracking(1000); // 1 second debounce

  return (
    <TextInput
      placeholder="Search..."
      onChangeText={(text) => trackSearch(text, 'documents')}
    />
  );
}
```

### Track Image Upload

```typescript
const handleImageUpload = async () => {
  trackClick("upload_image");

  const result = await ImagePicker.launchImageLibraryAsync();

  if (!result.canceled) {
    analyticsService.logEvent("image_uploaded", {
      source: "gallery",
      has_image: true,
    });
  }
};
```

### Track Settings Change

```typescript
const handleToggleNotifications = async (enabled) => {
  analyticsService.logEvent("setting_changed", {
    setting_name: "notifications_enabled",
    setting_value: enabled,
  });

  // Save the setting...
};
```

---

## 🧪 Test Your Analytics

### 1. Check Console Logs

Run your app and look for:

```
Firebase Analytics initialized
Event logged: button_click { button_name: 'save', screen_name: 'my_screen' }
Screen view logged: my_screen
```

### 2. Enable DebugView (Optional)

**Android:**

```bash
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

Then go to Firebase Console → Analytics → DebugView

### 3. Wait 24 Hours

Check Firebase Console → Analytics → Events for full data

---

## 📊 What You'll See in Firebase

### Events Tab

```
Event Name              Count    Users
─────────────────────────────────────
screen_view             1,234    456
button_click              892    398
expense_created           234    156
```

### DebugView (Real-time)

```
Recent Events:
• screen_view (2s ago)
  screen_name: add_expense

• button_click (5s ago)
  button_name: save
  screen_name: add_expense
```

---

## 🎓 Next Steps

### Immediate:

1. ✅ Add `useTimeTracking()` to your 3 most important screens
2. ✅ Add `trackClick()` to your 5 most important buttons
3. ✅ Test in console logs

### This Week:

4. Add login/signup tracking
5. Add custom events for key features
6. Enable DebugView and test

### This Month:

7. Add funnel tracking for important flows
8. Review Firebase Analytics dashboard
9. Make data-driven improvements

---

## 📚 Documentation

- **Full Guide:** [FIREBASE_ANALYTICS_GUIDE.md](FIREBASE_ANALYTICS_GUIDE.md)
- **Cheat Sheet:** [ANALYTICS_CHEAT_SHEET.md](ANALYTICS_CHEAT_SHEET.md)
- **Architecture:** [ANALYTICS_ARCHITECTURE.md](ANALYTICS_ARCHITECTURE.md)
- **Summary:** [ANALYTICS_IMPLEMENTATION_SUMMARY.md](ANALYTICS_IMPLEMENTATION_SUMMARY.md)

---

## 💡 Pro Tips

1. **Start Simple:** Don't track everything at once
2. **Use Descriptive Names:** `expense_created` not `ec`
3. **Test First:** Check console logs before releasing
4. **Review Weekly:** Look at Firebase Console every week
5. **Act on Data:** Use insights to improve your app

---

## ✅ Checklist

- [ ] Added `useTimeTracking()` to 3 screens
- [ ] Added `trackClick()` to 5 buttons
- [ ] Tested in console logs
- [ ] Enabled DebugView (optional)
- [ ] Checked Firebase Console after 24 hours

---

## 🎉 You're Ready!

You now know how to:

- ✅ Track screen time
- ✅ Track button clicks
- ✅ Track custom events
- ✅ Track funnels
- ✅ Track errors
- ✅ Test your analytics

**Go add analytics to your app!** 🚀

---

## 🆘 Quick Help

**Events not showing in console?**

- Check if analytics is initialized in `_layout.tsx`
- Make sure you imported the hooks correctly

**Events not in Firebase?**

- Wait 24 hours (or use DebugView for real-time)
- Check your Firebase project is configured

**TypeScript errors?**

- Make sure imports are from `@/hooks/useAnalytics`
- Check that `analyticsService` is imported

**Need more help?**

- Review the full guide: [FIREBASE_ANALYTICS_GUIDE.md](FIREBASE_ANALYTICS_GUIDE.md)
- Check the examples in `app/notifications.tsx` and `app/add-expense.tsx`

---

**Happy Tracking! 🎊**
