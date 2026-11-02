import { memo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { FontFamily, MinTouchTarget, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/useLanguage";
import { Icon } from "./Icon";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID?: string;
}

/** Compact search input for list screens; pair with `useDebouncedValue` before querying. */
export const SearchBar = memo(function SearchBar({ value, onChangeText, placeholder, testID }: SearchBarProps) {
  const theme = useTheme();
  const lang = useLanguage();
  const { t } = useTranslation();
  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceSecondary }]}>
      <Icon name="search" size={18} color="textTertiary" />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={[styles.input, { color: theme.text, fontFamily: FontFamily[lang].regular }]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={10} accessibilityRole="button" accessibilityLabel={t("actions.clear")}>
          <Icon name="close-circle" size={18} color="textTertiary" />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: MinTouchTarget,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: Spacing.xs },
});
