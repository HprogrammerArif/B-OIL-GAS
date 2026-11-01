import { type ReactNode, useEffect } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import { useTranslation } from "react-i18next";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

interface ScreenProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Show a back button (defaults to true when the stack can go back). */
  back?: boolean;
  headerRight?: ReactNode;
  /** Replace the standard header entirely (tab roots with bespoke heroes). */
  header?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sticky bottom area for primary actions. */
  footer?: ReactNode;
  /** Blocks screenshots/recording while mounted (note-sheets, chat — doc 05 §9). */
  secure?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Screen({
  children,
  title,
  subtitle,
  back,
  headerRight,
  header,
  scroll = true,
  padded = true,
  refreshing = false,
  onRefresh,
  footer,
  secure = false,
  edges = ["top"],
  contentStyle,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const showBack = back ?? router.canGoBack();

  useEffect(() => {
    if (!secure) return;
    const tag = "oneops-secure-screen";
    void ScreenCapture.preventScreenCaptureAsync(tag).catch(() => undefined);
    return () => {
      void ScreenCapture.allowScreenCaptureAsync(tag).catch(() => undefined);
    };
  }, [secure]);

  const headerNode =
    header ??
    (title ? (
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        {showBack ? (
          <IconButton icon="chevron-back" accessibilityLabel={t("actions.back")} onPress={() => router.back()} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <View style={styles.headerTitle}>
          <Text variant="h3" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>{headerRight}</View>
      </View>
    ) : null);

  const inner = <View style={[styles.inner, padded && styles.padded, contentStyle]}>{children}</View>;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{inner}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges} testID={testID}>
      {headerNode}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {body}
        {footer ? (
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: Spacing.md },
  headerTitle: { flex: 1, paddingHorizontal: Spacing.xs },
  headerRight: { flexDirection: "row", alignItems: "center" },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.huge },
  inner: { flex: 1, width: "100%", maxWidth: MaxContentWidth, alignSelf: "center" },
  padded: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
});
