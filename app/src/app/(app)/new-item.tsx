import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen, FormField, Button } from "@/components/ui";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Spacing } from "@/constants/theme";
import { newItemSchema, NewItemFormValues } from "@/lib/validation/newItem";
import { logger } from "@/lib/logger";

/**
 * New Item — actionable form opened from the Home "New" quick action.
 *
 * This is a template: it validates and "creates" locally (Toast + navigate back) since
 * there's no generic create-endpoint wired up yet. Swap `onSubmit` for a real RTK Query
 * mutation (see src/app/(app)/edit-profile.tsx for the full form + mutation pattern).
 */
export default function NewItemScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm<NewItemFormValues>({
    resolver: zodResolver(newItemSchema),
    defaultValues: { title: "", notes: "" },
  });

  const onSubmit = async (values: NewItemFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: replace with your real create-endpoint, e.g.
      //   await createItem({ title: values.title, notes: values.notes }).unwrap();
      logger.log("[NewItem] Created (local only):", values);
      Toast.show({ type: "success", text1: "Created", text2: values.title });
      reset();
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen padded={false} edges={["bottom"]}>
      <ScreenHeader title="New Item" />
      <View style={styles.form}>
        <FormField
          control={control}
          name="title"
          label="Title"
          placeholder="What do you need to do?"
        />
        <FormField
          control={control}
          name="notes"
          label="Notes"
          placeholder="Add any details (optional)"
          multiline
          numberOfLines={4}
        />
        <Button title="Create" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg, padding: Spacing.xl },
});
