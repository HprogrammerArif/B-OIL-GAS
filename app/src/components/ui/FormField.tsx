import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TextField, type TextFieldProps } from "./TextField";

interface FormFieldProps<T extends FieldValues> extends Omit<TextFieldProps, "value" | "onChangeText" | "error"> {
  control: Control<T>;
  name: FieldPath<T>;
}

/**
 * react-hook-form Controller bound to TextField. Zod messages are i18n keys
 * (`errors:required`), translated here so schemas stay language-neutral.
 */
export function FormField<T extends FieldValues>({ control, name, ...inputProps }: FormFieldProps<T>) {
  const { t } = useTranslation(["common", "errors", "auth"]);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <TextField
          ref={ref}
          value={typeof value === "string" ? value : value == null ? "" : String(value)}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message ? t(error.message as "errors:required", { defaultValue: error.message }) : undefined}
          {...inputProps}
        />
      )}
    />
  );
}
