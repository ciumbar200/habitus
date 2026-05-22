import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { es } from "@habitus/core";
import { colors } from "../../theme/colors";
import { fontStyles } from "../../theme/fonts";

type Props = {
  busy: boolean;
  onGoogle: () => void;
  onFacebook: () => void;
};

export function SocialAuthButtons({ busy, onGoogle, onFacebook }: Props) {
  return (
    <View style={styles.col}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={onGoogle}
        disabled={busy}
      >
        <MaterialCommunityIcons name="google" size={18} color="#4285F4" style={styles.icon} />
        <Text style={styles.btnText} numberOfLines={1}>
          {es.access.continueGoogle}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={onFacebook}
        disabled={busy}
      >
        <MaterialCommunityIcons name="facebook" size={18} color="#1877F2" style={styles.icon} />
        <Text style={styles.btnText} numberOfLines={1}>
          {es.access.continueFacebook}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 8, width: "100%" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: colors.surfaceLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  btnPressed: { backgroundColor: colors.surfaceLow },
  icon: { marginRight: 8 },
  btnText: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.deepNavy,
    ...fontStyles.label,
  },
});
