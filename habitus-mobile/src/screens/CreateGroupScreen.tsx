import { useState, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createGroup, es, getDefaultZoneForCity, type MoonCitySlug } from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import { useAuth } from "../context/AuthContext";
import { CityZoneSelect } from "../components/location/CityZoneSelect";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<MainStackParamList, "CreateGroup">;

function Field({ label, icon, children }: { label: string; icon?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        {icon && (
          <MaterialIcons
            name={icon as any}
            size={18}
            color={liquidGlassTheme.colors.brand.primary}
          />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export function CreateGroupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState<MoonCitySlug | "">("barcelona");
  const [zone, setZone] = useState(getDefaultZoneForCity("barcelona"));
  const [targetMembers, setTargetMembers] = useState("3");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useState(new Animated.Value(20))[0];

  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        ...liquidGlassTheme.animation.spring.smooth,
        useNativeDriver: true,
      }),
    ]).start();
  });

  async function handleSubmit() {
    if (!user?.id || !name.trim()) return;
    setBusy(true);
    setError(null);
    const { group, error: err } = await createGroup(user.id, {
      name: name.trim(),
      city: city || undefined,
      zone,
      targetMembers: Number(targetMembers) || 3,
      notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (err || !group) {
      setError(err ?? es.common.errorLoad);
      return;
    }
    navigation.replace("GroupDetail", { slug: group.slug });
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={[
          liquidGlassTheme.colors.gradients.primary[0],
          liquidGlassTheme.colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated orbs */}
      <Animated.View style={[styles.orb1, { opacity: fadeAnim }]}>
        <View style={styles.orbInner1} />
      </Animated.View>

      <Animated.View style={[styles.orb2, { opacity: fadeAnim }]}>
        <View style={styles.orbInner2} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <MaterialIcons
                name="group-add"
                size={32}
                color={liquidGlassTheme.colors.brand.primary}
              />
            </View>
            <Text style={styles.title}>{es.groups.create}</Text>
            <Text style={styles.sub}>{es.groups.subtitle}</Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorBanner}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.errorContent}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={liquidGlassTheme.colors.brand.error}
                />
                <Text style={styles.error}>{error}</Text>
              </View>
            </View>
          )}

          {/* Form card */}
          <View style={styles.formCard}>
            <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.formCardContent}>
              <Field label={es.groups.name} icon="title">
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Mi grupo ideal"
                    placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                  />
                </View>
              </Field>

              <CityZoneSelect city={city} zone={zone} onCityChange={setCity} onZoneChange={setZone} />

              <Field label={es.groups.targetMembers} icon="people">
                <View style={styles.memberSelector}>
                  {(["2", "3", "4", "5", "6"] as const).map((num) => (
                    <Pressable
                      key={num}
                      style={[
                        styles.memberChip,
                        targetMembers === num && styles.memberChipActive,
                      ]}
                      onPress={() => setTargetMembers(num)}
                    >
                      <BlurView
                        intensity={targetMembers === num ? 20 : 0}
                        tint="light"
                        style={StyleSheet.absoluteFill}
                      />
                      <Text
                        style={[
                          styles.memberChipText,
                          targetMembers === num && styles.memberChipTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label={es.groups.notes} icon="description">
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Detalles adicionales sobre el grupo..."
                    placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </Field>
            </View>
          </View>

          {/* Submit button */}
          <Pressable
            style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={busy || !name.trim()}
          >
            <LinearGradient
              colors={
                name.trim()
                  ? liquidGlassTheme.colors.gradients.primary
                  : ["#ccc", "#999"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="group-add"
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.submitBtnText}>{es.groups.create}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  orb1: {
    position: "absolute",
    width: 180,
    height: 180,
    top: -60,
    right: -40,
    borderRadius: 90,
  },
  orbInner1: {
    width: "100%",
    height: "100%",
    borderRadius: 90,
    backgroundColor: liquidGlassTheme.colors.brand.secondary + "20",
  },
  orb2: {
    position: "absolute",
    width: 120,
    height: 120,
    bottom: 120,
    left: -40,
    borderRadius: 60,
  },
  orbInner2: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: liquidGlassTheme.colors.brand.accent + "15",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.xl,
    paddingTop: liquidGlassTheme.spacing.xxl + 8,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: liquidGlassTheme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    textAlign: "center",
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  sub: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
    paddingHorizontal: liquidGlassTheme.spacing.md,
  },
  errorBanner: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.error + "30",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  error: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
  },
  formCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.xl,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    ...liquidGlassTheme.shadows.lg,
  },
  formCardContent: {
    padding: liquidGlassTheme.spacing.lg,
    gap: liquidGlassTheme.spacing.lg,
  },
  field: {
    gap: liquidGlassTheme.spacing.sm,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
  },
  label: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  inputContainer: {
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  input: {
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  textArea: {
    minHeight: 80,
  },
  citySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: liquidGlassTheme.spacing.sm,
  },
  cityChip: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    overflow: "hidden",
  },
  cityChipActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
  },
  cityChipText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  cityChipTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
  },
  memberSelector: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.sm,
  },
  memberChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    overflow: "hidden",
  },
  memberChipActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
  },
  memberChipText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  memberChipTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
});
