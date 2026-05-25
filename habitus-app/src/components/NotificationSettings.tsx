import { useState, useEffect } from 'react';
import { notificationService } from '../services/notifications';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        await notificationService.initialize();
        setPermission(notificationService.getPermissionStatus());
        setIsInstalled(notificationService.isInstalled());
        const subscribed = await notificationService.isSubscribed();
        setIsSubscribed(subscribed);
      } catch (err) {
        console.warn('Notification settings unavailable:', err);
      }
    };

    loadState();

    navigator.permissions?.query({ name: 'notifications' as PermissionName }).then((result) => {
      result.addEventListener('change', () => {
        setPermission(notificationService.getPermissionStatus());
      });
    }).catch(() => undefined);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    const granted = await notificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');

    if (granted) {
      const subscribed = await notificationService.isSubscribed();
      setIsSubscribed(subscribed);

      // Set external ID to link with Supabase user
      if (user?.id) {
        await notificationService.setExternalId(user.id);

        // Set user role as a tag for segmentation
        // We'll need to get the profile role, but for now just mark as logged in
        await notificationService.setTags({
          user_type: 'authenticated',
          app: 'moon_shared_living',
        });
      }
    }
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    await notificationService.sendTestNotification({
      title: ': moon shared living',
      body: '¡Notificación de prueba! Todo funciona correctamente.',
      icon: '/brand/moon-logo-black.png',
      badge: '/brand/moon-logo-black.png',
    });
  };


  return (
    <div className={`space-y-4 ${className}`}>
      {/* Install Status */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isInstalled ? 'bg-emerald-100' : 'bg-stone-100'
            }`}>
              <Icon
                name={isInstalled ? 'check-circle' : 'device-mobile'}
                className={`text-lg ${isInstalled ? 'text-emerald-600' : 'text-stone-500'}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">App instalada</h3>
              <p className="text-sm text-stone-500">
                {isInstalled
                  ? 'La app está instalada en tu dispositivo'
                  : 'Instala la app para una mejor experiencia'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Permission */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                permission === 'granted'
                  ? 'bg-emerald-100'
                  : permission === 'denied'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
              }`}
            >
              <Icon
                name="bell"
                className={`text-lg ${
                  permission === 'granted'
                    ? 'text-emerald-600'
                    : permission === 'denied'
                      ? 'text-red-600'
                      : 'text-amber-600'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Notificaciones</h3>
              <p className="text-sm text-stone-500">
                {permission === 'granted'
                  ? 'Las notificaciones están activadas'
                  : permission === 'denied'
                    ? 'Las notificaciones están bloqueadas'
                    : 'Activa las notificaciones para recibir alertas'}
              </p>
            </div>
          </div>
          {permission === 'default' && (
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

      {/* Push Subscription Status */}
      {permission === 'granted' && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isSubscribed ? 'bg-emerald-100' : 'bg-stone-100'
                }`}
              >
                <Icon
                  name="broadcast"
                  className={`text-lg ${isSubscribed ? 'text-emerald-600' : 'text-stone-500'}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Notificaciones push</h3>
                <p className="text-sm text-stone-500">
                  {isSubscribed
                    ? 'Suscrito a notificaciones push'
                    : 'Configurando suscripción...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Notification */}
      {permission === 'granted' && (
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
                <p className="text-sm text-stone-500">
                  Envía una notificación de prueba
                </p>
              </div>
            </div>
            <Icon name="caret-right" className="text-stone-400" />
          </button>
        </div>
      )}

      {/* Info Messages */}
      {permission === 'denied' && (
        <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
          <div className="flex gap-3">
            <Icon name="warning" className="text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium">Notificaciones bloqueadas</p>
              <p className="mt-1 text-sm text-amber-800">
                Para recibir notificaciones, ve a la configuración de tu navegador y permite las
                notificaciones para este sitio.
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
                Para recibir notificaciones push completas, instala la app en tu dispositivo.
                En iOS, usa la opción &quot;Agregar a inicio&quot; en Safari.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
