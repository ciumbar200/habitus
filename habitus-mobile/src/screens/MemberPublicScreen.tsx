import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import {
  accountRoleLabel,
  es,
  fetchCompatQuiz,
  fetchPublicGroupsForProfile,
  fetchListingsByHost,
  fetchListingsByOwner,
  fetchPublicMember,
  roleShowsLifestyleProfile,
  roleShowsTrustProfile,
  startConversationWith,
  type LivingGroup,
  type Property,
  type PublicMember,
} from "@habitus/core";
import type { MainStackParamList } from "../navigation/MainStack";
import type { MainTabParamList } from "../navigation/MainTabs";
import { useAuth } from "../context/AuthContext";
import { CompatibilityScore } from "../components/CompatibilityScore";
import { isHabitusConfigured } from "../lib/supabase";
import { liquidGlassTheme } from "../theme/liquidGlass";

type Props = NativeStackScreenProps<MainStackParamList, "MemberPublic">;

export function MemberPublicScreen({ route }: Props) {
  const { slug } = route.params;
  const { user } = useAuth();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [member, setMember] = useState<PublicMember | null>(null);
  const [hostListings, setHostListings] = useState<Property[]>([]);
  const [ownerListings, setOwnerListings] = useState<Property[]>([]);
  const [groups, setGroups] = useState<LivingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current[0];
  const slideUpAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    if (!isHabitusConfigured()) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const quizPromise = user?.id ? fetchCompatQuiz(user.id) : Promise.resolve({});
    quizPromise
      .then((quiz) => fetchPublicMember(slug, quiz))
      .then(async (m) => {
        if (!m) {
          setError(es.member.notFound);
          return;
        }
        setMember(m);
        const tasks: Promise<void>[] = [];
        if (m.uuid && m.accountRole === "anfitrion") {
          tasks.push(fetchListingsByHost(m.uuid).then(setHostListings));
        }
        if (m.uuid && roleShowsTrustProfile(m.accountRole)) {
          tasks.push(fetchListingsByOwner(m.uuid).then(setOwnerListings));
        }
        if (m.uuid && !m.isDemo) {
          tasks.push(fetchPublicGroupsForProfile(m.uuid).then(setGroups));
        }
        await Promise.all(tasks);

        // Animate in
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
      })
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  async function handleChat() {
    if (!user || !member || member.isDemo) {
      setHint(es.matches.demoChatHint);
      return;
    }
    const otherId = member.uuid;
    if (!otherId) return;
    setChatLoading(true);
    setHint(null);
    try {
      const convId = await startConversationWith(otherId);
      tabNav.navigate("Messages", { conversationId: convId });
    } catch {
      setHint(es.matches.chatError);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
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

  if (error || !member) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? es.member.notFound}</Text>
      </View>
    );
  }

  const listings = hostListings.length > 0 ? hostListings : ownerListings;
  const listingsTitle =
    member.accountRole === "anfitrion" ? es.member.hostSpaces : es.member.ownerSpaces;

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

      {/* Animated orbs */}
      <Animated.View style={[styles.orb1, { opacity: fadeAnim }]}>
        <View style={styles.orbInner1} />
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
          showsVerticalScrollIndicator={false}
        >
          {/* Profile header card */}
          <View style={styles.profileCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.profileCardContent}>
              {member.image ? (
                <Image source={{ uri: member.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{member.name}</Text>
                {member.accountRole && (
                  <View style={styles.roleBadge}>
                    <MaterialIcons
                      name={
                        member.accountRole === "inquilino"
                          ? "person"
                          : member.accountRole === "anfitrion"
                          ? "home"
                          : member.accountRole === "propietario"
                          ? "apartment"
                          : "business"
                      }
                      size={14}
                      color={liquidGlassTheme.colors.white}
                    />
                    <Text style={styles.roleText}>
                      {accountRoleLabel(member.accountRole)}
                    </Text>
                  </View>
                )}
                {member.compatibilityResult && (
                  <CompatibilityScore
                    score={member.compatibility}
                    result={member.compatibilityResult}
                    label={es.common.vibeMatch}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Bio */}
          {member.bio ? (
            <View style={styles.quoteCard}>
              <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.quoteContent}>
                <MaterialIcons
                  name="format-quote"
                  size={20}
                  color={liquidGlassTheme.colors.brand.primary}
                />
                <Text style={styles.quote}>"{member.bio}"</Text>
              </View>
            </View>
          ) : null}

          {/* Lifestyle tags */}
          {roleShowsLifestyleProfile(member.accountRole) && member.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Estilo de vida</Text>
              <View style={styles.tagRow}>
                {member.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trust hint */}
          {roleShowsTrustProfile(member.accountRole) && (
            <View style={styles.trustCard}>
              <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.trustContent}>
                <MaterialIcons
                  name="verified-user"
                  size={20}
                  color={liquidGlassTheme.colors.brand.secondary}
                />
                <Text style={styles.trustHint}>{es.member.trustHint}</Text>
              </View>
            </View>
          )}

          {/* Hint message */}
          {hint && (
            <View style={styles.hintCard}>
              <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.hint}>{hint}</Text>
            </View>
          )}

          {/* Chat button */}
          <Pressable
            style={[styles.chatBtn, chatLoading && styles.chatBtnDisabled]}
            onPress={() => void handleChat()}
            disabled={chatLoading}
          >
            <LinearGradient
              colors={liquidGlassTheme.colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {chatLoading ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="chat"
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.chatBtnText}>
                  {chatLoading ? es.common.pleaseWait : es.matches.startChat}
                </Text>
              </>
            )}
          </Pressable>

          {/* Listings */}
          {listings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{listingsTitle}</Text>
              {listings.map((p) => (
                <View key={p.id} style={styles.listingCard}>
                  <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.listingContent}>
                    <View style={styles.listingIcon}>
                      <MaterialIcons
                        name="home"
                        size={20}
                        color={liquidGlassTheme.colors.brand.primary}
                      />
                    </View>
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingName}>{p.name}</Text>
                      <Text style={styles.listingMeta}>{p.location}</Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={liquidGlassTheme.colors.light.text.tertiary}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Groups */}
          {groups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{es.member.groups}</Text>
              {groups.map((g) => (
                <View key={g.id} style={styles.listingCard}>
                  <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.listingContent}>
                    <View style={styles.listingIcon}>
                      <MaterialIcons
                        name="groups"
                        size={20}
                        color={liquidGlassTheme.colors.brand.secondary}
                      />
                    </View>
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingName}>{g.name}</Text>
                      <Text style={styles.listingMeta}>{g.city}</Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={liquidGlassTheme.colors.light.text.tertiary}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
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
    padding: liquidGlassTheme.spacing.xl,
  },
  error: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.brand.error,
    textAlign: "center",
  },
  orb1: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -80,
    right: -50,
    borderRadius: 100,
  },
  orbInner1: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: liquidGlassTheme.colors.brand.secondary + "20",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.lg,
    paddingTop: liquidGlassTheme.spacing.xxl,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  profileCard: {
    borderRadius: liquidGlassTheme.borderRadius.xxl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.xl,
  },
  profileCardContent: {
    padding: liquidGlassTheme.spacing.xl,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: liquidGlassTheme.colors.white,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: liquidGlassTheme.spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  profileInfo: {
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
  },
  name: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.xs,
    borderRadius: liquidGlassTheme.borderRadius.xl,
    backgroundColor: liquidGlassTheme.colors.brand.primary,
  },
  roleText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.white,
  },
  quoteCard: {
    borderRadius: liquidGlassTheme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  quoteContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  quote: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontStyle: "italic",
    color: liquidGlassTheme.colors.light.text.primary,
  },
  tagsSection: {
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: liquidGlassTheme.spacing.sm,
  },
  tag: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    paddingHorizontal: liquidGlassTheme.spacing.md,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    overflow: "hidden",
  },
  tagText: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  trustCard: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.brand.secondary + "10",
  },
  trustContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  trustHint: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  hintCard: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant + "60",
  },
  hint: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.secondary,
    padding: liquidGlassTheme.spacing.md,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    marginBottom: liquidGlassTheme.spacing.lg,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  chatBtnDisabled: {
    opacity: 0.6,
  },
  chatBtnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
  section: {
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  listingCard: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.sm,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  listingContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.md,
    gap: liquidGlassTheme.spacing.md,
  },
  listingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  listingMeta: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginTop: 2,
  },
});
