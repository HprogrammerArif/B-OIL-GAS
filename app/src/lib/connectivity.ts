import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Process-wide connectivity snapshot for non-React code (transport, offline queue).
 * Components use `useNetworkStatus`; both read the same NetInfo source.
 */
let online = true;
const listeners = new Set<(online: boolean) => void>();

function apply(state: NetInfoState) {
  const next = state.isConnected !== false && state.isInternetReachable !== false;
  if (next === online) return;
  online = next;
  listeners.forEach((l) => l(online));
}

let started = false;

export const connectivity = {
  start(): () => void {
    if (started) return () => undefined;
    started = true;
    NetInfo.fetch().then(apply).catch(() => undefined);
    const unsubscribe = NetInfo.addEventListener(apply);
    return () => {
      started = false;
      unsubscribe();
    };
  },
  isOnline: () => online,
  subscribe(listener: (online: boolean) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
