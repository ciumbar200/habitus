import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createListing,
  DEFAULT_FLOOR_PROPERTY_TYPE,
  es,
  fetchCategories,
  fetchListingForEdit,
  FLOOR_PROPERTY_TYPES,
  listingCopyForRole,
  slugify,
  updateListing,
  type ListingFormInput,
  type ListingStatus,
} from "@habitus/core";
import type { SpacesStackParamList } from "../../navigation/SpacesStack";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<SpacesStackParamList, "ListingEditor">;

const emptyForm = (): ListingFormInput => ({
  name: "",
  slug: "",
  location: "",
  city: "Barcelona",
  priceMonthly: 800,
  currency: "EUR",
  roomType: "Habitación",
  description: "",
  coverImageUrl: "",
  categoryId: null,
  availableFrom: null,
  status: "draft",
  visibility: "public",
  hostProfileId: null,
  agencyClientName: null,
  listingConditions: "",
});

export function ListingEditorScreen({ navigation, route }: Props) {
  const listingId = route.params?.listingId;
  const isEdit = Boolean(listingId);
  const { user, profile } = useAuth();
  const role = profile?.accountRole;
  const isHostPublisher = role === "anfitrion";
  const isFloorPublisher = role === "propietario" || role === "agencia";
  const copy = listingCopyForRole(role);
  const [form, setForm] = useState<ListingFormInput>(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        if (!isEdit && isHostPublisher) {
          const habitacion = cats.find((c) => c.slug === "habitacion");
          if (habitacion) {
            setForm((f) =>
              f.categoryId ? f : { ...f, categoryId: habitacion.id, visibility: "public" },
            );
          }
        }
        if (!isEdit && isFloorPublisher) {
          const pisoGrupo = cats.find((c) => c.slug === "piso-grupo");
          if (pisoGrupo) {
            setForm((f) =>
              f.categoryId
                ? f
                : {
                    ...f,
                    categoryId: pisoGrupo.id,
                    roomType: f.roomType || DEFAULT_FLOOR_PROPERTY_TYPE,
                  },
            );
          }
        }
      })
      .catch(() => {});
  }, [isEdit, isHostPublisher, isFloorPublisher]);

  useEffect(() => {
    if (!isEdit || !user?.id || !listingId) return;
    fetchListingForEdit(user.id, listingId)
      .then((l) => {
        if (!l) {
          setError(es.property.notFound);
          return;
        }
        setForm({
          name: l.name,
          slug: l.slug,
          location: l.location,
          city: l.city,
          priceMonthly: l.priceMonthly,
          currency: l.currency,
          roomType: l.roomType ?? "",
          description: l.description ?? "",
          coverImageUrl: l.coverImageUrl ?? "",
          categoryId: l.categoryId,
          availableFrom: l.availableFrom,
          status: l.status,
          visibility: l.visibility ?? "public",
          hostProfileId: l.hostProfileId,
          agencyClientName: l.agencyClientName,
          listingConditions: l.listingConditions ?? "",
        });
        setSlugManual(true);
      })
      .finally(() => setLoading(false));
  }, [isEdit, user?.id, listingId]);

  function set<K extends keyof ListingFormInput>(key: K, value: ListingFormInput[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !slugManual) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function save(status: ListingStatus) {
    if (!user?.id || !role) return;
    const name = form.name.trim();
    let slug = form.slug.trim();
    if (!name) {
      setError(copy.nameSlugRequired);
      return;
    }
    if (!slug) slug = slugify(name);
    if (status === "published" && (!form.location.trim() || !form.city.trim())) {
      setError("Indica la dirección y la ciudad antes de publicar.");
      return;
    }
    setBusy(true);
    setError(null);
    let payload = { ...form, name, slug, status };
    if (isHostPublisher) {
      payload = { ...payload, visibility: "public", hostProfileId: null };
    }
    if (isFloorPublisher) {
      payload = {
        ...payload,
        hostProfileId: null,
        roomType: payload.roomType || DEFAULT_FLOOR_PROPERTY_TYPE,
      };
    }
    if (isEdit && listingId) {
      const { error: err } = await updateListing(user.id, listingId, payload, role);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
    } else {
      const { error: err } = await createListing(user.id, payload, role);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
    }
    navigation.navigate("SpacesHome");
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1a3d2e" />
      </View>
    );
  }

  const f = es.panel.form;

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Field label={f.name}>
        <TextInput style={styles.input} value={form.name} onChangeText={(t) => set("name", t)} />
      </Field>
      <Field label={f.slug}>
        <TextInput
          style={styles.input}
          value={form.slug}
          onChangeText={(t) => {
            setSlugManual(true);
            set("slug", t);
          }}
          autoCapitalize="none"
        />
      </Field>
      <Field label={f.location}>
        <TextInput
          style={styles.input}
          value={form.location}
          onChangeText={(t) => set("location", t)}
        />
      </Field>
      <Field label={f.city}>
        <TextInput style={styles.input} value={form.city} onChangeText={(t) => set("city", t)} />
      </Field>
      <Field label={f.price}>
        <TextInput
          style={styles.input}
          value={String(form.priceMonthly)}
          keyboardType="numeric"
          onChangeText={(t) => set("priceMonthly", Number(t) || 0)}
        />
      </Field>
      {isHostPublisher && (
        <Field label={f.roomType}>
          <TextInput
            style={styles.input}
            value={form.roomType}
            onChangeText={(t) => set("roomType", t)}
            placeholder="Ej. individual, doble, con baño…"
          />
        </Field>
      )}
      {isFloorPublisher && (
        <Field label={f.propertyType}>
          <View style={styles.pickerRow}>
            {FLOOR_PROPERTY_TYPES.map((t) => {
              const selected = (form.roomType || DEFAULT_FLOOR_PROPERTY_TYPE) === t.value;
              return (
                <Pressable
                  key={t.value}
                  style={[styles.pickerChip, selected && styles.pickerChipSelected]}
                  onPress={() => set("roomType", t.value)}
                >
                  <Text style={[styles.pickerChipText, selected && styles.pickerChipTextSelected]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      )}
      <Field label={f.description}>
        <TextInput
          style={[styles.input, styles.area]}
          value={form.description}
          onChangeText={(t) => set("description", t)}
          multiline
        />
      </Field>
      <Field label={f.conditions}>
        <TextInput
          style={[styles.input, styles.area]}
          value={form.listingConditions}
          onChangeText={(t) => set("listingConditions", t)}
          placeholder={f.conditionsPlaceholder}
          multiline
        />
      </Field>
      <Field label="URL imagen portada">
        <TextInput
          style={styles.input}
          value={form.coverImageUrl}
          onChangeText={(t) => set("coverImageUrl", t)}
          autoCapitalize="none"
        />
      </Field>
      {role === "agencia" && (
        <Field label="Cliente agencia">
          <TextInput
            style={styles.input}
            value={form.agencyClientName ?? ""}
            onChangeText={(t) => set("agencyClientName", t || null)}
          />
        </Field>
      )}
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          disabled={busy}
          onPress={() => save("draft")}
        >
          <Text style={styles.btnTextSec}>{es.panel.listingStatus.draft}</Text>
        </Pressable>
        <Pressable style={styles.btn} disabled={busy} onPress={() => save("published")}>
          <Text style={styles.btnText}>{busy ? es.common.pleaseWait : es.common.publish}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center" },
  field: { marginBottom: 14 },
  label: { fontWeight: "600", marginBottom: 6, color: "#1a3d2e" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    padding: 12,
  },
  area: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: {
    flex: 1,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#1a3d2e" },
  btnText: { color: "#fff", fontWeight: "600" },
  btnTextSec: { color: "#1a3d2e", fontWeight: "600" },
  error: { color: "#b91c1c", marginBottom: 12 },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickerChip: {
    borderWidth: 1,
    borderColor: "#e2ddd4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerChipSelected: { borderColor: "#1a3d2e", backgroundColor: "#1a3d2e14" },
  pickerChipText: { color: "#5c6b63" },
  pickerChipTextSelected: { color: "#1a3d2e", fontWeight: "600" },
});
