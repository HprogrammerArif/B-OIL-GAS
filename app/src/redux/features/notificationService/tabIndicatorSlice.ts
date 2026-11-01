// redux/features/notificationService/tabIndicatorSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TabName = "message" | "expense" | "schedule" | "home";

interface TabIndicatorState {
  indicators: Record<TabName, boolean>;
}

const initialState: TabIndicatorState = {
  indicators: {
    message: false,
    expense: false,
    schedule: false,
    home: false,
  },
};

const tabIndicatorSlice = createSlice({
  name: "tabIndicator",
  initialState,
  reducers: {
    /** Mark a tab as having a new unseen notification */
    setTabIndicator(state, action: PayloadAction<TabName>) {
      state.indicators[action.payload] = true;
    },
    /** Clear the indicator when the user visits that tab */
    clearTabIndicator(state, action: PayloadAction<TabName>) {
      state.indicators[action.payload] = false;
    },
    /** Clear all indicators at once (e.g. on logout) */
    clearAllIndicators(state) {
      (Object.keys(state.indicators) as TabName[]).forEach((tab) => {
        state.indicators[tab] = false;
      });
    },
  },
});

export const { setTabIndicator, clearTabIndicator, clearAllIndicators } = tabIndicatorSlice.actions;

export default tabIndicatorSlice.reducer;

// Selectors
export const selectTabIndicator = (tab: TabName) => (state: { tabIndicator: TabIndicatorState }) =>
  state.tabIndicator.indicators[tab];
