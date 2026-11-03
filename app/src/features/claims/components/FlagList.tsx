import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import type { PolicyFlag } from "@/types/domain/claims";

/** Policy flags (doc 03 §17.3): BLOCK stops submission, WARN is shown to approvers. */
export function FlagList({ flags }: { flags: PolicyFlag[] }) {
  const { t } = useTranslation("claims");
  const fmt = useFormat();
  if (!flags.length) return null;
  return (
    <View style={styles.gap}>
      {flags.map((f, i) => {
        const params: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(f.params ?? {})) {
          params[k] = typeof v === "number" && ["cap", "excess", "used"].includes(k) ? fmt.number(v) : typeof v === "number" ? fmt.number(v) : v;
        }
        return (
          <View key={`${f.rule}-${i}`} style={styles.row}>
            <Icon name={f.severity === "BLOCK" ? "close-circle" : "alert-circle"} size={18} color={f.severity === "BLOCK" ? "danger" : "warning"} />
            <Text variant="bodySmall" color={f.severity === "BLOCK" ? "danger" : "textSecondary"} style={styles.flex}>
              {t(`flags.${f.rule}` as "flags.NO_LINES", { ...params, defaultValue: f.message })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  flex: { flex: 1 },
});
