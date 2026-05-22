/** Tipografías : moon (Outfit + Instrument Serif, igual que la web) */
export const fonts = {
  sans: "Outfit_400Regular",
  sansMedium: "Outfit_500Medium",
  sansSemiBold: "Outfit_600SemiBold",
  sansBold: "Outfit_700Bold",
  serif: "InstrumentSerif_400Regular",
} as const;

export const fontStyles = {
  brand: { fontFamily: "Outfit_700Bold" as const },
  title: { fontFamily: "Outfit_700Bold" as const },
  label: { fontFamily: "Outfit_600SemiBold" as const },
  body: { fontFamily: "Outfit_400Regular" as const },
  bodyMedium: { fontFamily: "Outfit_500Medium" as const },
  button: { fontFamily: "Outfit_600SemiBold" as const },
  tagline: { fontFamily: "Outfit_400Regular" as const },
};
