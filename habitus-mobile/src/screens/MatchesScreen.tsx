import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
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
import { CompatibilityScore } from "../components/CompatibilityScore";

type Nav = BottomTabNavigationProp<MainTabParamList, "Matches">;

function MatchCard({
  item,
  onChat,
  chatLoading,
  hint,
}: {
  item: Roommate;
  onChat: () => void;
  chatLoading: boolean;
  hint: string | null;
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.avatar} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
          {item.isDemo ? (
            <Text style={styles.demoBadge}>{es.matches.demoProfile}</Text>
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
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        )}
        {item.quote ? (
          <Text style={styles.quote} numberOfLines={2}>
            &ldquo;{item.quote}&rdquo;
          </Text>
        ) : null}
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        <Pressable
          style={[styles.chatBtn, chatLoading && styles.chatBtnDisabled]}
          onPress={onChat}
          disabled={chatLoading}
        >
          <Text style={styles.chatBtnText}>
            {chatLoading ? es.common.pleaseWait : es.matches.startChat}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MatchesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
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
      navigation.navigate("Messages", { conversationId: convId });
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
      <Text style={styles.title}>{es.matches.title}</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MatchCard
              item={item}
              onChat={() => void handleChat(item)}
              chatLoading={chatLoadingId === item.id}
              hint={hintById[item.id] ?? null}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{es.matches.empty}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  title: { fontSize: 22, fontWeight: "700", padding: 16, color: "#1a3d2e" },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  avatar: { width: 72, height: 72, borderRadius: 8 },
  body: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  nameBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#1a3d2e" },
  role: { color: "#2d6a4f", marginTop: 2, fontSize: 13 },
  demoBadge: {
    fontSize: 11,
    color: "#666",
    backgroundColor: "#f0eeea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    fontSize: 11,
    color: "#1a3d2e",
    backgroundColor: "#f0eeea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quote: { color: "#666", fontSize: 13, fontStyle: "italic", marginTop: 6 },
  hint: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0eeea",
    color: "#555",
    fontSize: 13,
  },
  chatBtn: {
    marginTop: 10,
    backgroundColor: "#1a3d2e",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  chatBtnDisabled: { opacity: 0.6 },
  chatBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
});
