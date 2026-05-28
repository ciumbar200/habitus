import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToNotifications } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { showNotificationToast } from "../lib/notificationsUi";

/** Escucha inserts Realtime y muestra toast Sileo por cada notificación nueva. */
export function NotificationToasts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const sub = subscribeToNotifications(
      user.id,
      () => {},
      (notification) => {
        showNotificationToast(notification, (href) => navigate(href));
      },
    );

    return () => sub.unsubscribe();
  }, [user?.id, navigate]);

  return null;
}
