---
name: Dev splash blocks app_preview screenshots
description: Why app_preview screenshots of this app always land on the splash, and how to actually verify the dashboard visually.
---

The app shows a React splash overlay (centered book logo on `bg-background`) while booting. It is gated by `sessionStorage('hasVisitedApp')` and dismissed by a ~2000ms timer plus auth `isLoading`.

**Problem:** every `app_preview` screenshot opens a fresh browser session, so `sessionStorage` is always empty and the 2s splash restarts on each capture. The capture window consistently lands ON the splash, so you cannot screenshot the dashboard (or any post-splash screen) by simply waiting + re-capturing — a server-side `sleep` doesn't help because the next screenshot reloads the page from scratch.

**Also:** dark mode is driven by a ThemeProvider toggle (localStorage, defaults to light). `app_preview` can't click the toggle, so dark-mode screens can't be captured this way either.

**How to apply:** don't burn attempts trying to time the splash. To verify visual/theme changes, rely on: (1) the dev workflow logs being clean (Tailwind/JSX classes compile), (2) WCAG contrast reasoning, and (3) the architect review. If a true rendered screenshot is essential, you'd need to bypass the splash gate in code (out of scope for a styling task) or use the mockup-sandbox to render the component in isolation.
