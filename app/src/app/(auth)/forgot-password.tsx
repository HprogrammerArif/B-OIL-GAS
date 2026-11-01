import { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen, FormField, Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useForgetPasswordMutation } from "@/redux/features/auth/authApi";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/validation/auth";
import { logger } from "@/lib/logger";

type Step = "input" | "success";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
  const [step, setStep] = useState<Step>("input");
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    try {
      const email = values.email.trim().toLowerCase();
      await forgetPassword({ email }).unwrap();
      setSentTo(email);
      setStep("success");
    } catch (err) {
      logger.error("[ForgotPassword] failed:", err);
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  if (step === "success") {
    return (
      <Screen scroll={false}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="mail-outline" size={44} color={theme.accent} />
          </View>
          <Text style={[Typography.h1, { color: theme.text }]}>Check your inbox</Text>
          <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
            We sent a password reset link to{"\n"}
            <Text style={{ color: theme.text, fontWeight: "600" }}>{sentTo}</Text>
          </Text>
          <Button title="Back to Sign In" onPress={() => router.replace("/(auth)/login")} />
          <TouchableOpacity style={styles.resendBtn} onPress={() => setStep("input")}>
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
              Didn&apos;t receive it? Try again
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </TouchableOpacity>

      <Text style={[Typography.h1, styles.heading, { color: theme.text }]}>Forgot Password?</Text>
      <Text style={[styles.sub, { color: theme.textSecondary }]}>
        Enter the email associated with your account and we&apos;ll send a reset link.
      </Text>

      <View style={styles.form}>
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

        {formError && <Text style={[styles.formError, { color: theme.danger }]}>{formError}</Text>}

        <Button title="Send Reset Link" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  heading: { marginBottom: Spacing.md },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: Spacing.xxl },
  form: { gap: Spacing.lg },
  formError: { fontSize: 13, fontWeight: "600" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  resendBtn: { paddingVertical: Spacing.xs },
});
