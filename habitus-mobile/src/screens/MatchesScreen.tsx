import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  es,
  fetchCompatQuiz,
  fetchShowcaseMembers,
  fetchVerifiedMembers,
  startConversationWith,
  type Roommate,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { isHabitusConfigured } from "../lib/supabase";
import type { MainTabParamList } from "../navigation/MainTabs";
import type { MainStackParamList } from "../navigation/MainStack";
import { CompatibilityScore } from "../components/CompatibilityScore";
import { liquidGlassTheme } from "../theme/liquidGlass";

type TabNav = BottomTabNavigationProp<MainTabParamList, "Matches">;
type MainNav = NativeStackNavigationProp<MainStackParamList>;

function MatchCard({
  item,
  onChat,
  onProfile,
  chatLoading,
  hint,
  index,
}: {
  item: Roommate;
  onChat: () => void;
  onProfile: () => void;
  chatLoading: boolean;
  hint: string | null;
  index: number;
}) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));

  useEffect(() => {
    const delay = index * 50;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...liquidGlassTheme.animation.spring.smooth,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.avatar} />

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.roleContainer}>
                <MaterialIcons
                  name="badge"
                  size={14}
                  color={liquidGlassTheme.colors.brand.primary}
                />
                <Text style={styles.role}>{item.role}</Text>
              </View>
            </View>
            {item.isDemo ? (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>{es.matches.demoProfile}</Text>
              </View>
            ) : null}
          </View>

          <CompatibilityScore
            score={item.compatibility}
            result={item.compatibilityResult}
            label={es.common.vibeMatch}
          />

          {item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {item.quote ? (
            <View style={styles.quoteContainer}>
              <MaterialIcons
                name="format-quote"
                size={16}
                color={liquidGlassTheme.colors.brand.secondary}
              />
              <Text style={styles.quote} numberOfLines={2}>
                {item.quote}
              </Text>
            </View>
          ) : null}

          {hint ? (
            <View style={styles.hintCard}>
              <MaterialIcons
                name="info-outline"
                size={16}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.hint}>{hint}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.profileBtn} onPress={onProfile}>
              <MaterialIcons
                name="person-outline"
                size={18}
                color={liquidGlassTheme.colors.brand.primary}
              />
              <Text style={styles.profileBtnText}>{es.matches.viewProfile}</Text>
            </Pressable>
            <Pressable
              style={[styles.chatBtn, chatLoading && styles.chatBtnDisabled]}
              onPress={onChat}
              disabled={chatLoading}
            >
              <LinearGradient
                colors={liquidGlassTheme.colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {chatLoading ? (
                <ActivityIndicator
                  size="small"
                  color={liquidGlassTheme.colors.white}
                />
              ) : (
                <>
                  <MaterialIcons
                    name="chat-bubble-outline"
                    size={18}
                    color={liquidGlassTheme.colors.white}
                  />
                  <Text style={styles.chatBtnText}>
                    {chatLoading ? es.common.pleaseWait : es.matches.startChat}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function MatchesScreen() {
  const { user } = useAuth();
  const tabNav = useNavigation<TabNav>();
  const mainNav = tabNav.getParent() as MainNav | undefined;
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Roommate[]>([]);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [hintById, setHintById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!isHabitusConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const quiz = user?.id ? await fetchCompatQuiz(user.id) : {};
      const [verified, showcase] = await Promise.all([
        user?.id ? fetchVerifiedMembers(user.id, quiz) : Promise.resolve([]),
        fetchShowcaseMembers(quiz),
      ]);
      setMembers([...verified, ...showcase]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleChat(item: Roommate) {
    if (!user) return;

    if (item.isDemo) {
      setHintById((prev) => ({ ...prev, [item.id]: es.matches.demoChatHint }));
      return;
    }

    const otherId = item.uuid ?? item.id;
    setChatLoadingId(item.id);
    setHintById((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    try {
      const convId = await startConversationWith(otherId);
      tabNav.navigate("Messages", { conversationId: convId });
    } catch {
      setHintById((prev) => ({
        ...prev,
        [item.id]: "No se pudo iniciar la conversación. Inténtalo de nuevo.",
      }));
    } finally {
      setChatLoadingId(null);
    }
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <Text style={styles.title}>{es.matches.title}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={liquidGlassTheme.colors.brand.primary}
          />
          <Text style={styles.loadingText}>Buscando compatibilidades...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <MatchCard
              item={item}
              index={index}
              onChat={() => void handleChat(item)}
              onProfile={() => mainNav?.navigate("MemberPublic", { slug: item.slug })}
              chatLoading={chatLoadingId === item.id}
              hint={hintById[item.id] ?? null}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="people-outline"
                size={48}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.emptyText}>{es.matches.empty}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  header: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.md,
  },
  loadingText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  list: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  card: {
    flexDirection: "row",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    padding: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: liquidGlassTheme.borderRadius.md,
  },
  body: {
    flex: 1,
    marginLeft: liquidGlassTheme.spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  role: {
    color: liquidGlassTheme.colors.brand.primary,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
  },
  demoBadge: {
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: liquidGlassTheme.borderRadius.sm,
  },
  demoBadgeText: {
    fontSize: liquidGlassTheme.typography.fontSize.caption2,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: liquidGlassTheme.spacing.xs,
    marginTop: liquidGlassTheme.spacing.sm,
  },
  tag: {
    backgroundColor: liquidGlassTheme.colors.brand.primary + "10",
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: liquidGlassTheme.borderRadius.sm,
  },
  tagText: {
    fontSize: liquidGlassTheme.typography.fontSize.caption1,
    color: liquidGlassTheme.colors.brand.primary,
  },
  quoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.xs,
    marginTop: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.sm,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: liquidGlassTheme.borderRadius.sm,
  },
  quote: {
    color: liquidGlassTheme.colors.light.text.secondary,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontStyle: "italic",
    flex: 1,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.xs,
    marginTop: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.sm,
    backgroundColor: liquidGlassTheme.colors.brand.warning + "10",
    borderRadius: liquidGlassTheme.borderRadius.sm,
  },
  hint: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  actionRow: {
    flexDirection: "row",
    gap: liquidGlassTheme.spacing.sm,
    marginTop: liquidGlassTheme.spacing.md,
  },
  profileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.xs,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.primary,
  },
  profileBtnText: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
  },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.xs,
    paddingVertical: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
  },
  chatBtnDisabled: {
    opacity: 0.6,
  },
  chatBtnText: {
    color: liquidGlassTheme.colors.white,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: liquidGlassTheme.spacing.xxxl * 2,
    gap: liquidGlassTheme.spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
});
