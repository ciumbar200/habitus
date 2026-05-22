import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { es } from "@habitus/core";
import { ACCESS_HERO_IMAGE } from "../../theme/brandAssets";
import { colors } from "../../theme/colors";
import { fontStyles } from "../../theme/fonts";
import { Logo } from "../Logo";

type Props = {
  compact?: boolean;
};

/** Panel izquierdo web (/access): navy + foto + marca. */
export function AuthBrandPanel({ compact = false }: Props) {
  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <ImageBackground
        source={{ uri: ACCESS_HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.image}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(12,10,9,0.15)", "rgba(12,10,9,0.55)", colors.deepNavy]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Logo variant="dark" height={44} />
        {!compact && (
          <Text style={[styles.tagline, fontStyles.tagline]} numberOfLines={3}>
            {es.access.tagline}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 168,
    backgroundColor: colors.deepNavy,
    overflow: "hidden",
  },
  panelCompact: {
    height: 120,
  },
  image: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onPrimaryContainer,
    maxWidth: 300,
  },
});
