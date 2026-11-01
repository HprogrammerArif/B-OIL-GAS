# 📊 Firebase Analytics Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR APP SCREENS                         │
│  (notifications.tsx, add-expense.tsx, etc.)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Uses hooks & service
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   ANALYTICS LAYER                            │
│                                                              │
│  ┌──────────────────┐        ┌─────────────────────┐       │
│  │  HOOKS LAYER     │        │  SERVICE LAYER      │       │
│  │                  │        │                     │       │
│  │  useTimeTracking │───────→│  analyticsService   │       │
│  │  useButtonClick  │        │                     │       │
│  │  useFunnel       │        │  - logEvent()       │       │
│  │  useFeature      │        │  - logScreenView()  │       │
│  │  useSearch       │        │  - setUserId()      │       │
│  └──────────────────┘        │  - logError()       │       │
│                              └─────────────────────┘       │
└────────────────────────────────┬───────────────────────────┘
                                 │
                                 │ Sends events to
                                 ↓
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE ANALYTICS SDK                          │
│         (@react-native-firebase/analytics)                   │
└────────────────────────────────┬───────────────────────────┘
                                 │
                                 │ Uploads to cloud
                                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE CLOUD                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  DebugView   │  │   Events     │  │   Funnels    │     │
│  │ (real-time)  │  │  (24h delay) │  │  (24h delay) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Event Flow Example

### Example: User Creates an Expense

```
USER ACTION                    ANALYTICS CODE                    FIREBASE EVENT
─────────────────────────────────────────────────────────────────────────────

1. Opens screen          →    useTimeTracking()           →    screen_view
                              trackStep(1, 'opened')       →    funnel_event

2. Types title          →    onChangeText handler         →    funnel_event
                              trackStep(2, 'title')

3. Enters amount        →    onChangeText handler         →    funnel_event
                              trackStep(3, 'amount')

4. Selects category     →    trackClick('category')       →    button_click
                              logEvent('category_sel')     →    expense_category_selected
                              trackStep(4, 'category')     →    funnel_event

5. Chooses split        →    trackClick('split')          →    button_click
                              logEvent('split_sel')        →    expense_split_selected
                              trackStep(5, 'split')        →    funnel_event

6. Clicks submit        →    trackClick('submit')         →    button_click
                              logEvent('expense_created')  →    expense_created
                              completeStep(5, 'saved')     →    funnel_event

7. Leaves screen        →    useTimeTracking cleanup      →    time_spent
```

---

## 📱 Screen-by-Screen Breakdown

### Notifications Screen

```
┌─────────────────────────────────────┐
│     Notifications Screen            │
│                                     │
│  [All] [Unread] ← Filter tabs      │
│     ↓                               │
│  Tracks: filter_changed             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📅 Event Notification       │   │
│  │ "Soccer practice..."        │   │
│  └─────────────────────────────┘   │
│     ↓ (on click)                    │
│  Tracks: notification_clicked       │
│                                     │
│  Time tracking: notifications_screen│
└─────────────────────────────────────┘
```

**Events:**

- `screen_view` (automatic)
- `time_spent` (automatic)
- `notification_filter_changed` (manual)
- `notification_clicked` (manual)
- `button_click` (manual)

---

### Add Expense Screen

```
┌─────────────────────────────────────┐
│     Add Expense Screen              │
│                                     │
│  Step 1: Form Opened ✓              │
│  ↓                                  │
│  [Title Input] ← User types         │
│  Step 2: Title Entered ✓            │
│  ↓                                  │
│  [Amount Input] ← User types        │
│  Step 3: Amount Entered ✓           │
│  ↓                                  │
│  [Category Dropdown] ← User selects │
│  Step 4: Category Selected ✓        │
│  ↓                                  │
│  [Split Method] ← User selects      │
│  Step 5: Split Selected ✓           │
│  ↓                                  │
│  [Submit Button] ← User clicks      │
│  Step 6: Submitted ✓                │
│  Step 7: Saved ✓                    │
│                                     │
│  Time tracking: add_expense_screen  │
└─────────────────────────────────────┘
```

**Events:**

