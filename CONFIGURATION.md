# config.json — Field Reference

Edit `public/config/config.json` (or `dist/config/config.json` in production) and reload.
Wrong-typed values are reported on a local error screen and safely replaced with defaults, so the
app never crashes. A clean template lives in `public/config/config.example.json`.

## app

| Field | Type | Description |
| --- | --- | --- |
| `app.name` | string | Application name shown in titles and footers. |
| `app.version` | string | Version displayed in Settings → Application. |
| `app.description` | string | Subtitle/description of the vault. |

## profile — the owner identity card

| Field | Type | Description |
| --- | --- | --- |
| `profile.avatar` | string | Local image path. Empty → generated monogram sticker. JPG/PNG/WEBP/AVIF. |
| `profile.fullName` | string | Your display name. |
| `profile.phone` | string | Your phone number. |
| `profile.email` | string | Your email address. |
| `profile.education.school` | string | School name. |
| `profile.education.major` | string | Field of study. |
| `profile.education.year` | string | Attendance years, e.g. `"2026 - Present"`. |
| `profile.work.company` | string | Employer. |
| `profile.work.position` | string | Job title. |
| `profile.relationship.status` | `"single" \| "dating" \| "married" \| "complicated" \| "unknown"` | Relationship badge on your card. |
| `profile.bank.bankName` | string | Bank name (any string; Vietnamese banks suggested in the form). |
| `profile.bank.accountNumber` | string | Account number — masked by default; see `reveal` below. |
| `profile.birthday` | string | `YYYY-MM-DD`. |
| `profile.address` | string | Home address, free text. |
| `profile.notes` | string | Free-form notes. |

## visibility — show/hide per surface

Each field has two independent flags instead of one:

| Flag | Controls |
| --- | --- |
| `home` | The compact card — owner's Home screen and contact cards in the vault list. |
| `full` | The expanded "View full profile" page. |

```json
"birthday": { "home": false, "full": true }
```

`false` removes the field from the rendered DOM entirely (never `visibility:hidden`) — the layout
reflows; nothing is left as an empty gap. Data itself remains untouched in IndexedDB. A field can
be home-only, full-only, both, or neither.

Keys: `phone` · `email` · `education` (school) · `major` · `work` (section) · `company` ·
`position` · `relationship` · `bank` (section) · `bankName` · `bankAccount` · `birthday` ·
`address` · `notes`

## reveal — full digits vs masked

```json
"reveal": { "phone": false, "bankAccount": false }
```

Controls whether the phone number and bank account show their **full digits** (`true`) or stay
**masked with dots** (`false`) wherever `visibility` already allows them to appear at all. This is
the owner's policy, set once here — it is independent of the viewer's own privacy-mode toggle
(the eye icon), which can still force masking on top of `true`, but can never un-mask a field set
to `false` here. Both must allow reveal for the full value to actually show.

## social — icon-only links

For each network: `{ "enabled": boolean, "url": string }`.

- `enabled: false` **or** empty `url` → the icon is not rendered at all.
- URLs are **never displayed**; hovering shows only the network name tooltip.
- Supported keys: `facebook`, `instagram`, `tiktok`, `youtube`, `github`, `linkedin`, `zalo`,
  `x`, `discord`, `telegram`, `threads`, `snapchat`.

## features — capability switches

`search`, `filter`, `sorting`, `backup`, `import`, `privacyMode`, `darkMode`, `lightMode`,
`timeline` — all booleans. Disabling one removes the corresponding control from the UI.

## appearance — defaults

| Field | Values | Description |
| --- | --- | --- |
| `appearance.defaultTheme` | `"dark" \| "light" \| "system"` | Initial theme (the user's later choice, stored in IndexedDB, wins). |
| `appearance.defaultLayout` | `"grid" \| "list"` | Initial directory layout. |
| `appearance.animations` | boolean | `false` starts the vault in Reduced motion. |
| `appearance.cardTilt` | boolean | Enables the subtle 3D card tilt (desktop, fine pointer, full motion only). |
| `appearance.glassEffect` | boolean | `false` removes glass shadows from surfaces. |