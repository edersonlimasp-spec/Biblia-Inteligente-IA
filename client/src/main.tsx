import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./registerSW";
import { initializeCapacitor, isNative } from "./lib/capacitor";

initializeCapacitor();

createRoot(document.getElementById("root")!).render(<App />);

if (!isNative) {
  registerServiceWorker();
}
