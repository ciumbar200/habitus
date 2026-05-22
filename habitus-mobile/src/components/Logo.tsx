import { Image, type ImageStyle, type StyleProp } from "react-native";
import {
  BRAND_LOGO_ALT,
  MOON_LOGO_BLACK,
  MOON_LOGO_BLACK_ASPECT,
  MOON_LOGO_ORIGINAL,
  MOON_LOGO_ORIGINAL_ASPECT,
} from "../theme/brandAssets";

type LogoProps = {
  variant?: "light" | "dark";
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function Logo({ variant = "light", height = 40, style }: LogoProps) {
  const onDark = variant === "dark";
  const source = onDark ? MOON_LOGO_ORIGINAL : MOON_LOGO_BLACK;
  const aspect = onDark ? MOON_LOGO_ORIGINAL_ASPECT : MOON_LOGO_BLACK_ASPECT;
  const width = Math.round(height * aspect);

  return (
    <Image
      source={source}
      accessibilityLabel={BRAND_LOGO_ALT}
      resizeMode="contain"
      style={[
        { height, width, ...(onDark ? { mixBlendMode: "screen" as const } : {}) },
        style,
      ]}
    />
  );
}
