# 🧪 Firebase Analytics - Real-Time Testing Guide

## ⚡ See Your Analytics in Real-Time (No 24-Hour Wait!)

### Option 1: Console Logs (Immediate) ✅

**Already working!** Just check your terminal where you ran `npm run android`.

You should see:

```
Firebase Analytics initialized
Event logged: button_click { button_name: 'save', screen_name: 'add_expense' }
Screen view logged: notifications_screen
Time spent logged: { screen_name: 'add_expense', duration_seconds: 45 }
```

**This is instant** - you see events as they happen!

---

### Option 2: Firebase DebugView (Real-Time) ⚡

**See events in Firebase Console in real-time (within seconds)!**

#### Step 1: Find Your Package Name

Open `app.json` and find your package name. It's usually under `android.package` or `ios.bundleIdentifier`.

For example: `com.yourcompany.coparenting`

#### Step 2: Enable Debug Mode

**For Android (your current setup):**

```bash
# Replace YOUR_PACKAGE_NAME with your actual package name
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME

# Example:
# adb shell setprop debug.firebase.analytics.app com.yourcompany.coparenting
```

**To disable later:**

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

#### Step 3: Open DebugView

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Analytics** in the left sidebar
4. Click **DebugView**

#### Step 4: Use Your App

- Open your app on your Android device/emulator
- Navigate between screens
- Click buttons
- Fill out forms

**Watch events appear in DebugView in real-time!** 🎉

---

## 📊 What You'll See in DebugView

### Real-Time Event Stream

```
┌─────────────────────────────────────────────────┐
│  DebugView - Last 30 minutes                    │
├─────────────────────────────────────────────────┤
│  📱 Device: Pixel 5 (Android 13)                │
│  👤 User: user_12345                            │
│                                                 │
│  Recent Events (updating in real-time):         │
│                                                 │
│  • screen_view (2 seconds ago)                  │
│    screen_name: add_expense_screen              │
│    screen_class: add_expense_screen             │
│                                                 │
│  • button_click (5 seconds ago)                 │
│    button_name: category_food                   │
│    screen_name: add_expense_screen              │
│                                                 │
│  • funnel_event (5 seconds ago)                 │
│    funnel_name: expense_creation                │
│    step_number: 4                               │
│    step_name: category_selected                 │
│    completed: false                             │
│                                                 │
│  • expense_category_selected (5 seconds ago)    │
│    category: food                               │
│                                                 │
│  • notification_clicked (30 seconds ago)        │
│    notification_type: expense                   │
│    notification_id: 2                           │
│    is_unread: true                              │
└─────────────────────────────────────────────────┘
```

### Event Details

Click on any event to see:

- **Event name**
- **All parameters** (button_name, screen_name, etc.)
- **User properties**
- **Timestamp**
- **Device info**

---

## 🎯 Testing Workflow

### 1. Enable DebugView (One-Time Setup)

```bash
# Find your package name in app.json
# Then run:
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

### 2. Open DebugView in Browser

- Firebase Console → Analytics → DebugView

### 3. Test Your App

**Test the Notifications Screen:**

1. Open notifications screen
2. Watch for `screen_view` event in DebugView
3. Click "All" filter
4. Watch for `button_click` and `notification_filter_changed` events
5. Click a notification
6. Watch for `notification_clicked` event

**Test the Add Expense Screen:**

1. Open add expense screen
2. Watch for `screen_view` and `funnel_event` (step 1)
3. Type a title
4. Watch for `funnel_event` (step 2)
5. Enter amount
6. Watch for `funnel_event` (step 3)
7. Select category
8. Watch for `button_click`, `expense_category_selected`, and `funnel_event` (step 4)
9. Select split method
10. Watch for events
11. Click submit
12. Watch for `expense_created` and final funnel events

### 4. Verify Events

Check that:

- ✅ Events appear within 1-5 seconds
- ✅ Event names are correct
- ✅ Parameters are included
- ✅ Funnel steps are in order

---

## 📊 Timeline Summary

| Method               | Delay       | What You See               | Best For    |
| -------------------- | ----------- | -------------------------- | ----------- |
| **Console Logs**     | Instant     | Event logs in terminal     | Development |
| **DebugView**        | 1-5 seconds | Events in Firebase Console | Testing     |
| **Events Dashboard** | ~24 hours   | Full analytics data        | Production  |
| **Funnels**          | ~24 hours   | Conversion analysis        | Production  |
| **Reports**          | ~24 hours   | Comprehensive insights     | Production  |

---

## 🔍 Troubleshooting

### DebugView shows "No devices connected"

**Solution 1: Check ADB connection**

```bash
adb devices
```

You should see your device listed.

**Solution 2: Re-enable debug mode**

```bash
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

