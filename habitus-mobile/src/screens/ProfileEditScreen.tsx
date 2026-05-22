import { useEffect, useMemo, useState, type ReactNode } from "react";
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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  computeProfileScore,
  deleteOwnAccount,
  es,
  fetchProfileEditData,
  imageUrlOrPlaceholder,
  isQuizComplete,
  normalizeImageUrl,
  PROFILE_LIFESTYLE_TAGS,
  questionsForRole,
  roleNeedsCompatQuiz,
  roleShowsLifestyleProfile,
  updateProfile,
  uploadImage,
  type SearchCity,
  type SearchPrefs,
} from "@habitus/core";
import type { ProfileStackParamList } from "../navigation/ProfileStack";
import { useAuth } from "../context/AuthContext";

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
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
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

  function setCity(city: SearchCity) {
    setSearchPrefs((p) => ({ ...p, city }));
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
        <ActivityIndicator color="#1a3d2e" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.subtitle}>{ep.subtitle}</Text>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>{ep.previewScore}</Text>
        <Text style={styles.scoreValue}>{previewScore}%</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{ep.saved}</Text> : null}

      <Section title={ep.avatar}>
        <View style={styles.avatarRow}>
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
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={styles.avatarActions}>
            <Text style={styles.hint}>{es.upload.avatarHint}</Text>
            <Pressable style={styles.secondaryBtn} onPress={handlePickAvatar} disabled={uploading}>
              <Text style={styles.secondaryBtnText}>
                {uploading ? es.upload.uploading : "Elegir de la galería"}
              </Text>
            </Pressable>
            <Text style={styles.fieldLabel}>{es.upload.orPasteUrl}</Text>
            <TextInput
              style={styles.input}
              value={avatarUrl ?? ""}
              onChangeText={(v) => setAvatarUrl(normalizeImageUrl(v))}
              placeholder="https://…"
              autoCapitalize="none"
              keyboardType="url"
            />
            {avatarUrl ? (
              <Pressable onPress={() => setAvatarUrl(null)}>
                <Text style={styles.link}>{es.upload.remove}</Text>
              </Pressable>
            ) : null}
            {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}
          </View>
        </View>
      </Section>

      <Section title="Datos personales">
        <Text style={styles.fieldLabel}>{ep.displayName}</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.fieldLabel}>{ep.professionalRole}</Text>
        <TextInput
          style={styles.input}
          value={roleTitle}
          onChangeText={setRoleTitle}
          placeholder="Estudiante, diseñador/a, enfermería…"
        />
        <Text style={styles.hint}>{ep.professionalRoleHint}</Text>
        <Text style={styles.fieldLabel}>{ep.bio}</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={bioQuote}
          onChangeText={setBioQuote}
          multiline
        />
        <Text style={styles.hint}>
          {bioQuote.trim().length} {ep.chars} · {ep.bioHint}
        </Text>
      </Section>

      {isInquilino && (
        <Section title={ep.searchSection} hint={ep.searchSectionHint}>
          <Text style={styles.fieldLabel}>{ep.preferredCity}</Text>
          <View style={styles.chipRow}>
            {(
              [
                ["", ep.cityAny],
                ["barcelona", ep.cityBarcelona],
                ["madrid", ep.cityMadrid],
                ["both", ep.cityBoth],
              ] as const
            ).map(([val, label]) => (
              <Pressable
                key={val || "any"}
                style={[styles.chip, searchPrefs.city === val && styles.chipOnDark]}
                onPress={() => setCity(val)}
              >
                <Text style={[styles.chipText, searchPrefs.city === val && styles.chipTextOn]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>{ep.budgetMax}</Text>
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
          />
          <Text style={styles.fieldLabel}>{ep.moveIn}</Text>
          <TextInput
            style={styles.input}
            value={searchPrefs.moveIn ?? ""}
            onChangeText={(v) => setSearchPrefs((p) => ({ ...p, moveIn: v || null }))}
            placeholder="AAAA-MM-DD"
          />
          <Text style={styles.fieldLabel}>{ep.roomType}</Text>
          <TextInput
            style={styles.input}
            value={searchPrefs.roomType ?? ""}
            onChangeText={(v) => setSearchPrefs((p) => ({ ...p, roomType: v || null }))}
            placeholder={ep.roomTypePlaceholder}
          />
          <View style={styles.discoverRow}>
            <Switch value={isDiscoverable} onValueChange={setIsDiscoverable} />
            <View style={styles.discoverText}>
              <Text style={styles.fieldLabel}>{ep.visibleInMatches}</Text>
              <Text style={styles.hint}>{ep.visibleHint}</Text>
            </View>
          </View>
        </Section>
      )}

      {showLifestyle && (
        <Section title={ep.lifestyleTags} hint={ep.lifestyleTagsHint}>
          <View style={styles.chipRow}>
            {PROFILE_LIFESTYLE_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.chip, active && styles.chipOnTeal]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextOn]}>
                    {active ? `✓ ${tag}` : tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
      )}

      {role && roleNeedsCompatQuiz(role) && (
        <Section title={ep.compatSection} hint={ep.compatSectionHint}>
          <Text style={styles.fieldLabel}>
            {quizComplete ? ep.quizComplete : ep.quizIncomplete}
          </Text>
          <Text style={styles.hint}>
            {questionsForRole(role).length} preguntas · convivencia, horarios, presupuesto…
          </Text>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate("ProfileQuiz")}>
            <Text style={styles.secondaryBtnText}>{ep.editQuiz}</Text>
          </Pressable>
        </Section>
      )}

      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{es.common.save}</Text>
        )}
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={busy}>
        <Text style={styles.cancelText}>{es.common.cancel}</Text>
      </Pressable>

      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>{es.account.dangerZone}</Text>
        <Text style={styles.hint}>{es.account.deleteAccountHint}</Text>
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
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.dangerBtnText}>{es.account.deleteAccount}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  subtitle: { color: "#4a5c52", marginBottom: 12, fontSize: 15 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  scoreLabel: { color: "#666", fontSize: 13 },
  scoreValue: { fontSize: 24, fontWeight: "700", color: "#1a3d2e" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a3d2e" },
  sectionHint: { color: "#666", marginTop: 4, fontSize: 13 },
  sectionBody: { marginTop: 12, gap: 10 },
  fieldLabel: { fontWeight: "600", color: "#1a3d2e", marginBottom: 4 },
  hint: { color: "#666", fontSize: 12 },
  input: {
    backgroundColor: "#f8f6f3",
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  area: { minHeight: 90, textAlignVertical: "top" },
  avatarRow: { flexDirection: "row", gap: 14 },
  avatarWrap: { width: 88, height: 88, borderRadius: 44, overflow: "hidden" },
  avatarImg: { width: 88, height: 88 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    backgroundColor: "#e8f4ef",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 28, fontWeight: "700", color: "#2d6a4f" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,61,46,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: { flex: 1, gap: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  chipOnDark: { backgroundColor: "#1a3d2e", borderColor: "#1a3d2e" },
  chipOnTeal: { backgroundColor: "#2d6a4f", borderColor: "#2d6a4f" },
  chipText: { color: "#1a3d2e", fontSize: 14 },
  chipTextOn: { color: "#fff" },
  discoverRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 8 },
  discoverText: { flex: 1 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryBtnText: { color: "#1a3d2e", fontWeight: "600" },
  link: { color: "#666", textDecorationLine: "underline", fontSize: 13 },
  btn: {
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  cancelBtn: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  cancelText: { color: "#1a3d2e", fontWeight: "600" },
  dangerSection: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  dangerTitle: { fontSize: 17, fontWeight: "700", color: "#b91c1c" },
  dangerBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b91c1c",
    alignItems: "center",
  },
  dangerBtnText: { color: "#b91c1c", fontWeight: "600" },
  error: { color: "#b91c1c", marginBottom: 8 },
  success: { color: "#2d6a4f", marginBottom: 8 },
});
