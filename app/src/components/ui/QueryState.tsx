import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { errorMessageKey, toApiError } from "@/lib/api-error";
import { EmptyState } from "./EmptyState";
import { SkeletonList } from "./Skeleton";

interface QueryStateProps {
  isLoading: boolean;
  error?: unknown;
  /** Only shown when there is no data; stale data stays visible during errors. */
  hasData: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  empty?: { icon?: Parameters<typeof EmptyState>[0]["icon"]; title: string; message?: string; actionLabel?: string; onAction?: () => void };
  skeleton?: ReactNode;
  children: ReactNode;
}

/** Uniform loading → error → empty → content handling for every query-backed view. */
export function QueryState({ isLoading, error, hasData, isEmpty, onRetry, empty, skeleton, children }: QueryStateProps) {
  const { t } = useTranslation(["common", "errors"]);
  if (!hasData && isLoading) return <>{skeleton ?? <SkeletonList card />}</>;
  if (!hasData && error) {
    const apiError = toApiError(error);
    const forbidden = apiError.code === "FORBIDDEN";
    return (
      <EmptyState
        icon={forbidden ? "lock-closed-outline" : apiError.code === "NETWORK" ? "cloud-offline-outline" : "alert-circle-outline"}
        tone={forbidden ? "warning" : "danger"}
        title={t(errorMessageKey(apiError) as "errors:generic")}
        actionLabel={forbidden ? undefined : t("actions.retry")}
        onAction={forbidden ? undefined : onRetry}
      />
    );
  }
  if (isEmpty && empty) return <EmptyState {...empty} />;
  return <>{children}</>;
}
