import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const grotesk = loadGrotesk("normal", { weights: ["400", "500", "700"] }).fontFamily;
export const inter = loadInter("normal", { weights: ["400", "500", "600"] }).fontFamily;

export const colors = {
  bg: "#07070f",
  bgSoft: "#0f0f1f",
  primary: "#8b5cf6",
  primaryGlow: "#a78bfa",
  secondary: "#ec4899",
  accent: "#fbbf24",
  text: "#fafafa",
  muted: "#9ca3af",
  card: "#15152a",
  border: "#26263d",
};
