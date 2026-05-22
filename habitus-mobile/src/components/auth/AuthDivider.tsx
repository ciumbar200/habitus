import { StyleSheet, Text, View } from "react-native";
import { es } from "@habitus/core";
import { colors } from "../../theme/colors";
import { fontStyles } from "../../theme/fonts";

export function AuthDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text} numberOfLines={1}>
        {es.access.orEmail}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
    width: "100%",
  },
  line: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  text: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.warmSlate,
    maxWidth: "46%",
    textAlign: "center",
    ...fontStyles.body,
  },
});
