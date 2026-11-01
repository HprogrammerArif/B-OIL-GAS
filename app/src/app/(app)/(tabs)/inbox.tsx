import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "@/components/ui";

export default function InboxTab() {
  const { t } = useTranslation();
  return (
    <Screen title={t("tabs.inbox")} back={false}>
      <EmptyState icon="file-tray-outline" title={t("states.empty")} />
    </Screen>
  );
}