- `screen_view` (automatic)
- `time_spent` (automatic)
- `funnel_event` × 7 (manual)
- `expense_created` (manual)
- `expense_category_selected` (manual)
- `expense_split_selected` (manual)
- `expense_image_added` (manual)
- `button_click` × many (manual)
- `expense_validation_failed` (error)
- `expense_form_abandoned` (abandonment)

---

## 🎯 Analytics Hooks Usage

### 1. useTimeTracking

```typescript
// Automatically tracks time from mount to unmount
useTimeTracking("screen_name");

// What it does:
// - Records timestamp on mount
// - Calculates duration on unmount
// - Logs 'time_spent' event with duration_seconds
```

### 2. useButtonTracking

```typescript
const trackClick = useButtonTracking();

// In your handler:
trackClick("button_name");

// What it does:
// - Logs 'button_click' event
// - Includes button_name and screen_name
```

### 3. useFunnelTracking

```typescript
const { trackStep, completeStep } = useFunnelTracking("funnel_name");

// Track step start:
trackStep(1, "step_name");

// Track step completion:
completeStep(1, "step_name");

// What it does:
// - Logs 'funnel_event' with step info
// - Tracks completed status
```

### 4. useFeatureTracking

```typescript
const trackFeature = useFeatureTracking();

trackFeature("feature_name", "category", value);

// What it does:
// - Logs 'feature_used' event
// - Includes feature details
```

### 5. useSearchTracking

```typescript
const trackSearch = useSearchTracking(1000); // 1s debounce

// In TextInput:
onChangeText={(text) => trackSearch(text, 'category')}

// What it does:
// - Debounces search input
// - Logs 'search' event after delay
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│   USER       │
│   ACTION     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  REACT COMPONENT                     │
│                                      │
│  const trackClick = useButtonClick() │
│                                      │
│  <Button onPress={() => {           │
│    trackClick('save');               │
│    saveData();                       │
│  }}>                                 │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  ANALYTICS HOOK                      │
│  (hooks/useAnalytics.ts)             │
│                                      │
│  useButtonTracking() {               │
│    return (name) => {                │
│      analyticsService.logButtonClick │
│    }                                 │
│  }                                   │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  ANALYTICS SERVICE                   │
│  (services/analytics.ts)             │
│                                      │
│  logButtonClick(name, screen) {      │
│    analytics().logEvent(             │
│      'button_click',                 │
│      { button_name, screen_name }    │
│    )                                 │
│  }                                   │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  FIREBASE SDK                        │
│  (@react-native-firebase/analytics)  │
│                                      │
│  - Batches events                    │
│  - Uploads to Firebase               │
│  - Handles offline queue             │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  FIREBASE CLOUD                      │
│                                      │
│  - Processes events                  │
│  - Generates reports                 │
│  - Creates dashboards                │
└──────────────────────────────────────┘
```

---

## 🎨 Event Types Overview

### Automatic Events (No code needed)

```
✅ screen_view        - Every screen navigation
✅ first_open         - First app launch
✅ session_start      - App comes to foreground
✅ user_engagement    - User interacts with app
```

### Manual Events (You implement)

```
🔘 button_click           - Button interactions
📊 funnel_event           - Multi-step flows
🎯 feature_used           - Feature usage
🔍 search                 - Search queries
⏱️  time_spent            - Screen duration
📝 expense_created        - Custom business event
❌ expense_validation_failed - Error tracking
```

---

## 🔄 Funnel Visualization

### Expense Creation Funnel

```
100 users start
    │
    ├─→ Step 1: Form Opened (100 users)
    │   ↓ 15% drop off
    │
    ├─→ Step 2: Title Entered (85 users)
    │   ↓ 10% drop off
    │
    ├─→ Step 3: Amount Entered (75 users)
    │   ↓ 10% drop off
    │
    ├─→ Step 4: Category Selected (65 users)
    │   ↓ 5% drop off
    │
    ├─→ Step 5: Split Selected (60 users)
    │   ↓ 5% drop off
    │
    └─→ Step 6: Submitted (55 users)
        ↓ 0% drop off

        Step 7: Saved (55 users) ✅

Conversion Rate: 55%
```

---

## 📈 Firebase Console Views

### DebugView (Real-time)

