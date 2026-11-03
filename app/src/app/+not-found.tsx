import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { EmptyState, Screen } from "@/components/ui";
import { routes } from "@/lib/routes";
import { useAppSelector } from "@/redux/hooks";

export default function NotFound() {
  const { t } = useTranslation(["common", "errors"]);
  const signedIn = useAppSelector((s) => s.auth.status === "signedIn");
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(signedIn ? routes.home : routes.login);
  };
  return (
    <Screen title={t("appName")}>
      <EmptyState icon="compass-outline" title={t("errors:routeUnavailable")} actionLabel={t("actions.back")} onAction={leave} />
    </Screen>
  );
}
