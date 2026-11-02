import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "@/components/ui";

export default function AttendanceTab() {
  const { t } = useTranslation();
  return (
    <Screen title={t("tabs.attendance")} back={false}>
      <EmptyState icon="finger-print-outline" title={t("states.empty")} />
    </Screen>
  );
}
