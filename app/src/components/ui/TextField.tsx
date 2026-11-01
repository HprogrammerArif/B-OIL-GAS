import { forwardRef, useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  helperText?: string;
}

/**
 * TextField — the single canonical text input. Replaces CustomInput.
 * Pass `secureTextEntry` to get a built-in show/hide toggle for free.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    helperText,
    secureTextEntry,
    editable = true,
    onFocus,
    onBlur,
    multiline,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error ? theme.danger : isFocused ? theme.accent : theme.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            {
              borderColor,
              backgroundColor: editable ? theme.surface : theme.surfaceSecondary,
              color: editable ? theme.text : theme.textTertiary,
              paddingRight: secureTextEntry ? 46 : Spacing.lg,
            },
          ]}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setIsPasswordVisible((v) => !v)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {(error || helperText) && (
        <Text style={[styles.helper, { color: error ? theme.danger : theme.textTertiary }]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: {
    ...Typography.caption,
    marginBottom: Spacing.sm - 2,
  },
  inputRow: { position: "relative" },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 96,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  eyeBtn: {
    position: "absolute",
    right: Spacing.lg,
    top: 16,
  },
  helper: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
