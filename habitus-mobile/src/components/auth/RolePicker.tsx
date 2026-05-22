import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ACCOUNT_ROLES, es } from "@habitus/core";
import type { AccountRoleSlug } from "@habitus/core";
import { colors } from "../../theme/colors";
import { fontStyles } from "../../theme/fonts";

const ICONS: Record<AccountRoleSlug, keyof typeof MaterialIcons.glyphMap> = {
  inquilino: "person-search",
  anfitrion: "home-work",
  propietario: "apartment",
  agencia: "business-center",
};

type Props = {
  value: AccountRoleSlug;
  onChange: (role: AccountRoleSlug) => void;
};

/** Grid 2×2 compacto — sin párrafos largos que alarguen la pantalla. */
export function RolePicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.legend}>
        {es.common.role}
        <Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.grid}>
        {ACCOUNT_ROLES.map((role) => {
          const selected = value === role.slug;
          return (
            <Pressable
              key={role.slug}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onChange(role.slug)}
            >
              <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                <MaterialIcons
                  name={ICONS[role.slug]}
                  size={20}
                  color={selected ? colors.white : colors.tealAccent}
                />
              </View>
              <Text style={styles.roleLabel} numberOfLines={2}>
                {role.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  legend: { fontSize: 14, color: colors.deepNavy, marginBottom: 8, ...fontStyles.label },
  required: { color: colors.error },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceLowest,
  },
  cardSelected: {
    borderColor: colors.tealAccent,
    backgroundColor: "rgba(20, 184, 166, 0.05)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: { backgroundColor: colors.tealAccent },
  roleLabel: { flex: 1, fontSize: 13, color: colors.deepNavy, ...fontStyles.label },
});
