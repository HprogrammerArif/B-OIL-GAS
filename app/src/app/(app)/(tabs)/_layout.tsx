import { ReactNode } from "react";
import { Tabs } from "expo-router";
import {
  AccessibilityState,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { TabBarIcon } from "@/components/TabBarIcon";
import { useTheme } from "@/hooks/use-theme";

interface TabBarButtonProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: ((e: GestureResponderEvent) => void) | null;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  testID?: string;
}

// Default tab buttons show an Android ripple / iOS highlight on press. We only want the
// icon/label color change (handled by TabBarIcon's `focused` state) — no extra press effect.
function TabBarButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}: TabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
      android_ripple={null}
    >
      {children}
    </Pressable>
  );
}

/**
 * Tab Navigator — 4 tabs: Home, Explore, Notifications, Profile
 * All screens inside (app)/(tabs)/ are automatically auth-protected by the parent (app)/_layout.tsx
 */
export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarButton: TabBarButton,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, shadowColor: theme.text },
        ],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              iconName="home-outline"
              iconNameFocused="home"
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              iconName="compass-outline"
              iconNameFocused="compass"
              label="Explore"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              iconName="notifications-outline"
              iconNameFocused="notifications"
              label="Alerts"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              iconName="person-outline"
              iconNameFocused="person"
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: { padding: 0 },
});
