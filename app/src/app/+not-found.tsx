import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "@/components/ui";

export default function NotFound() {
  const { t } = useTranslation(["common", "errors"]);
  return (
    <Screen title={t("appName")}>
      <EmptyState
        icon="compass-outline"
        title={t("errors:notFound")}
        actionLabel={t("actions.back")}
        onAction={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
    </Screen>
  );
}
