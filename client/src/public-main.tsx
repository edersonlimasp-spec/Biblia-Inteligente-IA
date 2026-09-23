import { createRoot } from "react-dom/client";
import { DownloadPage } from "@/pages/DownloadPage";
import { OfferPage } from "@/pages/OfferPage";

// Public campaign pages do not load the app shell, auth SDK or paid features.
export function renderPublicPage(path: string): void {
  createRoot(document.getElementById("root")!).render(
    path === "/oferta" ? <OfferPage /> : <DownloadPage />,
  );
}