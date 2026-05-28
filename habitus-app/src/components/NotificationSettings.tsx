import { useState, useEffect } from "react";
import { notificationService } from "../services/notifications";
import { Icon } from "./Icon";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@habitus/core";

interface NotificationSettingsProps {
  className?: string;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <h4 className="text-sm font-medium text-stone-900">{title}</h4>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-teal-600" : "bg-stone-300"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({ className = "" }: NotificationSettingsProps) {
  const { user, profile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        await notificationService.initialize();
        setPermission(notificationService.getPermissionStatus());
        setIsInstalled(notificationService.isInstalled());
        const subscribed = await notificationService.isSubscribed();
        setIsSubscribed(subscribed);
      } catch (err) {
        console.warn("Notification settings unavailable:", err);
      }
    };

    loadState();

    navigator.permissions?.query({ name: "notifications" as PermissionName }).then((result) => {
      result.addEventListener("change", () => {
        setPermission(notificationService.getPermissionStatus());
      });
    }).catch(() => undefined);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotificationPreferences(user.id)
      .then(setPrefs)
      .catch(() => setPrefs(null));
  }, [user?.id]);

  const savePrefs = async (next: Partial<NotificationPreferences>) => {
    if (!user?.id || !prefs) return;
    setPrefsSaving(true);
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    const err = await updateNotificationPreferences(user.id, merged);
    if (err) console.warn("prefs save", err);
    setPrefsSaving(false);
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    const granted = await notificationService.requestPermission();
    setPermission(granted ? "granted" : "denied");

    if (granted) {
      const subscribed = await notificationService.isSubscribed();
      setIsSubscribed(subscribed);

      if (user?.id) {
        await notificationService.setExternalId(user.id);
        await notificationService.setTags({
          user_type: "authenticated",
          user_role: profile?.accountRole ?? "inquilino",
          push_opt_in: "true",
          app: "moon_shared_living",
        });
      }
    }
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    await notificationService.sendTestNotification({
      title: ": moon shared living",
      body: "¡Notificación de prueba! Todo funciona correctamente.",
      icon: "/brand/moon-logo-black.png",
      badge: "/brand/moon-logo-black.png",
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isInstalled ? "bg-emerald-100" : "bg-stone-100"
            }`}>
              <Icon
                name={isInstalled ? "check-circle" : "device-mobile"}
                className={`text-lg ${isInstalled ? "text-emerald-600" : "text-stone-500"}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">App instalada</h3>
              <p className="text-sm text-stone-500">
                {isInstalled
                  ? "La app está instalada en tu dispositivo"
                  : "Instala la app para una mejor experiencia"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                permission === "granted"
                  ? "bg-emerald-100"
                  : permission === "denied"
                    ? "bg-red-100"
                    : "bg-amber-100"
              }`}
            >
              <Icon
                name="bell"
                className={`text-lg ${
                  permission === "granted"
                    ? "text-emerald-600"
                    : permission === "denied"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Notificaciones push</h3>
              <p className="text-sm text-stone-500">
                {permission === "granted"
                  ? "Las notificaciones push están activadas"
                  : permission === "denied"
                    ? "Las notificaciones están bloqueadas en el navegador"
                    : "Activa push para alertas en tiempo real"}
              </p>
            </div>
          </div>
          {permission === "default" && (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="rounded-lg bg-deep-navy px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-50"
            >
              Activar
            </button>
          )}
        </div>
      </div>

      {permission === "granted" && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isSubscribed ? "bg-emerald-100" : "bg-stone-100"
              }`}
            >
              <Icon
                name="broadcast"
                className={`text-lg ${isSubscribed ? "text-emerald-600" : "text-stone-500"}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Suscripción push</h3>
              <p className="text-sm text-stone-500">
                {isSubscribed ? "Suscrito correctamente" : "Configurando suscripción…"}
              </p>
            </div>
          </div>
        </div>
      )}

      {prefs && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="mb-1 font-semibold text-stone-900">Preferencias de email</h3>
          <p className="mb-3 text-xs text-stone-500">
            Emails transaccionales sobre tu actividad. No incluyen marketing.
          </p>
          <div className="divide-y divide-stone-100">
            <ToggleRow
              title="Emails de solicitudes"
              description="Confirmaciones y cambios de estado de alquiler"
              checked={prefs.emailApplications}
              disabled={prefsSaving || !prefs.emailEnabled}
              onChange={(v) => void savePrefs({ emailApplications: v })}
            />
            <ToggleRow
              title="Emails de mensajes"
              description="Aviso cuando recibes un mensaje nuevo"
              checked={prefs.emailMessages}
              disabled={prefsSaving || !prefs.emailEnabled}
              onChange={(v) => void savePrefs({ emailMessages: v })}
            />
            <ToggleRow
              title="Emails de grupos"
              description="Solicitudes, aceptaciones y acceso a pisos privados"
              checked={prefs.emailGroups}
              disabled={prefsSaving || !prefs.emailEnabled}
              onChange={(v) => void savePrefs({ emailGroups: v })}
            />
            <ToggleRow
              title="Emails activados"
              description="Desactiva todos los emails transaccionales"
              checked={prefs.emailEnabled}
              disabled={prefsSaving}
              onChange={(v) => void savePrefs({ emailEnabled: v })}
            />
          </div>
        </div>
      )}

      {permission === "granted" && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <button
            onClick={handleTestNotification}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                <Icon name="test-tube" className="text-lg text-stone-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Probar notificación</h3>
                <p className="text-sm text-stone-500">Envía una notificación de prueba local</p>
              </div>
            </div>
            <Icon name="caret-right" className="text-stone-400" />
          </button>
        </div>
      )}

      {permission === "denied" && (
        <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
          <div className="flex gap-3">
            <Icon name="warning" className="text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium">Notificaciones bloqueadas</p>
              <p className="mt-1 text-sm text-amber-800">
                Para recibir push, permite las notificaciones en la configuración del navegador.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isInstalled && (
        <div className="rounded-xl bg-teal-50 p-4 text-teal-900">
          <div className="flex gap-3">
            <Icon name="info" className="text-teal-600 mt-0.5" />
            <div>
              <p className="font-medium">Instala la app</p>
              <p className="mt-1 text-sm text-teal-800">
                En iOS, usa &quot;Agregar a inicio&quot; en Safari para push completas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
