import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
// eslint-disable-next-line import/no-named-as-default -- expo-checkbox's default export is intentional
import Checkbox from "expo-checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen, FormField, Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Typography } from "@/constants/theme";
import { useAppDispatch } from "@/redux/hooks";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { setCredentials } from "@/redux/features/auth/authSlice";
import { mapAuthResponse } from "@/redux/features/auth/mapAuthResponse";
import { loginSchema, LoginFormValues } from "@/lib/validation/auth";
import { logger } from "@/lib/logger";

const REMEMBERED_EMAIL_KEY = "remembered_email";

export default function LoginScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Remember Me only ever persists the email, never the password.
  useEffect(() => {
    (async () => {
      const savedEmail = await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setValue("email", savedEmail);
        setRememberMe(true);
      }
    })();
  }, [setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const response = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      dispatch(setCredentials(mapAuthResponse(response)));

      if (rememberMe) {
        await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, values.email.trim().toLowerCase());
      } else {
        await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY);
      }

      router.replace("/(app)/(tabs)");
    } catch (err) {
      logger.error("[Login] failed:", err);
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? "Invalid email or password.";
      setFormError(message);
    }
  };

  return (
    <Screen>
      <Text style={[Typography.display, styles.heading, { color: theme.text }]}>
        Welcome back 👋
      </Text>
      <Text style={[Typography.body, styles.sub, { color: theme.textSecondary }]}>
        Sign in to continue
      </Text>

      <View style={styles.form}>
        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          textContentType="password"
          autoCapitalize="none"
        />

        {formError && <Text style={[styles.formError, { color: theme.danger }]}>{formError}</Text>}

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <Checkbox
              value={rememberMe}
              onValueChange={setRememberMe}
              color={rememberMe ? theme.accent : undefined}
              style={styles.checkbox}
            />
            <Text style={{ color: theme.text, fontSize: 14 }}>Remember me</Text>
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 14 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Button title="Sign In" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />

        <View style={styles.footer}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 14 }}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <Link href="/(app)/(tabs)">
        <Text>home</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: Spacing.xxl, marginBottom: Spacing.xs },
  sub: { marginBottom: Spacing.xxxl },
  form: { gap: Spacing.lg },
  formError: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  checkbox: { width: 18, height: 18 },
  footer: { flexDirection: "row", justifyContent: "center", paddingTop: Spacing.xs },
});