**Solution 3: Restart your app**
Close and reopen your app after enabling debug mode.

### Events not appearing in DebugView

**Check 1: Is debug mode enabled?**

```bash
# Run this again
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

**Check 2: Is your app running?**
Make sure your app is open and you're interacting with it.

**Check 3: Check console logs**
If events appear in console logs but not DebugView, there might be a Firebase configuration issue.

**Check 4: Correct Firebase project?**
Make sure you're looking at the correct project in Firebase Console.

### Console logs show events but DebugView is empty

**This is normal if:**

- Debug mode is not enabled
- You're looking at the wrong Firebase project
- There's a network issue

**Solution:**
Enable debug mode and restart your app.

---

## 🎓 Best Practices

### During Development:

1. ✅ Use **console logs** for immediate feedback
2. ✅ Check logs after every change
3. ✅ Verify event names and parameters

### During Testing:

1. ✅ Enable **DebugView**
2. ✅ Test all user flows
3. ✅ Verify events appear correctly
4. ✅ Check event parameters are correct

### In Production:

1. ✅ Disable debug mode
2. ✅ Review **Events Dashboard** weekly
3. ✅ Monitor **Funnels** for conversion rates
4. ✅ Use insights to improve your app

---

## 🚀 Quick Commands Reference

### Enable Debug Mode (Android)

```bash
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

### Disable Debug Mode

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

### Check ADB Devices

```bash
adb devices
```

### Restart ADB Server

```bash
adb kill-server
adb start-server
```

---

## 📱 Example: Testing Expense Creation

### What to do:

1. Enable DebugView
2. Open Add Expense screen
3. Fill out the form step by step
4. Click submit

### What you'll see in DebugView (in real-time):

```
1. screen_view (add_expense_screen)
2. funnel_event (step 1: form_opened)
3. funnel_event (step 2: title_entered)
4. funnel_event (step 3: amount_entered)
5. button_click (category_food)
6. expense_category_selected (category: food)
7. funnel_event (step 4: category_selected)
8. button_click (split_50/50)
9. expense_split_selected (split_method: 50/50)
10. funnel_event (step 5: split_method_selected)
11. button_click (submit_expense)
12. expense_created (amount: 45, category: food, ...)
13. funnel_event (step 6: expense_submitted)
14. funnel_event (step 7: expense_saved)
```

**All of this appears within seconds!** ⚡

---

## 🎉 Summary

### You have 3 ways to see analytics:

1. **Console Logs** - Instant (0 seconds)
   - Already working
   - Check your terminal

2. **DebugView** - Real-time (1-5 seconds)
   - Enable with `adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME`
   - View in Firebase Console → Analytics → DebugView

3. **Events Dashboard** - Full data (~24 hours)
   - Firebase Console → Analytics → Events
   - Complete reports and insights

### For testing NOW:

✅ Use console logs (already working)
✅ Enable DebugView for real-time Firebase testing

### For production insights:

✅ Wait 24 hours for full analytics dashboard

---

**You don't have to wait 24 hours to see if your analytics is working!** 🎊

Use console logs and DebugView to see events in real-time right now!
