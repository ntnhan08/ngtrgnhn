# EYECORE LABS — Offline-First Personal Contact Vault

A cartoon nature-school contact vault. Every byte of data — contacts, photos, settings, bank
details — lives **on your device** in IndexedDB. No backend, no account, no cloud, no analytics,
and no network request is ever required to use the app.

> 📁 **Muốn hiểu từng file?** Xem [`STRUCTURE.md`](./STRUCTURE.md) — sơ đồ cây, kiến trúc phân
> tầng, vai trò từng file và các luồng dữ liệu.
> 🛠 **Muốn đổi thông tin cá nhân?** Xem [`CONFIGURATION.md`](./CONFIGURATION.md).

## Feature highlights

- **Cinematic eye intro** — the eye blinks three times dead-centre of the sun circle, flips into
  the “O” of EYECORE, letters pop one by one (the O is the eye), the underline sweeps, a strict
  2s hold, then a dissolve into the app. Pure HTML+CSS — painted before any JS executes.
- **Owner identity card** driven entirely by `public/config/config.json` (no code edits needed)
- **Unlimited contacts** with photos, education, work, bank, birthday, address, notes and 12 social networks
- **Icon-only social links** (Facebook, Instagram, TikTok, YouTube, GitHub, LinkedIn, Zalo, X, Discord, Telegram, Threads, Snapchat) — URLs never displayed
- **Visibility system** — disabled fields are conditionally removed from the DOM everywhere
- **Privacy Mode** — one-tap masking of phones, emails and bank numbers with smooth animation
- **Bank card** — masked by default (`•••• •••• 6789`), explicit Show + Copy with “Copied!” feedback
- **Instant local search** (diacritic-insensitive, Vietnamese-friendly), animated filters, 7 sort modes
- **Grid / list layouts** with dissolve crossfades, subtle 3D card tilt (desktop only)
- **Living sky backdrop** — smiling sun, rainbow, drifting clouds, flapping birds, paper plane,
  hot-air balloon, kite, butterflies, a bee, a snail, apple trees, mushrooms, flowers, falling
  leaves and sparkles — with pointer parallax
- **Backup / restore** as ZIP (`contacts.json` + `settings.json` + `images/`) via JSZip
- **PWA** — installable, service-worker cached, launches fully offline after first visit

## Quick start

```bash
npm install
npm run dev      # local development
npm run build    # production build → dist/
```

Serve `dist/` with any static file server (Vercel config included via `vercel.json`). The service
worker requires a proper HTTP origin (localhost works).

## Architecture

```
config.json  →  configuration layer   (defaults, user-editable)
IndexedDB    →  data layer            (Dexie: contacts, images, settings)
Zustand      →  state layer           (appStore, contactsStore, settingsStore, uiStore)
React        →  presentation layer
Framer Motion→  animation layer
```

**Startup order:** load `config.json` → validate + merge over safe defaults → load IndexedDB
settings & contacts → seed demo data on first launch → render.

**Golden rule:** `config.json` is the *default configuration source*; IndexedDB is the *runtime
data source*. Editing a contact in the UI writes to IndexedDB only — the app never modifies
`config.json`.

## Changing your personal information

Open **`public/config/config.json`** and edit the `profile` block (name, phone, email, school,
work, bank…). Reload the app — changes appear immediately; no rebuild required during development,
and in production just replace `dist/config/config.json` (the service worker fetches it
network-first, falling back to cache offline). A full field reference lives in
[`CONFIGURATION.md`](./CONFIGURATION.md).

- **Hide a field everywhere:** set the matching `visibility.*` flag to `false` — the section is
  removed from the DOM entirely (cards, profile, metadata) and the layout reflows.
- **Social networks:** set `enabled: true` and a `url`. Icons render only when both are present.
- **Avatar:** point `profile.avatar` at a locally bundled image, or leave it empty for the
  generated monogram sticker.

## Performance & smoothness

- The intro is **pure HTML+CSS** — painted before any JavaScript executes; React only dissolves
  it out at the exact moment the sequence (eye → letters → underline → 2s hold) completes.
- Home/Contacts/Profile/Form/Settings are **code-split**; chunks prefetch while the intro plays.
- The living sky scene **freezes** under the intro and the full-profile blur, so those overlays
  composite one static frame and scroll at a steady 60fps.
- All transitions are **dissolves** (opacity-only) on GPU-promoted layers; pointer effects are
  rAF-gated; search uses `useDeferredValue`.

## Offline & PWA

- `public/sw.js` — cache-first service worker; app shell cached on install, hashed assets cached
  at runtime, `config.json` network-first with offline fallback. After the first visit the app
  launches with **zero** network access.
- Fonts (Baloo 2 + Nunito, Vietnamese subsets) bundled via `@fontsource-variable/*`; every icon
  is inline SVG. Online and offline UIs are identical by design (no offline banner, ever).

## Privacy

No telemetry, no analytics, no external logging, no remote fonts/icons/APIs. Sensitive values
(bank accounts, phones, emails) are masked by default and in Privacy Mode. Clearing site data
removes everything.

## Database schema (Dexie `eyecore-labs-db` v1)

| Table      | Keys                                                      | Content                          |
| ---------- | --------------------------------------------------------- | -------------------------------- |
| `contacts` | `id`, `fullName`, `relationship`, `createdAt`, `updatedAt` | ContactRecord documents           |
| `images`   | `id`, `createdAt`                                          | `{ id, blob, mime, ext }`        |
| `settings` | `id`                                                       | theme, layout, animation, privacy |
