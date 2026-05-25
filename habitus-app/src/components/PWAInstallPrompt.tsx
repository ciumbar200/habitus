import { useEffect, useState } from 'react';
import { notificationService } from '../services/notifications';
import { Icon } from './Icon';

export function PWAInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkInstallable = async () => {
      const installable = await notificationService.isInstallable();
      const isInstalled = notificationService.isInstalled();

      setCanInstall(installable && !isInstalled);

      // Show prompt after delay if installable and not dismissed
      if (installable && !isInstalled && !dismissed) {
        const timer = setTimeout(() => {
          const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
          if (!hasSeenPrompt) {
            setShowPrompt(true);
          }
        }, 5000);

        return () => clearTimeout(timer);
      }
    };

    checkInstallable();

    // Listen for app installed event
    const handleAppInstalled = () => {
      setCanInstall(false);
      setShowPrompt(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    const success = await notificationService.showInstallPrompt();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-seen', 'true');
  };

  if (!canInstall || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96 animate-fade-in-up">
      <div className="rounded-2xl bg-stone-900 p-4 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-accent to-emerald-600">
            <Icon name="download-simple" className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Instalar : moon</h3>
            <p className="mt-1 text-sm text-stone-400">
              Instala la app para una mejor experiencia con acceso rápido y notificaciones.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-stone-500 hover:text-stone-400 transition-opacity active:opacity-70"
            aria-label="Cerrar"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90 active:opacity-70"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:text-stone-300 active:opacity-70"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);

      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (
        Notification.permission === 'default' &&
        !hasSeenPrompt &&
        !dismissed
      ) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 10000); // Show after 10 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [dismissed]);

  const handleEnable = async () => {
    await notificationService.initialize();
    const granted = await notificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  if (permission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96 animate-fade-in-up">
      <div className="rounded-2xl bg-stone-900 p-4 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta to-terracotta-dark">
            <Icon name="bell" className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Activa las notificaciones</h3>
            <p className="mt-1 text-sm text-stone-400">
              Recibe alertas sobre nuevos compañeros, mensajes y actualizaciones de interés.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-stone-500 hover:text-stone-400 transition-opacity active:opacity-70"
            aria-label="Cerrar"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleEnable}
            className="flex-1 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-70"
          >
            Activar
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:text-stone-300 active:opacity-70"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick install button for settings page
export function InstallAppButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      await notificationService.initialize();
      const installable = await notificationService.isInstallable();
      const installed = notificationService.isInstalled();
      setCanInstall(installable && !installed);
      setIsInstalled(installed);
    };

    checkStatus();

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });
  }, []);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
        <Icon name="check-circle" className="text-emerald-600" />
        <span className="text-sm font-medium">App instalada</span>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={() => notificationService.showInstallPrompt()}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-stone-200 px-4 py-3 font-semibold text-stone-900 transition-colors hover:bg-stone-50 active:bg-stone-100 active:opacity-80"
    >
      <Icon name="download-simple" />
      Instalar app
    </button>
  );
}
