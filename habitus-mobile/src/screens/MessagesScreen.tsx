import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  es,
  fetchConversations,
  fetchMessages,
  formatMessageTime,
  sendMessage,
  subscribeToMessages,
  type Conversation,
  type Message,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { isHabitusConfigured } from "../lib/supabase";
import type { MainTabParamList } from "../navigation/MainTabs";

type MessagesRoute = RouteProp<MainTabParamList, "Messages">;
type MessagesNav = BottomTabNavigationProp<MainTabParamList, "Messages">;

export function MessagesScreen() {
  const { user } = useAuth();
  const route = useRoute<MessagesRoute>();
  const navigation = useNavigation<MessagesNav>();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!isHabitusConfigured() || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setConversations(await fetchConversations(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const convId = route.params?.conversationId;
    if (!convId) return;
    setActiveId(convId);
    navigation.setParams({ conversationId: undefined });
  }, [route.params?.conversationId, navigation]);

  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId).then(setMessages);
    const channel = subscribeToMessages(activeId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return () => {
      channel.unsubscribe();
    };
  }, [activeId]);

  async function openConversation(id: string) {
    setActiveId(id);
  }

  async function handleSend() {
    if (!activeId || !draft.trim() || !user) return;
    setSending(true);
    try {
      await sendMessage(activeId, user.id, draft.trim());
      setDraft("");
      setMessages(await fetchMessages(activeId));
      loadConversations();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  if (activeId) {
    const conv = conversations.find((c) => c.id === activeId);
    return (
      <View style={styles.root}>
        <Pressable onPress={() => setActiveId(null)}>
          <Text style={styles.back}>← {conv?.otherName ?? "Chat"}</Text>
        </Pressable>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.thread}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.senderId === user?.id ? styles.bubbleMine : styles.bubbleOther,
              ]}
            >
              <Text style={styles.bubbleText}>{item.body}</Text>
              <Text style={styles.time}>{formatMessageTime(item.createdAt)}</Text>
            </View>
          )}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
          />
          <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sending}>
            <Text style={styles.sendText}>Enviar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{es.messages.title}</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3d2e" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openConversation(item.id)}>
              <Text style={styles.rowName}>{item.otherName}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage || es.messages.emptyHint}
              </Text>
              {item.lastMessageAt && (
                <Text style={styles.time}>{formatMessageTime(item.lastMessageAt)}</Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{es.messages.empty}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f6f3" },
  title: { fontSize: 22, fontWeight: "700", padding: 16, color: "#1a3d2e" },
  back: { padding: 16, color: "#1a3d2e", fontWeight: "600" },
  list: { padding: 16 },
  row: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  rowName: { fontWeight: "600", fontSize: 16 },
  preview: { color: "#666", marginTop: 4 },
  thread: { padding: 16, flexGrow: 1 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 12, marginBottom: 8 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: "#1a3d2e" },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: "#fff" },
  bubbleText: { color: "#1a1a1a" },
  time: { fontSize: 11, color: "#888", marginTop: 4 },
  composer: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderColor: "#e2ddd4" },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2ddd4",
  },
  sendBtn: { backgroundColor: "#1a3d2e", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
});
