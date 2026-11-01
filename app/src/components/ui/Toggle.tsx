import { memo } from "react";
import { Switch } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export const Toggle = memo(function Toggle({ value, onChange, accessibilityLabel, disabled }: ToggleProps) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        haptic.tap();
        onChange(v);
      }}
      trackColor={{ false: theme.borderStrong, true: theme.accent }}
      thumbColor={theme.surface}
      ios_backgroundColor={theme.borderStrong}
      accessibilityLabel={accessibilityLabel}
    />
  );
});
