import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
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
import { liquidGlassTheme } from "../theme/liquidGlass";

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
        {/* Header */}
        <View style={styles.chatHeader}>
          {Platform.OS === "ios" && (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          )}
          <Pressable onPress={() => setActiveId(null)} style={styles.backButton}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={liquidGlassTheme.colors.light.text.primary}
            />
          </Pressable>
          <View style={styles.chatHeaderContent}>
            <View style={styles.avatar}>
              <MaterialIcons
                name="person"
                size={20}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
            </View>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{conv?.otherName ?? "Chat"}</Text>
              <Text style={styles.chatHeaderStatus}>En línea</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.thread}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleRow,
                item.senderId === user?.id ? styles.bubbleRowMine : styles.bubbleRowOther,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.senderId === user?.id ? styles.bubbleMine : styles.bubbleOther,
                ]}
              >
                <Text style={[
                  styles.bubbleText,
                  item.senderId === user?.id ? styles.bubbleTextMine : styles.bubbleTextOther,
                ]}>
                  {item.body}
                </Text>
                <Text style={[
                  styles.time,
                  item.senderId === user?.id ? styles.timeMine : styles.timeOther,
                ]}>
                  {formatMessageTime(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Message composer */}
        <View style={styles.composer}>
          {Platform.OS === "ios" && (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.composerContent}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={liquidGlassTheme.colors.light.text.tertiary}
            />
            <Pressable
              style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={sending || !draft.trim()}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={draft.trim() ? liquidGlassTheme.colors.white : liquidGlassTheme.colors.light.text.tertiary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <Text style={styles.title}>{es.messages.title}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={liquidGlassTheme.colors.brand.primary}
          />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => openConversation(item.id)}
            >
              <View style={styles.avatar}>
                <MaterialIcons
                  name="person"
                  size={24}
                  color={liquidGlassTheme.colors.light.text.tertiary}
                />
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowName}>{item.otherName}</Text>
                  {item.lastMessageAt && (
                    <Text style={styles.rowTime}>{formatMessageTime(item.lastMessageAt)}</Text>
                  )}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage || es.messages.emptyHint}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="chat-bubble-outline"
                size={48}
                color={liquidGlassTheme.colors.light.text.tertiary}
              />
              <Text style={styles.emptyText}>{es.messages.empty}</Text>
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
  },
  list: {
    padding: liquidGlassTheme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    padding: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    marginBottom: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    marginRight: liquidGlassTheme.spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: {
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  rowTime: {
    fontSize: liquidGlassTheme.typography.fontSize.caption2,
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  preview: {
    color: liquidGlassTheme.colors.light.text.tertiary,
    marginTop: liquidGlassTheme.spacing.xs,
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
  // Chat view styles
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: liquidGlassTheme.spacing.sm,
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  backButton: {
    padding: liquidGlassTheme.spacing.sm,
    marginRight: liquidGlassTheme.spacing.xs,
  },
  chatHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatHeaderInfo: {
    marginLeft: liquidGlassTheme.spacing.md,
  },
  chatHeaderName: {
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  chatHeaderStatus: {
    fontSize: liquidGlassTheme.typography.fontSize.caption1,
    color: liquidGlassTheme.colors.brand.success,
  },
  thread: {
    padding: liquidGlassTheme.spacing.lg,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    padding: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.lg,
    ...liquidGlassTheme.shadows.sm,
  },
  bubbleMine: {
    backgroundColor: liquidGlassTheme.colors.brand.primary,
  },
  bubbleOther: {
    backgroundColor: liquidGlassTheme.colors.light.glass.card,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  bubbleText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    lineHeight: liquidGlassTheme.typography.lineHeight.normal,
  },
  bubbleTextMine: {
    color: liquidGlassTheme.colors.light.text.inverse,
  },
  bubbleTextOther: {
    color: liquidGlassTheme.colors.light.text.primary,
  },
  time: {
    fontSize: liquidGlassTheme.typography.fontSize.caption2,
    marginTop: liquidGlassTheme.spacing.xs,
    alignSelf: "flex-end",
  },
  timeMine: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  timeOther: {
    color: liquidGlassTheme.colors.light.text.tertiary,
  },
  composer: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
    paddingTop: liquidGlassTheme.spacing.md,
    paddingBottom: liquidGlassTheme.spacing.lg + 4,
    borderTopWidth: 1,
    borderTopColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.navigation,
  },
  composerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: liquidGlassTheme.borderRadius.md,
    padding: liquidGlassTheme.spacing.md,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
  },
});
