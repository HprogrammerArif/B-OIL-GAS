import { ComponentProps } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/constants/theme";

interface TabBarIconProps {
  focused: boolean;
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconNameFocused: ComponentProps<typeof Ionicons>["name"];
  label: string;
  hasIndicator?: boolean;
}

/**
 * TabBarIcon — custom tab icon with label and optional notification dot.
 * Uses filled icon when focused, outline when not.
 */
export function TabBarIcon({
  focused,
  iconName,
  iconNameFocused,
  label,
  hasIndicator = false,
}: TabBarIconProps) {
  const theme = useTheme();
  const color = focused ? theme.accent : theme.textTertiary;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={focused ? iconNameFocused : iconName} size={24} color={color} />
        {hasIndicator && !focused && (
          <View
            style={[styles.dot, { backgroundColor: theme.danger, borderColor: theme.surface }]}
          />
        )}
      </View>
      <Text style={[styles.label, { color, fontWeight: focused ? "700" : "500" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: 3 },
  iconWrap: { position: "relative" },
  dot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  label: { fontSize: 10 },
});
