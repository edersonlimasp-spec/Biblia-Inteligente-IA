---
name: Android TWA status bar color
description: Why native Capacitor status-bar fixes don't affect the published Android app, and what actually controls the top "faixa branca".
---

The published Google Play Android app (`applicationId: app.replit.bibliainteligente.twa`) is a **TWA (Trusted Web Activity)** that loads the live website — NOT the Capacitor WebView in `android/`. So Capacitor `StatusBar.setBackgroundColor`, `MainActivity.java`, and `android/.../styles.xml` edits do **not** change the status bar on the published app.

In a TWA the Android status bar color follows the page's `<meta name="theme-color">`. The recurring top "faixa branca" happens when those metas are `prefers-color-scheme` (system) driven while the app's dark/light is an in-app `.dark` class toggle (ThemeProvider) independent of the system: system=light + app=dark → theme-color stays `#ffffff` → white status bar over dark content.

**Fix pattern:** make `theme-color` follow the *in-app* theme, not the system. ThemeProvider rewrites all `meta[name=theme-color]` (removing `media`, setting `#0c1421` dark / `#ffffff` light) on theme change, plus an early inline script in `index.html` reads `localStorage.theme` before React mounts to avoid a cold-start flash.

**Why:** months of native styles.xml/MainActivity attempts never fixed it because they target the wrong runtime (Capacitor, not the TWA).
