import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface UseNetworkStatusReturn {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

/**
 * useNetworkStatus
 *
 * Reactively tracks the device's network connectivity status.
 *
 * @example
 * const { isConnected } = useNetworkStatus();
 * if (!isConnected) return <OfflineBanner />;
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [state, setState] = useState<UseNetworkStatusReturn>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: null,
  });

  useEffect(() => {
    const update = (netState: NetInfoState) => {
      setState({
        isConnected: netState.isConnected ?? false,
        isInternetReachable: netState.isInternetReachable,
        connectionType: netState.type,
      });
    };

    // Get initial state
    NetInfo.fetch().then(update);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(update);
    return unsubscribe;
  }, []);

  return state;
}
