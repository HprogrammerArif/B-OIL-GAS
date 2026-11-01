import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { useTranslation } from "react-i18next";
import { FontFamily, MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/useLanguage";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
  /** Rendered after the label, e.g. "(optional)". */
  labelSuffix?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, icon, labelSuffix, secureTextEntry, editable = true, onFocus, onBlur, multiline, ...rest },
  ref,
) {
  const theme = useTheme();
  const lang = useLanguage();
  const { t } = useTranslation("auth");
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.accent : theme.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="caption" color="textSecondary" style={styles.label}>
        {labelSuffix ? `${label} ${labelSuffix}` : label}
      </Text>
      <View
        style={[
          styles.inputRow,
          multiline && styles.multilineRow,
          { borderColor, backgroundColor: editable ? theme.surface : theme.surfaceSecondary },
        ]}
      >
        {icon ? <Icon name={icon} size={18} color={focused ? "accent" : "textTertiary"} /> : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.multiline,
            { color: editable ? theme.text : theme.textTertiary, fontFamily: FontFamily[lang].regular },
          ]}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={secureTextEntry && !visible}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label}
          accessibilityHint={error ?? helperText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={visible ? t("hidePassword") : t("showPassword")}
            style={styles.eye}
          >
            <Icon name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="textTertiary" />
          </Pressable>
        ) : null}
      </View>
      {error || helperText ? (
        <Text variant="caption" color={error ? "danger" : "textTertiary"} style={styles.helper} accessibilityLiveRegion="polite">
          {error || helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: { marginBottom: Spacing.xs + 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: MinTouchTarget + 6,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  multilineRow: { alignItems: "flex-start", paddingVertical: Spacing.sm },
  input: { flex: 1, fontSize: 15, paddingVertical: Spacing.sm },
  multiline: { minHeight: 96 },
  eye: { padding: Spacing.xs },
  helper: { marginTop: Spacing.xs },
});
