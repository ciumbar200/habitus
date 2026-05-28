/**
 * Notification Service for : moon shared living
 * OneSignal Web SDK v16 — init en index.html; aquí solo operaciones vía OneSignalDeferred.
 */

import { useEffect, useState } from 'react';

export const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID ?? "8ab2d231-41db-49a5-9543-eac1df3986b4";

type OneSignalInstance = {
  Notifications: {
    requestPermission: () => Promise<void>;
    permission: boolean;
    permissionNative?: NotificationPermission;
  };
  User: {
    onesignalId?: string | null;
    PushSubscription?: { optedIn?: boolean };
    addTags: (tags: Record<string, string>) => void;
  };
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Slidedown?: { promptPush: (opts?: { force?: boolean }) => Promise<void> };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>;
  }
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
}

export interface OneSignalUser {
  subscriptionId: string;
  subscribed: boolean;
}

function runWithOneSignal<T>(fn: (oneSignal: OneSignalInstance) => Promise<T> | T): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('OneSignal no disponible en SSR'));
      return;
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        resolve(await fn(OneSignal));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function isOneSignalEnabled(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'moonsharedliving.com';
}

class NotificationService {
  private ready = false;
  private permission: NotificationPermission = 'default';
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /** Espera a que el SDK esté inicializado (index.html). */
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!isOneSignalEnabled()) return false;
    if (this.ready) return true;

    try {
      await runWithOneSignal((OneSignal) => {
        const native = OneSignal.Notifications?.permissionNative;
        if (native) this.permission = native;
        this.ready = true;
      });
      return this.ready;
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!isOneSignalEnabled()) return false;
    if (!this.isSupported) return false;
    if (this.permission === 'granted') return true;
    if (this.permission === 'denied') return false;

    try {
      await this.initialize();
      await runWithOneSignal(async (OneSignal) => {
        await OneSignal.Notifications.requestPermission();
        this.permission =
          OneSignal.Notifications.permissionNative ?? Notification.permission;
      });
      return Notification.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getSubscription(): Promise<OneSignalUser | null> {
    if (!isOneSignalEnabled()) return null;
    await this.initialize();
    try {
      return await runWithOneSignal((OneSignal) => {
        const id = OneSignal.User?.onesignalId;
        const subscribed = !!OneSignal.User?.PushSubscription?.optedIn;
        if (typeof id !== 'string' || !id) return null;
        return { subscriptionId: id, subscribed };
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!isOneSignalEnabled()) return false;
    try {
      await this.initialize();
      return await runWithOneSignal(
        (OneSignal) => !!OneSignal.User?.PushSubscription?.optedIn,
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  async setExternalId(externalId: string): Promise<void> {
    if (!isOneSignalEnabled()) return;
    await this.initialize();
    try {
      await runWithOneSignal((OneSignal) => OneSignal.login(externalId));
    } catch (error) {
      console.error('Error setting external ID:', error);
    }
  }

  async removeExternalId(): Promise<void> {
    if (!isOneSignalEnabled()) return;
    await this.initialize();
    try {
      await runWithOneSignal((OneSignal) => OneSignal.logout());
    } catch (error) {
      console.error('Error removing external ID:', error);
    }
  }

  async setTags(tags: Record<string, string>): Promise<void> {
    await this.initialize();
    try {
      await runWithOneSignal((OneSignal) => {
        OneSignal.User.addTags(tags);
      });
    } catch (error) {
      console.error('Error setting tags:', error);
    }
  }

  async sendTestNotification(payload: NotificationPayload): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/brand/moon-logo-black.png',
        badge: payload.badge || '/brand/moon-logo-black.png',
        data: payload.data,
        tag: 'moon-notification',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  async showPrompt(): Promise<void> {
    await this.initialize();
    try {
      await runWithOneSignal(async (OneSignal) => {
        await OneSignal.Slidedown?.promptPush();
      });
    } catch (error) {
      console.error('Error showing prompt:', error);
    }
  }

  async isInstallable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    // @ts-expect-error beforeinstallprompt
    return !!window.deferredPrompt;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      // @ts-expect-error beforeinstallprompt
      const promptEvent = window.deferredPrompt;
      if (!promptEvent) return false;
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      // @ts-expect-error beforeinstallprompt
      window.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS standalone
      window.navigator.standalone === true
    );
  }

  async getOneSignalUserId(): Promise<string | null> {
    await this.initialize();
    try {
      const id = await runWithOneSignal((OneSignal) => OneSignal.User?.onesignalId ?? null);
      return typeof id === 'string' && id.length > 0 ? id : null;
    } catch (error) {
      console.error('Error getting OneSignal user ID:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus(),
  );
  const [isInstalled, setIsInstalled] = useState(notificationService.isInstalled());
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAndCheck = async () => {
      await notificationService.initialize();
      if (!mounted) return;

      setPermission(notificationService.getPermissionStatus());

      navigator.permissions
        ?.query({ name: 'notifications' as PermissionName })
        .then((result) => {
          result.addEventListener('change', () => {
            setPermission(notificationService.getPermissionStatus());
          });
        })
        .catch(() => undefined);

      const isSubscribed = await notificationService.isSubscribed();
      if (mounted) setSubscribed(isSubscribed);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(notificationService.isInstalled());
      });
    };

    void initAndCheck();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    permission,
    isSupported: notificationService.isNotificationSupported(),
    isInstalled,
    subscribed,
    checkSubscribed: () => notificationService.isSubscribed(),
    initialize: () => notificationService.initialize(),
    requestPermission: () => notificationService.requestPermission(),
    getSubscription: () => notificationService.getSubscription(),
    setExternalId: (id: string) => notificationService.setExternalId(id),
    removeExternalId: () => notificationService.removeExternalId(),
    setTags: (tags: Record<string, string>) => notificationService.setTags(tags),
    sendTestNotification: (payload: NotificationPayload) =>
      notificationService.sendTestNotification(payload),
    isInstallable: () => notificationService.isInstallable(),
    showInstallPrompt: () => notificationService.showInstallPrompt(),
    getOneSignalUserId: () => notificationService.getOneSignalUserId(),
  };
}
