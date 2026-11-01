import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { usePresenter } from "@/features/presenter/PresenterProvider";
import { haptic } from "@/lib/haptics";
import { Text } from "./ui/Text";

/**
 * BOGCL monogram. In demo builds a 2-second long-press opens the presenter panel,
 * matching the web prototype's hidden demo control.
 */
export const BrandMark = memo(function BrandMark({ size = 40 }: { size?: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const presenter = usePresenter();
  const mark = (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: theme.accent }]}>
      <View style={[styles.goldBar, { backgroundColor: theme.executiveSolid, height: Math.max(3, size * 0.08) }]} />
      <Text variant="bodyStrong" weight="extrabold" color="onAccent" style={{ fontSize: size * 0.34, lineHeight: size * 0.42 }}>
        B
      </Text>
    </View>
  );
  if (!presenter.enabled) return <View accessibilityLabel={t("appName")}>{mark}</View>;
  return (
    <Pressable
      delayLongPress={2000}
      onLongPress={() => {
        haptic.success();
        presenter.open();
      }}
      accessibilityLabel={t("appName")}
    >
      {mark}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  mark: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  goldBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderBottomLeftRadius: Radius.sm },
});
