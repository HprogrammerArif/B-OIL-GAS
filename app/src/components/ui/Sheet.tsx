import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Prevent closing by backdrop tap (e.g. while submitting). */
  dismissable?: boolean;
}

/** Bottom sheet for forms, decisions and pickers. */
export function Sheet({ visible, onClose, title, subtitle, children, footer, dismissable = true }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismissable ? onClose : () => undefined} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}>
          <Pressable
            style={styles.flex}
            onPress={dismissable ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel={t("actions.close")}
          />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(220)}
          exiting={SlideOutDown.duration(180)}
          style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}
          accessibilityViewIsModal
        >
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text variant="h2" accessibilityRole="header">
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="bodySmall" color="textSecondary">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {dismissable ? <IconButton icon="close" accessibilityLabel={t("actions.close")} onPress={onClose} /> : null}
            </View>
          ) : null}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled" bounces={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
      {/* Modals render above the root toast host; this one takes over while the sheet is open. */}
      <Toast topOffset={56} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: Spacing.sm },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  content: { flexGrow: 0, flexShrink: 1 },
  contentInner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
});
