import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./registerSW";
import { initializeCapacitor, isNative } from "./lib/capacitor";
import { getApiUrl } from "./lib/queryClient";

// ========== CLIENT ENVIRONMENT DIAGNOSTICS ==========
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           🌐 CLIENT ENVIRONMENT DIAGNOSTICS                  ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  origin               = ${window.location.origin.slice(0, 35).padEnd(35)} ║`);
console.log(`║  hostname             = ${window.location.hostname.slice(0, 35).padEnd(35)} ║`);
console.log(`║  pathname             = ${window.location.pathname.slice(0, 35).padEnd(35)} ║`);
console.log(`║  MODE                 = ${(import.meta.env.MODE || 'undefined').slice(0, 35).padEnd(35)} ║`);
console.log(`║  DEV                  = ${String(import.meta.env.DEV).slice(0, 35).padEnd(35)} ║`);
console.log(`║  PROD                 = ${String(import.meta.env.PROD).slice(0, 35).padEnd(35)} ║`);
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

// Fetch and log build info from server
fetch(getApiUrl('/api/debug/build-info'))
  .then(res => res.json())
  .then(info => {
    console.log('📌 SERVER BUILD_ID:', info.buildId || 'unknown');
    console.log('📌 SERVER NODE_ENV:', info.nodeEnv || 'unknown');
    console.log('📌 SERVER TIMESTAMP:', info.timestamp || 'unknown');
  })
  .catch(() => console.log('📌 Could not fetch server build info'));

initializeCapacitor();

createRoot(document.getElementById("root")!).render(<App />);

if (!isNative) {
  registerServiceWorker();
}
