import { useColorScheme } from "react-native";
import { Colors, type ColorSchemeName, type ThemeColors } from "@/constants/theme";
import { useAppSelector } from "@/redux/hooks";

/** Resolved scheme: the in-app preference wins over the OS setting. */
export function useColorSchemeName(): ColorSchemeName {
  const system = useColorScheme();
  const pref = useAppSelector((s) => s.ui.colorScheme);
  if (pref === "light" || pref === "dark") return pref;
  return system === "dark" ? "dark" : "light";
}

export function useTheme(): ThemeColors {
  return Colors[useColorSchemeName()];
}
