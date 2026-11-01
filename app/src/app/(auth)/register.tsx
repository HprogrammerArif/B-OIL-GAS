import { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
// eslint-disable-next-line import/no-named-as-default -- expo-checkbox's default export is intentional
import Checkbox from "expo-checkbox";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen, FormField, Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Typography } from "@/constants/theme";
import { useAppDispatch } from "@/redux/hooks";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { setCredentials } from "@/redux/features/auth/authSlice";
import { mapAuthResponse } from "@/redux/features/auth/mapAuthResponse";
import { PASSWORD_RULES, registerSchema, RegisterFormValues } from "@/lib/validation/auth";
import { logger } from "@/lib/logger";

function PasswordRequirements({ password }: { password: string }) {
  const theme = useTheme();
  if (!password) return null;

  return (
    <View style={styles.pwdRules}>
      {PASSWORD_RULES.map((rule, i) => {
        const ok = rule.test(password);
        return (
          <View key={i} style={styles.pwdRow}>
            <Text
              style={{ fontSize: 13, width: 14, color: ok ? theme.success : theme.textTertiary }}
            >
              {ok ? "✓" : "○"}
            </Text>
            <Text style={{ fontSize: 12, color: ok ? theme.success : theme.textTertiary }}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function RegisterScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: "password" });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      // Field names here follow this project's REST convention (snake_case) —
      // adjust to match your backend's actual /auth/register/ contract.
      const response = await register({
        full_name: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      dispatch(setCredentials(mapAuthResponse(response)));
      router.replace("/(app)/(tabs)");
    } catch (err) {
      logger.error("[Register] failed:", err);
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Registration failed. Please try again.";
      setFormError(message);
    }
  };

  return (
    <Screen>
      <Text style={[Typography.display, styles.heading, { color: theme.text }]}>
        Create Account
      </Text>
      <Text style={[Typography.body, styles.sub, { color: theme.textSecondary }]}>
        Join us — it only takes a minute
      </Text>

      <View style={styles.form}>
        <FormField
          control={control}
          name="fullName"
          label="Full Name"
          placeholder="John Doe"
          autoCapitalize="words"
          textContentType="name"
        />

        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
        />

        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="Create a strong password"
          secureTextEntry
          textContentType="newPassword"
        />
        <PasswordRequirements password={password ?? ""} />

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Repeat your password"
          secureTextEntry
          textContentType="newPassword"
        />

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field: { value, onChange } }) => (
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => onChange(!value)}
              activeOpacity={0.8}
            >
              <Checkbox
                value={value}
                onValueChange={onChange}
                color={value ? theme.accent : undefined}
                style={styles.checkbox}
              />
              <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 20 }}>
                I agree to the{" "}
                <Text style={{ color: theme.accent, fontWeight: "600" }}>Terms of Service</Text>
                {" & "}
                <Text style={{ color: theme.accent, fontWeight: "600" }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
          )}
        />
        {errors.acceptTerms && (
          <Text style={[styles.formError, { color: theme.danger }]}>
            {errors.acceptTerms.message}
          </Text>
        )}

        <Button title="Create Account" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />

        {formError && <Text style={[styles.formError, { color: theme.danger }]}>{formError}</Text>}

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 14 }}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: Spacing.xl, marginBottom: Spacing.xs },
  sub: { marginBottom: Spacing.xxl },
  form: { gap: Spacing.md },
  formError: { fontSize: 13, fontWeight: "600" },
  pwdRules: { gap: Spacing.xs, paddingVertical: Spacing.xs, paddingHorizontal: 2 },
  pwdRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  checkbox: { width: 18, height: 18, marginTop: 2 },
  footer: { flexDirection: "row", justifyContent: "center", paddingTop: Spacing.xs },
});
