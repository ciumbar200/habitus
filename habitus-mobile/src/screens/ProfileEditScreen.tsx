import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import {
  computeProfileScore,
  deleteOwnAccount,
  es,
  fetchProfileEditData,
  getDefaultZoneForCity,
  imageUrlOrPlaceholder,
  isQuizComplete,
  normalizeImageUrl,
  PROFILE_LIFESTYLE_TAGS,
  questionsForRole,
  roleNeedsCompatQuiz,
  roleShowsLifestyleProfile,
  updateProfile,
  uploadImage,
  type SearchPrefs,
} from "@habitus/core";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { useAuth } from "../context/AuthContext";
import { CityZoneSelect } from "../components/location/CityZoneSelect";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileEdit">;

async function tryPickAndUploadAvatar(userId: string): Promise<{ url: string | null; error: string | null } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require("expo-image-picker") as {
      requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>;
      launchImageLibraryAsync: (opts: {
        mediaTypes: string[];
        quality: number;
      }) => Promise<{ canceled: boolean; assets?: { uri: string; mimeType?: string }[] }>;
    };
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { url: null, error: "Permiso de galería denegado." };
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? "image/jpeg";
    const ext = mime.split("/")[1] ?? "jpg";
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    const file = new File([blob], `photo.${ext}`, { type: mime });
    return uploadImage("habitus-avatars", userId, file);
  } catch {
    return null;
  }
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
        <View style={styles.sectionBody}>{children}</View>
      </View>
    </View>
  );
}

