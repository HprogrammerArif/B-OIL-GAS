import { useState } from "react";

/**
 * Spinner state for pull-to-refresh that only reflects user-initiated refreshes,
 * so realtime/background refetches do not flash the indicator.
 */
export function usePullToRefresh(...refetchers: (() => unknown)[]) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    void Promise.allSettled(refetchers.map((r) => Promise.resolve(r()))).finally(() => setRefreshing(false));
  };
  return { refreshing, onRefresh };
}
