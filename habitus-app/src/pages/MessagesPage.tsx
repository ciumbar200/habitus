import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LoadingState, ErrorState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import { formatMessageTime } from "@habitus/core";
import { es } from "@habitus/core";
import {
  fetchConversationMeta,
  fetchConversations,
  fetchMessages,
  sendMessage,
  subscribeToMessages,
} from "@habitus/core";
import type { Conversation, Message } from "@habitus/core";
import { isSupabaseConfigured } from "../lib/supabase";

export function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("c"));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMeta, setActiveMeta] = useState<{
    otherName: string;
    otherRole: string | null;
    otherAvatar: string | null;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError(es.discover.configError);
      setLoading(false);
      return;
    }

    fetchConversations(user.id)
      .then(setConversations)
      .catch((e) => setError(e instanceof Error ? e.message : es.common.errorLoad))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    const c = searchParams.get("c");
    if (c) setActiveId(c);
  }, [searchParams]);

  useEffect(() => {
    if (!activeId || !user) {
      setMessages([]);
      setActiveMeta(null);
      return;
    }

    fetchMessages(activeId)
      .then(setMessages)
      .catch(() => setMessages([]));

    const inList = conversations.some((c) => c.id === activeId);
    if (!inList) {
      fetchConversationMeta(activeId, user.id).then((meta) => {
        if (meta) {
          setActiveMeta({
            otherName: meta.otherName,
            otherRole: meta.otherRole,
            otherAvatar: meta.otherAvatar,
          });
        }
      });
    } else {
      setActiveMeta(null);
    }

    const channel = subscribeToMessages(activeId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [activeId, user, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setSearchParams({ c: id });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeId || !draft.trim()) return;

    setSending(true);
    try {
      await sendMessage(activeId, user.id, draft);
      setDraft("");
      const updated = await fetchMessages(activeId);
      setMessages(updated);
      const convs = await fetchConversations(user.id);
      setConversations(convs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo enviar el mensaje.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-margin-mobile pb-32 pt-32 md:px-margin-desktop">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-12 text-center card-shadow">
          <h2 className="mb-2 text-headline-md text-deep-navy">{es.messages.title}</h2>
          <p className="mb-6 text-body-md text-warm-slate">{es.messages.signInRequired}</p>
          <Link
            to="/access"
            className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary"
          >
            {es.common.signIn}
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </main>
    );
  }

  if (!loading && conversations.length === 0 && !activeId) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-margin-mobile pb-32 pt-32 md:px-margin-desktop">
        <div className="rounded-xl border border-border-light bg-surface-container-lowest p-12 text-center card-shadow">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-teal-accent">
            <Icon name="chat_bubble" className="text-[32px]" />
          </div>
          <h2 className="mb-2 text-headline-md text-deep-navy">{es.messages.empty}</h2>
          <p className="mb-6 max-w-sm text-body-md text-warm-slate">{es.messages.emptyHint}</p>
          <Link
            to="/matches"
            className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            {es.messages.browseMatches}
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </main>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeId);
  const headerName = activeConv?.otherName ?? activeMeta?.otherName ?? "Miembro";
  const headerRole = activeConv?.otherRole ?? activeMeta?.otherRole;

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <h2 className="mb-6 text-headline-lg text-deep-navy md:hidden">{es.messages.title}</h2>

      {error && <ErrorState message={error} />}

      <div className="grid min-h-[60vh] grid-cols-1 overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest card-shadow md:grid-cols-3">
        <aside className={`border-border-light md:col-span-1 md:border-r ${activeId ? "hidden md:block" : ""}`}>
          {loading ? (
            <LoadingState message={es.common.loading} />
          ) : (
            <ul className="divide-y divide-border-light">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-container ${
                      activeId === c.id ? "bg-surface-container" : ""
                    }`}
                  >
                    {c.otherAvatar ? (
                      <img
                        src={c.otherAvatar}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-teal-accent">
                        <Icon name="person" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-md text-deep-navy">{c.otherName}</p>
                      {c.otherRole && (
                        <p className="truncate text-label-sm text-teal-accent">{c.otherRole}</p>
                      )}
                      <p className="truncate text-label-sm text-warm-slate">
                        {c.isOwnLastMessage ? `${es.messages.you}: ` : ""}
                        {c.lastMessage || "—"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={`flex flex-col md:col-span-2 ${!activeId ? "hidden md:flex" : ""}`}>
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-body-md text-warm-slate">
              {es.messages.selectConversation}
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border-light p-4">
                <button
                  type="button"
                  className="md:hidden"
                  onClick={() => {
                    setActiveId(null);
                    setSearchParams({});
                  }}
                  aria-label={es.common.back}
                >
                  <Icon name="arrow_back" />
                </button>
                <div>
                  <p className="text-label-md text-deep-navy">{headerName}</p>
                  {headerRole && (
                    <p className="text-label-sm text-teal-accent">{headerRole}</p>
                  )}
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: "320px" }}>
                {messages.map((m) => {
                  const own = m.senderId === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${own ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 text-body-md ${
                          own
                            ? "bg-deep-navy text-white"
                            : "bg-surface-container text-deep-navy"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p
                          className={`mt-1 text-label-sm ${own ? "text-on-primary-container" : "text-warm-slate"}`}
                        >
                          {formatMessageTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex gap-2 border-t border-border-light p-4"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={es.messages.placeholder}
                  className="flex-1 rounded-lg border border-border-light px-4 py-3 text-body-md focus:border-teal-accent focus:ring-2 focus:ring-teal-accent/20"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white disabled:opacity-60"
                >
                  {es.messages.send}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
