import type { HomeVariant } from "../persona-resolver";

/**
 * Variant-specific cards (punch card, inbox summary, trip console, gate queue…).
 * Each card is owned by its module and gated by permission; modules register here as they land.
 */
export function HomeVariantBody(_props: { variant: HomeVariant }) {
  return null;
}
