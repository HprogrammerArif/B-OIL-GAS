import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { TextInputProps } from "react-native";
import { TextField } from "./TextField";

interface FormFieldProps<TFormValues extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "style"
> {
  control: Control<TFormValues>;
  name: FieldPath<TFormValues>;
  label: string;
  helperText?: string;
}

/**
 * FormField — react-hook-form Controller wired to the shared TextField.
 * This is the pattern every form in the app should use: define a zod schema,
 * resolve it with `zodResolver`, then render one FormField per field.
 *
 * Example:
 *   const { control, handleSubmit } = useForm({ resolver: zodResolver(schema) });
 *   <FormField control={control} name="email" label="Email" keyboardType="email-address" />
 */
export function FormField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
  ...inputProps
}: FormFieldProps<TFormValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <TextField
          ref={ref}
          label={label}
          value={typeof value === "string" ? value : (value ?? "")}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          helperText={helperText}
          {...inputProps}
        />
      )}
    />
  );
}
