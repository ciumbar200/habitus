interface ServiceWorkerRegistrationOptions {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

export function registerSW(options?: ServiceWorkerRegistrationOptions) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const { onUpdate, onSuccess } = options || {};

  navigator.serviceWorker
    .register('/sw.js', {
      scope: '/',
    })
    .then((registration) => {
      swRegistration = registration;

      // Detect Service Worker update
      registration.addEventListener('updatefound', () => {
        if (!registration.installing) return;

        registration.installing.addEventListener('statechange', () => {
          if (!registration.waiting) return;

          if (navigator.serviceWorker.controller) {
            onUpdate?.(registration);
          } else {
            onSuccess?.(registration);
          }
        });
      });

      // Periodic update check (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      console.log('SW registered:', registration);
    })
    .catch((error) => {
      console.error('SW registration failed:', error);
    });
}

export function getSWRegistration() {
  return swRegistration;
}

export function waitForSWActivation(): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker) {
      reject(new Error('Service Worker not supported'));
      return;
    }

    if (swRegistration?.active) {
      resolve(swRegistration);
      return;
    }

    navigator.serviceWorker.ready.then(resolve).catch(reject);
  });
}
