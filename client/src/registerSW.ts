export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
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
}
