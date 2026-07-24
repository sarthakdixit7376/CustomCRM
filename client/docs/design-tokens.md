# Design Tokens

Reference: BAFI dashboard mock (blue primary, pastel status accents, soft cards).

Source of truth for actual values is [`src/index.css`](../src/index.css) — the
`@theme` block there defines these as CSS custom properties, which Tailwind v4
turns into utility classes automatically (e.g. `bg-primary-600`, `text-text-muted`,
`rounded-lg`, `shadow-card`). This file is the human-readable reference; if the
two ever disagree, `index.css` wins.

## Neutrals

Text, surfaces, borders.

| Token | Hex | Use |
|---|---|---|
| `neutral-0` | `#ffffff` | Card / surface background |
| `neutral-50` | `#f8f9fb` | Page background |
| `neutral-100` | `#f1f3f6` | Muted surface |
| `neutral-200` | `#e5e8ee` | Borders / dividers |
| `neutral-300` | `#d6dae3` | Stronger border |
| `neutral-400` | `#a6adbb` | Disabled / placeholder |
| `neutral-500` | `#7c8494` | Secondary text |
| `neutral-600` | `#5b6473` | Muted heading text |
| `neutral-700` | `#414a5a` | Body text (secondary emphasis) |
| `neutral-800` | `#262e3d` | Body text (strong) |
| `neutral-900` | `#12161f` | Primary text / headings |

## Primary

Brand blue — "+ New" button, active nav item, links, logo.

| Token | Hex |
|---|---|
| `primary-50` | `#eef2ff` |
| `primary-100` | `#e0e7ff` |
| `primary-200` | `#c7d2fe` |
| `primary-300` | `#a5b4fc` |
| `primary-400` | `#7c90f5` |
| `primary-500` | `#4f69ee` |
| `primary-600` | `#3654e0` |
| `primary-700` | `#2b41b8` |
| `primary-800` | `#1f3190` |
| `primary-900` | `#16215f` |

## Status / data accents

Each has a `50`/`100` pastel step (pill backgrounds, stat-icon backgrounds) and a
`500`/`600` step (icon glyph, pill text, chart series).

| Color | 50 | 100 | 500 | 600 | Maps to in the reference |
|---|---|---|---|---|---|
| `success` | `#eafbf1` | `#d3f5e0` | `#17a860` | `#12934f` | Policies Sold icon, "Won" pipeline stage, up-trend deltas |
| `info` | `#eaf3ff` | `#d6e8ff` | `#2e7bf6` | `#1868e0` | Quotes Sent icon, "New" / "Contacted" pills, This Week |
| `violet` | `#f5f0ff` | `#eae0fe` | `#8b5cf6` | `#7440e8` | New Leads icon, "Negotiation" pill, New Lead stage |
| `amber` | `#fff6e8` | `#ffeacb` | `#f5a524` | `#db8b0e` | "Quote Sent" pill, Revenue icon, Today tasks |
| `teal` | `#e7fbf7` | `#cdf6ee` | `#14b8a6` | `#0e9c8c` | Secondary chart accent |
| `danger` | `#feeeee` | `#fcd9d9` | `#ef4444` | `#dc2626` | Overdue tasks, notification dot, destructive actions |

## Semantic aliases

| Token | Resolves to | Use |
|---|---|---|
| `surface` | `neutral-0` | Card/panel background |
| `surface-muted` | `neutral-50` | Page background |
| `border` | `neutral-200` | Default border color |
| `text` | `neutral-900` | Default text color |
| `text-muted` | `neutral-500` | Secondary/caption text |

## Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | `6px` | Icon chips, small controls |
| `radius-md` | `10px` | Inputs, nav items, pipeline segments |
| `radius-lg` | `14px` | Cards, stat tiles |
| `radius-xl` | `18px` | Modals, large panels |
| `radius-pill` | `999px` | Status pills, avatars |

## Shadow

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)` | Stat tiles, list cards, chart panels |
| `shadow-dropdown` | `0 4px 6px rgba(16,24,40,.05), 0 10px 15px rgba(16,24,40,.08)` | Menus, popovers, modals |

## Font

`Inter` (falls back to `ui-sans-serif, system-ui, -apple-system, sans-serif`) —
matches the clean grotesque used throughout the reference mock.
