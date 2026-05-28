import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotifications,
  formatMessageTime,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type InAppNotification,
} from "@habitus/core";
import { notificationHref } from "../lib/notificationsUi";

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const list = await fetchNotifications(user.id, 50);
    setItems(list);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    const sub = subscribeToNotifications(user.id, () => {
      void load();
    });
    return () => sub.unsubscribe();
  }, [user, authLoading]);

  const handleClick = async (n: InAppNotification) => {
    if (!user) return;
    if (!n.readAt) {
      await markNotificationRead(user.id, n.id);
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      );
    }
    navigate(notificationHref(n));
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  if (authLoading || loading) return <LoadingState />;

  return (
    <div className="mx-auto w-full max-w-2xl px-margin-mobile pb-24 pt-6 md:px-margin-desktop md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg font-semibold text-stone-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-stone-500">Actividad reciente en tu cuenta</p>
        </div>
        {items.some((n) => !n.readAt) && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Marcar todas leídas
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <Icon name="bell" className="mx-auto text-3xl text-stone-300" />
          <p className="mt-3 text-stone-600">Aún no tienes notificaciones</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void handleClick(n)}
                className={`flex w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-stone-50 ${
                  !n.readAt ? "bg-teal-50/40" : ""
                }`}
              >
                <div
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                    n.readAt ? "bg-transparent" : "bg-teal-accent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-stone-600">{n.body}</p>
                  <p className="mt-2 text-xs text-stone-400">{formatMessageTime(n.createdAt)}</p>
                </div>
                <Icon name="chevron_right" className="shrink-0 text-stone-300" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
