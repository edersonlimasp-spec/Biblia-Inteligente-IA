---
name: Bible reader typography system
description: Font size steps, Newsreader font, Settings popover pattern, and verse column width in BibleReader.tsx
---

## Font size steps

Defined as plain CSS classes in `client/src/index.css` (not Tailwind arbitrary values — those get purged):

```css
.bible-font-small  { font-size: 18px; line-height: 1.55; }
.bible-font-medium { font-size: 20px; line-height: 1.65; }
.bible-font-large  { font-size: 23px; line-height: 1.70; }
.bible-font-xlarge { font-size: 26px; line-height: 1.75; }
```

`use-bible-font-size.ts` returns the class name string; `BibleFontSize` type includes `"xlarge"` as 4th step.
`bibleFontSizeClass()` maps size → class name. Applied to `<p className={…flex-1 font-serif ${verseTextClass}}>`.

**Why:** Tailwind purges `text-[18px]` etc. Custom classes survive purge. `bibleFontSizeClass` was returning Tailwind size utilities before; switching to custom classes gives exact pixel control.

## Newsreader font

`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@...')` at top of `index.css`.
`--font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;` in `:root` (applies to both modes).

## Settings popover pattern

The Settings header button in BibleReader opens a `<Popover>` (not navigates to settings page).
Popover contains 4 font-size step buttons (serif "A" at increasing px) + a divider + "Configurações" link that calls `onNavigateToSettings`. State: `showFontSizePanel` / `setShowFontSizePanel`.

## Verse column width

Reading column: `style={{ maxWidth: "68ch" }}` (not Tailwind max-w-3xl). This keeps prose width comfortable on wide screens.

## Verse number styling

`<span className="font-mono select-none" style={{ fontSize: "12px", color: "#7A6E5C" }}>` — NOT Tailwind text-primary; uses exact muted brown color.
