import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { isMockApi } from "@/lib/env";
import { PresenterPanel } from "./PresenterPanel";

interface PresenterContextValue {
  enabled: boolean;
  open: () => void;
}

const PresenterContext = createContext<PresenterContextValue>({ enabled: false, open: () => undefined });

/** Hosts the hidden presenter panel; inert unless the app runs on the in-app mock API. */
export function PresenterProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => {
    if (isMockApi) setVisible(true);
  }, []);
  const value = useMemo(() => ({ enabled: isMockApi, open }), [open]);
  return (
    <PresenterContext.Provider value={value}>
      {children}
      {isMockApi ? <PresenterPanel visible={visible} onClose={() => setVisible(false)} /> : null}
    </PresenterContext.Provider>
  );
}

export const usePresenter = () => useContext(PresenterContext);