export function ProfileEditScreen({ navigation }: Props) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const role = profile?.accountRole;
  const ep = es.editProfile;

  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bioQuote, setBioQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [searchPrefs, setSearchPrefs] = useState<SearchPrefs>({
    city: "",
    zone: null,
    budgetMax: null,
    moveIn: null,
    roomType: null,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.id) return;
    fetchProfileEditData(user.id)
      .then((d) => {
        if (d) {
          setDisplayName(d.displayName);
          setRoleTitle(d.roleTitle ?? "");
          setBioQuote(d.bioQuote ?? "");
          setAvatarUrl(d.avatarUrl);
          setIsDiscoverable(d.isDiscoverable);
          setSearchPrefs(d.searchPrefs);
          setTags(d.tags);
          if (role && roleNeedsCompatQuiz(role)) {
            setQuizComplete(isQuizComplete(d.compatQuiz, role));
          }
        }
        setReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: liquidGlassTheme.animation.duration.normal,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => setReady(true));
  }, [user?.id, role]);

  const previewScore = useMemo(
    () =>
      computeProfileScore(
        {
          displayName,
          roleTitle: roleTitle.trim() || null,
          bioQuote: bioQuote.trim() || null,
          avatarUrl,
          searchPrefs,
          tags,
        },
        role,
      ),
    [displayName, roleTitle, bioQuote, avatarUrl, searchPrefs, tags, role],
  );

  const isInquilino = role === "inquilino";
  const showLifestyle = roleShowsLifestyleProfile(role);
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 8 ? [...prev, tag] : prev,
    );
  }

  async function handlePickAvatar() {
    if (!user?.id) return;
    setUploading(true);
    setUploadError(null);
    const result = await tryPickAndUploadAvatar(user.id);
    setUploading(false);
    if (result === null) return;
    if (result.error || !result.url) {
      setUploadError(result.error ?? es.upload.error);
      return;
    }
    setAvatarUrl(result.url);
  }

  async function save() {
    if (!user?.id) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    const result = await updateProfile(
      user.id,
      {
        displayName: displayName.trim(),
        roleTitle: roleTitle.trim() || null,
        bioQuote: bioQuote.trim() || null,
        avatarUrl,
        isDiscoverable: isInquilino ? isDiscoverable : undefined,
        searchPrefs: isInquilino ? searchPrefs : undefined,
        tags,
      },
      role ?? null,
    );
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    await refreshProfile();
    navigation.goBack();
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={[
            liquidGlassTheme.colors.gradients.primary[0],
            liquidGlassTheme.colors.light.background,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={liquidGlassTheme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
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

      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerContent}>
          <MaterialIcons
            name="edit"
            size={28}
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.headerTitle}>{ep.subtitle}</Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score card */}
          <View style={styles.scoreCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.scoreCardContent}>
              <View style={styles.scoreInfo}>
                <MaterialIcons
                  name="stars"
                  size={24}
                  color={liquidGlassTheme.colors.brand.accent}
                />
                <Text style={styles.scoreLabel}>{ep.previewScore}</Text>
              </View>
              <View style={styles.scoreValueContainer}>
                <Text style={styles.scoreValue}>{previewScore}%</Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          {error ? (
            <View style={styles.messageBanner}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.messageContent}>
                <MaterialIcons name="error-outline" size={20} color={liquidGlassTheme.colors.brand.error} />
                <Text style={styles.error}>{error}</Text>
              </View>
            </View>
          ) : null}
          {success ? (
            <View style={styles.messageBanner}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.messageContent}>
                <MaterialIcons name="check-circle" size={20} color={liquidGlassTheme.colors.brand.success} />
                <Text style={styles.success}>{ep.saved}</Text>
              </View>
            </View>
          ) : null}

          {/* Avatar section */}
          <Section title={ep.avatar}>
            <View style={styles.avatarRow}>
              <Pressable onPress={handlePickAvatar} disabled={uploading}>
                <View style={styles.avatarWrap}>
                  {avatarUrl ? (
                    <Image source={{ uri: imageUrlOrPlaceholder(avatarUrl) }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>
                  )}
                  {uploading ? (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color={liquidGlassTheme.colors.white} />
                    </View>
                  ) : (
                    <View style={styles.avatarEditOverlay}>
                      <MaterialIcons
                        name="camera-alt"
                        size={20}
                        color={liquidGlassTheme.colors.white}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
              <View style={styles.avatarActions}>
                <Text style={styles.hint}>{es.upload.avatarHint}</Text>
                <Pressable style={styles.secondaryBtn} onPress={handlePickAvatar} disabled={uploading}>
                  <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                  <Text style={styles.secondaryBtnText}>
                    {uploading ? es.upload.uploading : "Elegir de la galería"}
                  </Text>
                </Pressable>
                <Text style={styles.fieldLabel}>{es.upload.orPasteUrl}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={avatarUrl ?? ""}
                    onChangeText={(v) => setAvatarUrl(normalizeImageUrl(v))}
                    placeholder="https://…"
                    placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                {avatarUrl ? (
                  <Pressable onPress={() => setAvatarUrl(null)}>
                    <Text style={styles.link}>{es.upload.remove}</Text>
                  </Pressable>
                ) : null}
                {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}
              </View>
            </View>
          </Section>

          {/* Personal data section */}
          <Section title="Datos personales">
            <Text style={styles.fieldLabel}>{ep.displayName}</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
            </View>
            <Text style={styles.fieldLabel}>{ep.professionalRole}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={roleTitle}
                onChangeText={setRoleTitle}
                placeholder="Estudiante, diseñador/a, enfermería…"
                placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
              />
            </View>
            <Text style={styles.hint}>{ep.professionalRoleHint}</Text>
            <Text style={styles.fieldLabel}>{ep.bio}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.area]}
                value={bioQuote}
                onChangeText={setBioQuote}
                multiline
              />
            </View>
            <Text style={styles.hint}>
              {bioQuote.trim().length} {ep.chars} · {ep.bioHint}
            </Text>
          </Section>

          {/* Search preferences for inquilinos */}
          {isInquilino && (
            <Section title={ep.searchSection} hint={ep.searchSectionHint}>
              <CityZoneSelect
                city={searchPrefs.city}
                zone={searchPrefs.zone ?? (searchPrefs.city ? getDefaultZoneForCity(searchPrefs.city) : "")}
                cityOptional
                zoneOptional
                onCityChange={(city) =>
                  setSearchPrefs((p) => ({
                    ...p,
                    city,
                    zone: city ? getDefaultZoneForCity(city) : null,
                  }))
                }
                onZoneChange={(zone) =>
                  setSearchPrefs((p) => ({ ...p, zone: zone || null }))
                }
              />
              <Text style={styles.fieldLabel}>{ep.budgetMax}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={searchPrefs.budgetMax != null ? String(searchPrefs.budgetMax) : ""}
                  onChangeText={(v) =>
                    setSearchPrefs((p) => ({
                      ...p,
                      budgetMax: v ? parseInt(v.replace(/\D/g, ""), 10) || null : null,
                    }))
                  }
                  placeholder={ep.budgetPlaceholder}
                  placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                />
              </View>
              <Text style={styles.fieldLabel}>{ep.moveIn}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={searchPrefs.moveIn ?? ""}
                  onChangeText={(v) => setSearchPrefs((p) => ({ ...p, moveIn: v || null }))}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                />
              </View>
              <Text style={styles.fieldLabel}>{ep.roomType}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={searchPrefs.roomType ?? ""}
                  onChangeText={(v) => setSearchPrefs((p) => ({ ...p, roomType: v || null }))}
                  placeholder={ep.roomTypePlaceholder}
                  placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
                />
              </View>
              <View style={styles.discoverRow}>
                <View style={styles.switchContainer}>
                  <Switch
                    value={isDiscoverable}
                    onValueChange={setIsDiscoverable}
                    trackColor={{
                      false: liquidGlassTheme.colors.light.border.subtle,
                      true: liquidGlassTheme.colors.brand.primary + "60",
                    }}
                    thumbColor={isDiscoverable ? liquidGlassTheme.colors.brand.primary : liquidGlassTheme.colors.light.surfaceVariant}
                  />
                </View>
                <View style={styles.discoverText}>
                  <Text style={styles.fieldLabel}>{ep.visibleInMatches}</Text>
                  <Text style={styles.hint}>{ep.visibleHint}</Text>
                </View>
              </View>
            </Section>
          )}

          {/* Lifestyle tags */}
          {showLifestyle && (
            <Section title={ep.lifestyleTags} hint={ep.lifestyleTagsHint}>
              <View style={styles.chipRow}>
                {PROFILE_LIFESTYLE_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleTag(tag)}
                    >
                      <BlurView intensity={active ? 20 : 0} tint="light" style={StyleSheet.absoluteFill} />
                      {active && (
                        <MaterialIcons
                          name="check"
                          size={14}
                          color={liquidGlassTheme.colors.white}
                          style={styles.chipCheck}
                        />
                      )}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>
          )}

          {/* Compatibility quiz section */}
          {role && roleNeedsCompatQuiz(role) && (
            <Section title={ep.compatSection} hint={ep.compatSectionHint}>
              <View style={styles.quizStatus}>
                <MaterialIcons
                  name={quizComplete ? "check-circle" : "radio-button-unchecked"}
                  size={20}
                  color={quizComplete ? liquidGlassTheme.colors.brand.success : liquidGlassTheme.colors.light.text.tertiary}
                />
                <Text style={styles.fieldLabel}>
                  {quizComplete ? ep.quizComplete : ep.quizIncomplete}
                </Text>
              </View>
              <Text style={styles.hint}>
                {questionsForRole(role).length} preguntas · convivencia, horarios, presupuesto…
              </Text>
              <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate("ProfileQuiz")}>
                <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={styles.secondaryBtnText}>{ep.editQuiz}</Text>
              </Pressable>
            </Section>
          )}

          {/* Save button */}
          <Pressable style={styles.btn} onPress={save} disabled={busy}>
            <LinearGradient
              colors={liquidGlassTheme.colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color={liquidGlassTheme.colors.white} />
                <Text style={styles.btnText}>{es.common.save}</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={busy}>
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.cancelText}>{es.common.cancel}</Text>
          </Pressable>

          {/* Danger zone */}
          <View style={styles.dangerSection}>
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.dangerContent}>
              <MaterialIcons
                name="warning"
                size={24}
                color={liquidGlassTheme.colors.brand.error}
              />
              <View style={styles.dangerText}>
                <Text style={styles.dangerTitle}>{es.account.dangerZone}</Text>
                <Text style={styles.hint}>{es.account.deleteAccountHint}</Text>
              </View>
            </View>
            <Pressable
              style={styles.dangerBtn}
              disabled={deleteBusy}
              onPress={() => {
                Alert.alert(es.account.deleteAccount, es.account.deleteAccountConfirm, [
                  { text: es.common.cancel, style: "cancel" },
                  {
                    text: es.account.deleteAccount,
                    style: "destructive",
                    onPress: async () => {
                      setDeleteBusy(true);
                      const { error: err } = await deleteOwnAccount();
                      setDeleteBusy(false);
                      if (err) {
                        Alert.alert(es.common.errorLoad, err);
                        return;
                      }
                      await signOut();
                      navigation.getParent()?.goBack();
                    },
                  },
                ]);
              }}
            >
              {deleteBusy ? (
                <ActivityIndicator color={liquidGlassTheme.colors.brand.error} />
              ) : (
                <>
                  <MaterialIcons
                    name="delete-forever"
                    size={20}
                    color={liquidGlassTheme.colors.brand.error}
                  />
                  <Text style={styles.dangerBtnText}>{es.account.deleteAccount}</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
    paddingHorizontal: liquidGlassTheme.spacing.lg,
  },
  headerTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  scoreCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.lg,
  },
  scoreCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: liquidGlassTheme.spacing.lg,
  },
  scoreInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
  },
  scoreLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  scoreValueContainer: {
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.md,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
  },
  scoreValue: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  messageBanner: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  messageContent: {
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
  success: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.success,
  },
  section: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    ...liquidGlassTheme.shadows.md,
  },
  sectionContent: {
    padding: liquidGlassTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  sectionHint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.secondary,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  sectionBody: {
    gap: liquidGlassTheme.spacing.md,
  },
  fieldLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  hint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
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
  area: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  avatarRow: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.md,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
  },
  avatarImg: {
    width: 88,
    height: 88,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: liquidGlassTheme.spacing.xs,
    alignItems: "center",
  },
  avatarActions: {
    flex: 1,
    gap: liquidGlassTheme.spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: liquidGlassTheme.spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: liquidGlassTheme.borderRadius.xl,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "80",
    overflow: "hidden",
  },
  chipActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
  },
  chipCheck: {
    position: "absolute",
    left: 8,
  },
  chipText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  chipTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
  },
  discoverRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.md,
    marginTop: liquidGlassTheme.spacing.sm,
  },
  switchContainer: {
    transform: [{ scaleX: 0.8 }],
  },
  discoverText: {
    flex: 1,
  },
  quizStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: liquidGlassTheme.borderRadius.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    marginTop: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  secondaryBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  link: {
    color: liquidGlassTheme.colors.brand.primary,
    textDecorationLine: "underline",
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    marginTop: liquidGlassTheme.spacing.md,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  btnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: liquidGlassTheme.spacing.md,
    marginTop: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  cancelText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  dangerSection: {
    marginTop: liquidGlassTheme.spacing.xl,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.error + "30",
    backgroundColor: liquidGlassTheme.colors.brand.error + "10",
  },
  dangerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.md,
    padding: liquidGlassTheme.spacing.lg,
  },
  dangerText: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.error,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginHorizontal: liquidGlassTheme.spacing.lg,
    marginBottom: liquidGlassTheme.spacing.lg,
    paddingVertical: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.error,
  },
  dangerBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.error,
  },
});
