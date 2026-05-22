import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { colors } from "../../theme/colors";

type AuthScreenLayoutProps = {
  children: ReactNode;
  showBrandPanel?: boolean;
  compactBrand?: boolean;
};

/**
 * Réplica móvil de AccessPage web:
 * fondo stone + orbes, tarjeta única con panel navy arriba y formulario abajo.
 */
export function AuthScreenLayout({
  children,
  showBrandPanel = true,
  compactBrand = false,
}: AuthScreenLayoutProps) {
  return (
    <View style={styles.root}>
      <View style={styles.orbTeal} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.shell}>
              {showBrandPanel && <AuthBrandPanel compact={compactBrand} />}
              <View style={styles.formSection}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orbTeal: {
    position: "absolute",
    top: "-12%",
    left: "-10%",
    width: "55%",
    height: "38%",
    borderRadius: 9999,
    backgroundColor: "rgba(20, 184, 166, 0.08)",
  },
  orbBlue: {
    position: "absolute",
    bottom: "-12%",
    right: "-10%",
    width: "55%",
    height: "38%",
    borderRadius: 9999,
    backgroundColor: "rgba(190, 198, 224, 0.14)",
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  shell: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceLowest,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 22,
    backgroundColor: colors.surfaceLowest,
  },
});
