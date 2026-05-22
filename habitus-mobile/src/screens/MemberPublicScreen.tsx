import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import {
  accountRoleLabel,
  es,
  fetchCompatQuiz,
  fetchGroupsForProfile,
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
          tasks.push(fetchGroupsForProfile(m.uuid).then(setGroups));
        }
        await Promise.all(tasks);
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
        <ActivityIndicator color="#1a3d2e" />
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
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        {member.image ? (
          <Image source={{ uri: member.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <View style={styles.headerBody}>
          <Text style={styles.name}>{member.name}</Text>
          {member.accountRole && (
            <Text style={styles.role}>{accountRoleLabel(member.accountRole)}</Text>
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

      {member.bio ? (
        <Text style={styles.quote}>&ldquo;{member.bio}&rdquo;</Text>
      ) : null}

      {roleShowsLifestyleProfile(member.accountRole) && member.tags.length > 0 && (
        <View style={styles.tagRow}>
          {member.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      )}

      {roleShowsTrustProfile(member.accountRole) && (
        <Text style={styles.trustHint}>{es.member.trustHint}</Text>
      )}

      {hint && <Text style={styles.hint}>{hint}</Text>}

      <Pressable
        style={[styles.btn, chatLoading && styles.btnDisabled]}
        onPress={() => void handleChat()}
        disabled={chatLoading}
      >
        <Text style={styles.btnText}>
          {chatLoading ? es.common.pleaseWait : es.matches.startChat}
        </Text>
      </Pressable>

      {listings.length > 0 && (
        <>
          <Text style={styles.section}>{listingsTitle}</Text>
          {listings.map((p) => (
            <View key={p.id} style={styles.listingCard}>
              <Text style={styles.listingName}>{p.name}</Text>
              <Text style={styles.listingMeta}>{p.location}</Text>
            </View>
          ))}
        </>
      )}

      {groups.length > 0 && (
        <>
          <Text style={styles.section}>{es.member.groups}</Text>
          {groups.map((g) => (
            <View key={g.id} style={styles.listingCard}>
              <Text style={styles.listingName}>{g.name}</Text>
              <Text style={styles.listingMeta}>{g.city}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, paddingBottom: 40, backgroundColor: "#f8f6f3" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  header: { flexDirection: "row", gap: 14 },
  avatar: { width: 88, height: 88, borderRadius: 12 },
  avatarPlaceholder: { backgroundColor: "#ddd" },
  headerBody: { flex: 1 },
  name: { fontSize: 22, fontWeight: "700", color: "#1a3d2e" },
  role: { color: "#2d6a4f", marginTop: 4 },
  quote: { marginTop: 16, fontStyle: "italic", color: "#555", fontSize: 15 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tag: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e4dc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
  },
  trustHint: { marginTop: 12, color: "#666", fontSize: 14 },
  hint: { marginTop: 12, color: "#666", backgroundColor: "#f0eeea", padding: 10, borderRadius: 8 },
  btn: {
    marginTop: 16,
    backgroundColor: "#1a3d2e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
  section: { fontSize: 17, fontWeight: "600", color: "#1a3d2e", marginTop: 24, marginBottom: 8 },
  listingCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  listingName: { fontWeight: "600" },
  listingMeta: { color: "#666", marginTop: 4, fontSize: 13 },
  error: { color: "#b91c1c", textAlign: "center" },
});
