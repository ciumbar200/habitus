import { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
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
import { liquidGlassTheme } from "../theme/liquidGlass";

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

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

      // Animate in content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: liquidGlassTheme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: liquidGlassTheme.animation.duration.normal,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...liquidGlassTheme.animation.spring.smooth,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e) {
      setError(e instanceof Error ? e.message : es.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id, fadeAnim, slideUpAnim, scaleAnim]);

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
        <ActivityIndicator size="large" color={liquidGlassTheme.colors.brand.primary} />
        <Text style={styles.loadingText}>Cargando propiedad...</Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={styles.centered}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color={liquidGlassTheme.colors.brand.error}
        />
        <Text style={styles.errorText}>{error ?? es.property.notFound}</Text>
      </View>
    );
  }

  const imageUri =
    cover ||
    property.image ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop";

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image with gradient overlay */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUri }} style={styles.hero} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroOverlay}
          />

          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <BlurView intensity={20} tint="light" style={styles.iconBlur}>
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={liquidGlassTheme.colors.light.text.primary}
              />
            </BlurView>
          </Pressable>

          {/* Price badge */}
          <View style={styles.priceBadge}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.priceBadgeText}>
              {formatPrice(property.price, property.currencySymbol)}
            </Text>
          </View>
        </View>

        {/* Content with glass cards */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {/* Title card */}
          <View style={styles.glassCard}>
            {Platform.OS === "ios" && (
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.title}>{property.name}</Text>
              <View style={styles.locationRow}>
                <MaterialIcons
                  name="location-on"
                  size={18}
                  color={liquidGlassTheme.colors.brand.primary}
                />
                <Text style={styles.meta}>{property.location}</Text>
              </View>
            </View>
          </View>

          {/* Availability card */}
          <View style={styles.glassCard}>
            {Platform.OS === "ios" && (
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="event-available"
                  size={20}
                  color={liquidGlassTheme.colors.brand.success}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Disponible desde</Text>
                  <Text style={styles.infoValue}>
                    {formatAvailableDate(property.availableFrom)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Compatibility card */}
          {property.compatibility != null && profile && (
            <View style={styles.glassCard}>
              {Platform.OS === "ios" && (
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.cardContent}>
                <CompatibilityScore
                  score={property.compatibility}
                  result={property.compatibilityResult}
                  label={es.property.profileCompatible}
                  defaultOpen={Boolean(property.compatibilityResult?.dimensions.length)}
                />
              </View>
            </View>
          )}

          {/* About card */}
          <View style={styles.glassCard}>
            {Platform.OS === "ios" && (
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Sobre este espacio</Text>
              <Text style={styles.about}>
                {property.description ?? property.name}
              </Text>
            </View>
          </View>

          {/* Apply message */}
          {applyMsg && (
            <View style={[
              styles.messageCard,
              applyMsg.includes('éxito') || applyMsg.includes('success')
                ? styles.successCard
                : styles.errorCard
            ]}>
              <MaterialIcons
                name={applyMsg.includes('éxito') || applyMsg.includes('success') ? "check-circle" : "info"}
                size={20}
                color={applyMsg.includes('éxito') || applyMsg.includes('success')
                  ? liquidGlassTheme.colors.brand.success
                  : liquidGlassTheme.colors.brand.error}
              />
              <Text style={[
                styles.messageText,
                applyMsg.includes('éxito') || applyMsg.includes('success')
                  ? styles.successText
                  : styles.errorText
              ]}>
                {applyMsg}
              </Text>
            </View>
          )}

          {/* Apply button */}
          <Pressable
            style={[styles.applyButton, applying && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={applying}
          >
            <LinearGradient
              colors={liquidGlassTheme.colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {applying ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name={user ? "send" : "login"}
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.applyButtonText}>
                  {user ? es.property.apply : es.property.signInToApply}
                </Text>
              </>
            )}
          </Pressable>

          {!user && (
            <View style={styles.hintCard}>
              <MaterialIcons
                name="info-outline"
                size={16}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.hint}>{es.access.propertySignupHint}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: liquidGlassTheme.spacing.xxxl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.xl,
    gap: liquidGlassTheme.spacing.md,
  },
  loadingText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginTop: liquidGlassTheme.spacing.md,
  },
  errorText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.brand.error,
    textAlign: "center",
  },
  heroContainer: {
    position: "relative",
    height: 300,
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: liquidGlassTheme.spacing.xl + 8,
    left: liquidGlassTheme.spacing.lg,
  },
  iconBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  priceBadge: {
    position: "absolute",
    bottom: liquidGlassTheme.spacing.lg,
    right: liquidGlassTheme.spacing.lg,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingVertical: liquidGlassTheme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  priceBadgeText: {
    fontSize: liquidGlassTheme.typography.fontSize.title3,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  mainContent: {
    paddingTop: liquidGlassTheme.spacing.lg,
  },
  glassCard: {
    marginHorizontal: liquidGlassTheme.spacing.lg,
    marginBottom: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.sm,
  },
  cardContent: {
    padding: liquidGlassTheme.spacing.lg,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title1,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.sm,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
  },
  meta: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  sectionTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  about: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    lineHeight: liquidGlassTheme.typography.lineHeight.relaxed,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginHorizontal: liquidGlassTheme.spacing.lg,
    marginBottom: liquidGlassTheme.spacing.md,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
  },
  successCard: {
    backgroundColor: liquidGlassTheme.colors.brand.success + "15",
  },
  errorCard: {
    backgroundColor: liquidGlassTheme.colors.brand.error + "10",
  },
  messageText: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
  },
  successText: {
    color: liquidGlassTheme.colors.brand.success,
  },
  messageErrorText: {
    color: liquidGlassTheme.colors.brand.error,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginHorizontal: liquidGlassTheme.spacing.lg,
    marginBottom: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
    letterSpacing: -0.3,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.xs,
    marginHorizontal: liquidGlassTheme.spacing.xl,
    paddingVertical: liquidGlassTheme.spacing.sm,
  },
  hint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
    textAlign: "center",
  },
});
