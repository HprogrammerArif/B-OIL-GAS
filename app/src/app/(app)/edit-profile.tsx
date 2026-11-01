import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen, FormField, Button } from "@/components/ui";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, updateUser } from "@/redux/features/auth/authSlice";
import { useUpdateUserProfileMutation } from "@/redux/features/profileService/profileApi";
import { editProfileSchema, EditProfileFormValues } from "@/lib/validation/profile";
import { logger } from "@/lib/logger";

/**
 * Edit Profile — reference implementation of the app's form pattern:
 * react-hook-form + zod validation + the shared FormField/Button components,
 * wired to a real RTK Query mutation. Copy this shape for any new form screen.
 */
export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [updateUserProfile, { isLoading }] = useUpdateUserProfileMutation();

  const { control, handleSubmit } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
    },
  });

  const onSubmit = async (values: EditProfileFormValues) => {
    try {
      await updateUserProfile({
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
      }).unwrap();

      dispatch(
        updateUser({ first_name: values.firstName.trim(), last_name: values.lastName.trim() }),
      );
      Toast.show({ type: "success", text1: "Profile updated" });
      router.back();
    } catch (err) {
      logger.error("[EditProfile] failed:", err);
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Couldn't update your profile. Please try again.";
      Toast.show({ type: "error", text1: message });
    }
  };

  return (
    <Screen padded={false} edges={["bottom"]}>
      <ScreenHeader title="Edit Profile" />
      <View style={styles.form}>
        <FormField
          control={control}
          name="firstName"
          label="First Name"
          autoCapitalize="words"
          textContentType="givenName"
        />
        <FormField
          control={control}
          name="lastName"
          label="Last Name"
          autoCapitalize="words"
          textContentType="familyName"
        />
        <Button title="Save Changes" onPress={handleSubmit(onSubmit)} isLoading={isLoading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg, padding: Spacing.xl },
});
