import { getSupabase } from "../client";
import { normalizeImageUrl } from "../lib/media";
import type { Conversation, Message } from "../types/models";

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: participations, error } = await getSupabase()
    .from("habitus_conversation_participants")
    .select("conversation_id")
    .eq("profile_id", userId);

  if (error) return [];
  if (!participations?.length) return [];

  const convIds = participations.map((p) => p.conversation_id);

  const { data: convs, error: convErr } = await getSupabase()
    .from("habitus_conversations")
    .select("id, updated_at")
    .in("id", convIds)
    .order("updated_at", { ascending: false });

  if (convErr) return [];

  const results: Conversation[] = [];

  for (const conv of convs ?? []) {
    const { data: others } = await getSupabase()
      .from("habitus_conversation_participants")
      .select("profile_id, habitus_profiles (id, display_name, avatar_url, role_title)")
      .eq("conversation_id", conv.id)
      .neq("profile_id", userId);

    const other = others?.[0]?.habitus_profiles as unknown as {
      id: string;
      display_name: string;
      avatar_url: string | null;
      role_title: string | null;
    } | null;

    const { data: lastMsg } = await getSupabase()
      .from("habitus_messages")
      .select("body, created_at, sender_id")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      id: conv.id,
      otherUserId: other?.id ?? "",
      otherName: other?.display_name ?? "Miembro",
      otherAvatar: normalizeImageUrl(other?.avatar_url),
      otherRole: other?.role_title ?? null,
      lastMessage: lastMsg?.body ?? "",
      lastMessageAt: lastMsg?.created_at ?? conv.updated_at,
      isOwnLastMessage: lastMsg?.sender_id === userId,
    });
  }

  return results;
}

export async function fetchConversationMeta(
  conversationId: string,
  userId: string,
): Promise<Pick<Conversation, "id" | "otherName" | "otherAvatar" | "otherRole" | "otherUserId"> | null> {
  const { data: others, error } = await getSupabase()
    .from("habitus_conversation_participants")
    .select("profile_id, habitus_profiles (id, display_name, avatar_url, role_title)")
    .eq("conversation_id", conversationId)
    .neq("profile_id", userId);

  if (error) return null;

  const other = others?.[0]?.habitus_profiles as unknown as {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role_title: string | null;
  } | null;

  return {
    id: conversationId,
    otherUserId: other?.id ?? "",
    otherName: other?.display_name ?? "Miembro",
    otherAvatar: normalizeImageUrl(other?.avatar_url),
    otherRole: other?.role_title ?? null,
  };
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await getSupabase()
    .from("habitus_messages")
    .select("id, body, created_at, sender_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    senderId: m.sender_id,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<void> {
  const { error } = await getSupabase().from("habitus_messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body: body.trim(),
  });
  if (error) throw error;

  await getSupabase()
    .from("habitus_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function startConversationWith(otherProfileId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("habitus_create_conversation_with", {
    other_profile: otherProfileId,
  });
  if (error) throw error;
  return data as string;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
) {
  return getSupabase()
    .channel(`habitus-messages-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "habitus_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const m = payload.new as {
          id: string;
          body: string;
          created_at: string;
          sender_id: string;
        };
        onMessage({
          id: m.id,
          body: m.body,
          createdAt: m.created_at,
          senderId: m.sender_id,
        });
      },
    )
    .subscribe();
}
