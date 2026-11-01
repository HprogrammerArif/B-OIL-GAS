import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export const Divider = memo(function Divider({ inset = 0, spacing = 0 }: { inset?: number; spacing?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
        marginLeft: inset,
        marginVertical: spacing ? Spacing.sm * spacing : 0,
      }}
    />
  );
});
