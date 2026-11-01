import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). Set false for screens that manage their own scrolling, e.g. a FlatList. */
  scroll?: boolean;
  /** Pad content horizontally/vertically with the standard screen gutter (default true). */
  padded?: boolean;
  /** Avoid the keyboard by pushing content up (default true, iOS only uses "padding"). */
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
}

/**
 * Screen — standard top-level wrapper: safe area + optional scroll + keyboard avoidance.
 * Use for every route so spacing and background color stay consistent app-wide.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboardAvoiding = true,
  style,
  contentContainerStyle,
  edges,
}: ScreenProps) {
  const theme = useTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>{children}</View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }, style]} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { flexGrow: 1, paddingHorizontal: Spacing.xxl },
});
