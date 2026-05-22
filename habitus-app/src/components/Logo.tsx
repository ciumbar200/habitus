import {
  BRAND_LOGO_ALT,
  MOON_LOGO_BLACK,
  MOON_LOGO_BLACK_ASPECT,
  MOON_LOGO_ORIGINAL,
  MOON_LOGO_ORIGINAL_ASPECT,
} from "../lib/brandAssets";

type LogoProps = {
  variant?: "light" | "dark";
  className?: string;
  height?: number;
};

export function Logo({ variant = "light", className = "", height = 40 }: LogoProps) {
  const onDark = variant === "dark";
  const aspect = onDark ? MOON_LOGO_ORIGINAL_ASPECT : MOON_LOGO_BLACK_ASPECT;
  const width = Math.round(height * aspect);

  return (
    <img
      src={onDark ? MOON_LOGO_ORIGINAL : MOON_LOGO_BLACK}
      alt={BRAND_LOGO_ALT}
      width={width}
      height={height}
      className={`block shrink-0 ${onDark ? "mix-blend-screen" : ""} ${className}`}
      style={{ width, height }}
    />
  );
}