```
┌─────────────────────────────────────┐
│  DebugView - Last 30 minutes        │
├─────────────────────────────────────┤
│  📱 Device: Pixel 5                 │
│                                     │
│  Recent Events:                     │
│  • screen_view (2s ago)             │
│    screen_name: add_expense         │
│                                     │
│  • button_click (5s ago)            │
│    button_name: category_food       │
│    screen_name: add_expense         │
│                                     │
│  • funnel_event (5s ago)            │
│    funnel_name: expense_creation    │
│    step_number: 4                   │
│    step_name: category_selected     │
└─────────────────────────────────────┘
```

### Events Dashboard (24h delay)

```
┌─────────────────────────────────────┐
│  Events - Last 7 days               │
├─────────────────────────────────────┤
│  Event Name          Count   Users  │
│  ─────────────────────────────────  │
│  screen_view         1,234   456    │
│  button_click          892   398    │
│  expense_created       234   156    │
│  funnel_event          678   234    │
│  notification_clicked  123    89    │
└─────────────────────────────────────┘
```

---

## 🎯 Best Practices Diagram

```
                    ANALYTICS BEST PRACTICES

┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   TRACK WHAT    │   │   NAME EVENTS   │   │   ADD CONTEXT   │
│    MATTERS      │   │   CLEARLY       │   │   PARAMETERS    │
│                 │   │                 │   │                 │
│ ✅ Key actions  │   │ ✅ snake_case   │   │ ✅ category     │
│ ✅ Conversions  │   │ ✅ descriptive  │   │ ✅ amount       │
│ ✅ Errors       │   │ ✅ consistent   │   │ ✅ user_type    │
│ ❌ Everything   │   │ ❌ vague names  │   │ ❌ PII data     │
└─────────────────┘   └─────────────────┘   └─────────────────┘

┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   USE FUNNELS   │   │   TEST FIRST    │   │   REVIEW DATA   │
│   FOR FLOWS     │   │                 │   │   REGULARLY     │
│                 │   │                 │   │                 │
│ ✅ Onboarding   │   │ ✅ DebugView    │   │ ✅ Weekly       │
│ ✅ Checkout     │   │ ✅ Console logs │   │ ✅ Dashboards   │
│ ✅ Form submit  │   │ ✅ Test events  │   │ ✅ Act on data  │
│ ❌ Single steps │   │ ❌ Ship blind   │   │ ❌ Ignore data  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 🚀 Quick Start Flow

```
1. SETUP (Done!)
   ├─ Initialize analytics in _layout.tsx
   ├─ Enable screen tracking
   └─ Import hooks in components

2. IMPLEMENT
   ├─ Add useTimeTracking() to screens
   ├─ Add trackClick() to buttons
   └─ Add custom events for key actions

3. TEST
   ├─ Check console logs
   ├─ Enable DebugView
   └─ Verify events appear

4. MONITOR
   ├─ Review Firebase Console
   ├─ Analyze funnels
   └─ Optimize based on data

5. ITERATE
   ├─ Add more tracking
   ├─ Refine events
   └─ Improve conversion
```

---

## 📊 Sample Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                  YOUR ANALYTICS DASHBOARD                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 OVERVIEW                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Active Users │  │   Sessions   │  │  Avg Session │      │
│  │    1,234     │  │    2,456     │  │   5.2 min    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  📱 TOP SCREENS                                              │
│  1. Calendar (35%)                                           │
│  2. Expenses (28%)                                           │
│  3. Documents (18%)                                          │
│                                                              │
│  🎯 TOP EVENTS                                               │
│  1. screen_view (1,234)                                      │
│  2. button_click (892)                                       │
│  3. expense_created (234)                                    │
│                                                              │
│  📊 EXPENSE FUNNEL                                           │
│  Form Opened     ████████████████████ 100%                  │
│  Title Entered   ████████████████░░░░  85%                  │
│  Amount Entered  ███████████████░░░░░  75%                  │
│  Category Select ████████████░░░░░░░░  65%                  │
│  Split Selected  ███████████░░░░░░░░░  60%                  │
│  Submitted       ██████████░░░░░░░░░░  55%                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:

- ✅ Clean separation of concerns
- ✅ Easy to use hooks
- ✅ Comprehensive tracking
- ✅ Scalable implementation
- ✅ Actionable insights
