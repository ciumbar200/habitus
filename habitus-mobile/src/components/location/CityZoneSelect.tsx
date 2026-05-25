import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import {
  es,
  getDefaultZoneForCity,
  getZonesForCity,
  MOON_CITIES,
  type MoonCitySlug,
} from "@habitus/core";
import { liquidGlassTheme } from "../../theme/liquidGlass";

type Props = {
  city: MoonCitySlug | "";
  zone: string;
  onCityChange: (city: MoonCitySlug | "") => void;
  onZoneChange: (zone: string) => void;
  cityOptional?: boolean;
  zoneOptional?: boolean;
  disabled?: boolean;
};

export function CityZoneSelect({
  city,
  zone,
  onCityChange,
  onZoneChange,
  cityOptional = false,
  zoneOptional = false,
  disabled = false,
}: Props) {
  const loc = es.discover;
  const zones = city ? getZonesForCity(city) : [];

  function selectCity(next: MoonCitySlug | "") {
    onCityChange(next);
    if (next) onZoneChange(getDefaultZoneForCity(next));
    else onZoneChange("");
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{loc.location}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {cityOptional && (
          <Chip
            active={city === ""}
            disabled={disabled}
            label={es.editProfile.cityAny}
            onPress={() => selectCity("")}
          />
        )}
        {MOON_CITIES.map((c) => (
          <Chip
            key={c.slug}
            active={city === c.slug}
            disabled={disabled}
            label={c.label}
            onPress={() => selectCity(c.slug)}
          />
        ))}
      </ScrollView>

      {city ? (
        <>
          <Text style={[styles.label, styles.zoneLabel]}>{loc.zone}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
            {zoneOptional && (
              <Chip
                active={!zone}
                disabled={disabled}
                label={loc.zoneAll}
                onPress={() => onZoneChange("")}
              />
            )}
            {zones.map((z) => (
              <Chip
                key={z.slug}
                active={zone === z.slug}
                disabled={disabled}
                label={z.label}
                onPress={() => onZoneChange(z.slug)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

function Chip({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <BlurView intensity={active ? 20 : 0} tint="light" style={StyleSheet.absoluteFill} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: liquidGlassTheme.colors.light.text.primary,
  },
  zoneLabel: { marginTop: 8 },
  row: { flexGrow: 0 },
  chip: {
    marginRight: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  chipActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
  },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    fontSize: 14,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  chipTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: "600",
  },
});
