import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppLanguage = "en" | "bn";
export type ColorSchemePreference = "system" | "light" | "dark";

export interface UiState {
  /** `null` until the user picks one; the device locale decides meanwhile. */
  language: AppLanguage | null;
  colorScheme: ColorSchemePreference;
  bengaliNumerals: boolean;
  hasSeenPermissionPrimer: boolean;
  /** Chosen landing layout for multi-role users (doc 05 §10). */
  homeVariant: string | null;
}

const initialState: UiState = {
  language: null,
  colorScheme: "system",
  bengaliNumerals: true,
  hasSeenPermissionPrimer: false,
  homeVariant: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    languageChanged(state, action: PayloadAction<AppLanguage>) {
      state.language = action.payload;
    },
    colorSchemeChanged(state, action: PayloadAction<ColorSchemePreference>) {
      state.colorScheme = action.payload;
    },
    bengaliNumeralsToggled(state, action: PayloadAction<boolean>) {
      state.bengaliNumerals = action.payload;
    },
    permissionPrimerSeen(state) {
      state.hasSeenPermissionPrimer = true;
    },
    homeVariantChanged(state, action: PayloadAction<string | null>) {
      state.homeVariant = action.payload;
    },
  },
});

export const { languageChanged, colorSchemeChanged, bengaliNumeralsToggled, permissionPrimerSeen, homeVariantChanged } =
  uiSlice.actions;
export default uiSlice.reducer;
