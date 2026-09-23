import { useEffect, useState } from "react";
import { detectDownloadDevice, STORE_LINKS, trackStoreDownload } from "@/lib/google-ads";
import "./DownloadPage.css";

type Store = "android" | "ios";

const STORES: Record<Store, {
  label: string;
  subtitle: string;
  href: string;
}> = {
  android: {
    label: "Baixar no Google Play",
    subtitle: "Android",
    href: STORE_LINKS.android,
  },
  ios: {
    label: "Baixar na App Store",
    subtitle: "iPhone e iPad",
    href: STORE_LINKS.ios,
  },
};

export function detectStore(userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""): Store {
  if (detectDownloadDevice(userAgent) === "ios") {
    return "ios";
  }
  return "android";
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setDownloadMetadata() {
  const description = "Bíblia com IA, Strong em hebraico e grego e ferramentas para estudar as Escrituras.";
  const preview = `${window.location.origin}/download-preview.png`;

  document.title = "Bíblia Inteligente IA";
  setMeta("name", "description", description);
  setMeta("property", "og:title", "Bíblia Inteligente IA");
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:url", `${window.location.origin}/baixar`);
  setMeta("property", "og:image", preview);
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", "Bíblia Inteligente IA");
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", preview);
  setMeta("name", "theme-color", "#EBE5D9");
}

function StoreIcon({ store }: { store: Store }) {
  if (store === "ios") {
    return (
      <svg className="download-store-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-.1-2.2-1.1-3.3-1.1-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.7 2.1 1.1 0 1.6-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-.9 2.7-2 .8-1.1 1.1-2.2 1.2-2.3-.1 0-2.5-1-2.5-4.1Zm-2.2-5.7c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.2Z" />
      </svg>
    );
  }
  return (
    <svg className="download-store-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#34A853" d="m2.4 3.2 11.2 8.8L2.4 20.8c-.3-.4-.4-.9-.4-1.5V4.7c0-.6.1-1.1.4-1.5Z" />
      <path fill="#FBBC04" d="m15 12 3.1-2.4 3.7 2.1c1 .6 1 1.9 0 2.5l-3.7 2.1L15 12Z" />
      <path fill="#EA4335" d="m2.4 3.2 13.8 7.9L13.6 12 2.4 3.2Z" />
      <path fill="#4285F4" d="m2.4 20.8 13.8-7.9-2.6-1.9-11.2 9.8Z" />
    </svg>
  );
}

export function DownloadPage() {
  const [preferredStore] = useState<Store>(detectStore);
  const stores = preferredStore === "ios" ? (["ios", "android"] as Store[]) : (["android", "ios"] as Store[]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousTheme = document.documentElement.className;
    setDownloadMetadata();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.body.classList.add("download-page-body");

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousTheme;
      document.body.classList.remove("download-page-body");
    };
  }, []);

  return (
    <main className="download-page" aria-labelledby="download-title">
      <section className="download-card">
        <img
          className="download-app-icon"
          src="/biblia-store-icon-512.png"
          alt="Ícone da Bíblia Inteligente IA"
        />
        <h1 id="download-title">Bíblia Inteligente IA</h1>
        <p className="download-description">Baixe na loja do seu aparelho. É gratuito para começar.</p>
        <div className="download-store-list">
          {stores.map((store) => {
            const item = STORES[store];
            const isFeatured = store === preferredStore;
            return (
              <a
                key={store}
                className={`download-store-button${isFeatured ? " is-featured" : ""}`}
                href={item.href}
                onClick={trackStoreDownload}
                target="_blank"
                rel="noopener noreferrer"
              >
                <StoreIcon store={store} />
                <span className="download-store-copy">
                  <span className="download-store-label">{item.label}</span>
                  <span className="download-store-subtitle">{item.subtitle}</span>
                </span>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}