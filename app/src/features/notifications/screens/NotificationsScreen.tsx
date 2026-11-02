import { useTranslation } from "react-i18next";
import { Screen } from "@/components/ui";
import { NotificationsPane } from "../components/NotificationsPane";

export function NotificationsScreen() {
  const { t } = useTranslation("notifications");
  return (
    <Screen title={t("title")} scroll={false} padded={false}>
      <NotificationsPane />
    </Screen>
  );
}
