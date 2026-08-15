export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // In development we must NOT use a service worker: its cache-first strategy
  // for JS/CSS serves stale assets and hides code changes in the preview.
  // Unregister any previously-installed SW and wipe its caches so the dev
  // preview always reflects the latest code. The SW still runs in production.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);

        // Check for updates every minute
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[App] New SW installed, reloading page...');
              // New SW is ready - reload page to get latest version
              window.location.reload();
            }
          });
        });

        // Listen for SW becoming active
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[App] New SW controller detected');
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed:', registrationError);
      });
  });
}
