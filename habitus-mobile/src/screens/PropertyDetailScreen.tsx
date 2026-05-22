import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createApplication,
  es,
  fetchCompatQuiz,
  fetchPropertyBySlug,
  fetchPropertyImages,
  formatAvailableDate,
  formatPrice,
  getListingUuidBySlug,
} from "@habitus/core";
import type { Property } from "@habitus/core";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { saveReturnTo } from "../lib/returnTo";
import { useAuth } from "../context/AuthContext";
import { isHabitusConfigured } from "../lib/supabase";
import { CompatibilityScore } from "../components/CompatibilityScore";

type Props =
  | NativeStackScreenProps<DiscoverStackParamList, "PropertyDetail">
  | NativeStackScreenProps<RootStackParamList, "PropertyGuest">;

function isGuestRoute(
  route: Props["route"],
): route is NativeStackScreenProps<RootStackParamList, "PropertyGuest">["route"] {
  return route.name === "PropertyGuest";
}

export function PropertyDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  const propertyPath = `/property/${slug}`;

  const load = useCallback(async () => {
    if (!isHabitusConfigured()) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quiz = user?.id ? await fetchCompatQuiz(user.id) : {};
      const [prop, images] = await Promise.all([
        fetchPropertyBySlug(slug, quiz),
        fetchPropertyImages(slug),
      ]);
      if (!prop) {
        setError(es.property.notFound);
        setProperty(null);
        return;
      }
      setProperty(prop);
      setCover(images[0]?.url ?? prop.image ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  function goToLogin(signup = false) {
    void saveReturnTo(propertyPath);
    if (!isGuestRoute(route)) return;
    const rootNav = navigation as NativeStackNavigationProp<RootStackParamList>;
    rootNav.navigate("Login", { signup });
  }

  async function handleApply() {
    if (!user) {
      goToLogin(true);
      return;
    }
    setApplying(true);
    setApplyMsg(null);
    const listingId = await getListingUuidBySlug(slug);
    if (!listingId) {
      setApplyMsg(es.property.notFound);
      setApplying(false);
      return;
    }
    const { error: err } = await createApplication(user.id, listingId);
    setApplying(false);
    setApplyMsg(err ?? es.property.applySuccess);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a3d2e" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? es.property.notFound}</Text>
      </View>
    );
  }

  const imageUri =
    cover ||
    property.image ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Image source={{ uri: imageUri }} style={styles.hero} />
      <Text style={styles.title}>{property.name}</Text>
      <Text style={styles.meta}>{property.location}</Text>
      <Text style={styles.price}>{formatPrice(property.price, property.currencySymbol)}</Text>
      <Text style={styles.avail}>
        {es.property.available}: {formatAvailableDate(property.availableFrom)}
      </Text>
      {property.compatibility != null && profile && (
        <CompatibilityScore
          score={property.compatibility}
          result={property.compatibilityResult}
          label={es.property.profileCompatible}
          defaultOpen={Boolean(property.compatibilityResult?.dimensions.length)}
        />
      )}
      <Text style={styles.about}>{property.description ?? property.name}</Text>
      {applyMsg ? <Text style={styles.applyMsg}>{applyMsg}</Text> : null}
      <Pressable style={styles.btn} onPress={handleApply} disabled={applying}>
        {applying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {user ? es.property.apply : es.property.signInToApply}
          </Text>
        )}
      </Pressable>
      {!user && <Text style={styles.hint}>{es.access.propertySignupHint}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  hero: { width: "100%", height: 220 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a3d2e", padding: 16, paddingBottom: 4 },
  meta: { paddingHorizontal: 16, color: "#666" },
  price: { paddingHorizontal: 16, marginTop: 8, fontSize: 18, fontWeight: "700", color: "#1a3d2e" },
  avail: { paddingHorizontal: 16, marginTop: 4, color: "#4a5c52" },
  compat: { paddingHorizontal: 16, marginTop: 6, color: "#2d6a4f" },
  about: { padding: 16, lineHeight: 22, color: "#333" },
  applyMsg: { paddingHorizontal: 16, color: "#1a3d2e", marginBottom: 8 },
  btn: {
    marginHorizontal: 16,
    backgroundColor: "#1a3d2e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  hint: { textAlign: "center", padding: 12, color: "#666", fontSize: 13 },
  errorText: { color: "#b91c1c", textAlign: "center" },
});
