import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type InAppNotification,
} from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";
import { formatMessageTime } from "@habitus/core";
import { notificationHref } from "../lib/notificationsUi";

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    if (!user) return;
    const [count, list] = await Promise.all([
      fetchUnreadNotificationCount(user.id),
      fetchNotifications(user.id, 10),
    ]);
    setUnread(count);
    setItems(list);
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
    const sub = subscribeToNotifications(user.id, () => {
      void refresh();
    });
    return () => sub.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!user || open) return;
    setLoading(true);
    try {
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (n: InAppNotification) => {
    if (!user) return;
    if (!n.readAt) {
      await markNotificationRead(user.id, n.id);
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    navigate(notificationHref(n));
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Icon name="bell" className="text-xl" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[80] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-900">Notificaciones</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAll()}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-stone-500">No tienes notificaciones</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleClick(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                        !n.readAt ? "bg-teal-50/50" : ""
                      }`}
                    >
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          n.readAt ? "bg-transparent" : "bg-teal-accent"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-stone-600">{n.body}</p>
                        <p className="mt-1 text-[11px] text-stone-400">
                          {formatMessageTime(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-stone-100 px-4 py-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block py-2 text-center text-sm font-medium text-teal-700 hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
