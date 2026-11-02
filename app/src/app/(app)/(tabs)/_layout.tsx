import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "@/components/ui/Icon";
import { FontFamily } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/useLanguage";
import { useTabBadges } from "@/features/home/useTabBadges";

const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ["home", "home-outline"],
  inbox: ["file-tray-full", "file-tray-full-outline"],
  attendance: ["finger-print", "finger-print-outline"],
  more: ["grid", "grid-outline"],
};

export default function TabsLayout() {
  const theme = useTheme();
  const lang = useLanguage();
  const { t } = useTranslation();
  const badges = useTabBadges();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarLabelStyle: { fontFamily: FontFamily[lang].semibold, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.onAccent, fontSize: 10 },
        tabBarIcon: ({ focused, size }) => {
          const [active, idle] = TAB_ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
          return <Icon name={focused ? active : idle} size={size - 2} tint={focused ? theme.accent : theme.textTertiary} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="inbox" options={{ title: t("tabs.inbox"), tabBarBadge: badges.inbox || undefined }} />
      <Tabs.Screen name="attendance" options={{ title: t("tabs.attendance") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
