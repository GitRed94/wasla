# Wasla — Plan 1B Discovery Design

**Date:** 2026-06-24
**Author:** Redstar
**Status:** Approved ✓
**Follows:** Plan 1A Foundation (complete) + Security Hardening (complete)

---

## 1. Scope

Plan 1B delivers the discovery experience: a user can land on the home page, browse or search for a prestataire by category and wilaya, view a full profile, and send a first contact message. It is fully usable without an account for browsing; an account is required to contact.

**In scope:**
- Home page (hero + search bar + category grid)
- Search results page (`/search`)
- Prestataire profile page (`/prestataire/:id`)
- ContactSheet (bottom sheet — send first message only)
- 10 fake seed prestataires for UI testing
- Static wilaya list (58 wilayas) for dropdowns

**Out of scope (1C+):**
- Full conversation thread and inbox (`/messages`, `/messages/:id`)
- Real-time messaging (Supabase Realtime, read receipts)
- Portfolio photo uploads (prestataires can't upload yet — 1D)
- Commune-level search filtering (1C upgrade)
- Google Maps / geolocation (Phase 3)
- Removing seed data (done at start of 1C)

---

## 2. Pages & Navigation

### 2.1 Home (`/`)

**Hero section:**
- Heading: `home.hero_title` — "Trouvez le bon prestataire près de chez vous"
- Subtitle: `home.hero_subtitle`
- Search bar: category dropdown + wilaya dropdown + submit button
- Submitting navigates to `/search?category=X&wilaya=Y`
- Either field may be left empty (shows all results for the filled field)

**Category grid:**
- 7 cards displayed in a responsive grid (2 cols mobile, 4 cols desktop)
- Each card: emoji + label (from `categories.js`)
- Clicking a card navigates to `/search?category=<key>`

| Key | Emoji | FR label |
|-----|-------|----------|
| plombier | 🔧 | Plombier |
| electricien | ⚡ | Électricien |
| climaticien | ❄️ | Climaticien |
| frigoriste | 🧊 | Frigoriste |
| peintre | 🖌️ | Peintre |
| menuisier | 🪵 | Menuisier |
| informaticien | 💻 | Informaticien |

### 2.2 Search Results (`/search`)

**URL params:** `category` (optional), `wilaya` (optional)

**Filter bar** (sticky, top of page):
- Category dropdown — pre-filled from URL param, options from `categories.js`
- Wilaya dropdown — pre-filled from URL param, options from `wilayas.js`
- Changing either filter updates URL params and re-fetches

**Results grid:**
- 2 cols mobile, 3 cols desktop
- Each result: `PrestaCard` component
- Empty state: `search.no_results` — "Aucun prestataire trouvé dans cette zone."
- Loading state: skeleton cards (3 placeholder cards while fetching)

**PrestaCard displays:**
- Avatar (placeholder image if `avatar_url` is null)
- `display_name`
- Badge chip (`badge_unverified` / `badge_verified` / `badge_trusted`)
- Wilaya
- Up to 3 category tags
- Clicking the card navigates to `/prestataire/:id`

**Supabase query:**
```js
supabase
  .from('prestataire_profiles')
  .select('id, display_name, avatar_url, badge, wilaya, categories')
  .eq('is_visible', true)
  .match(category ? { categories: `{${category}}` } : {})  // array contains
  // wilaya filter applied with .eq('wilaya', wilaya) when present
  .order('created_at', { ascending: false })
```

> Note: Supabase array contains filter uses `.contains('categories', [category])` — exact method confirmed during implementation.

### 2.3 Prestataire Profile (`/prestataire/:id`)

**Fetches:** `prestataire_profiles` joined with `profiles` by `:id`

**Layout (top to bottom):**
1. Avatar (80px, placeholder if null) + display_name + badge chip + wilaya
2. Category tags (all categories, wrapping)
3. Bio text (greyed placeholder if empty)
4. Portfolio section heading + photo grid — empty state: `profile.no_portfolio`
5. Reviews section heading — empty state: `profile.no_reviews` (seed data has no reviews)
6. Sticky bottom bar with "Contacter" button

**"Contacter" button visibility rules:**
| User state | Behaviour |
|-----------|-----------|
| Not logged in | Button shown, clicking redirects to `/login?redirect=/prestataire/:id` |
| Logged in, role = `client` | Button shown, clicking opens ContactSheet |
| Logged in, role = `prestataire` | Button hidden (prestataires don't contact each other) |

**After login redirect:** `/login` reads the `redirect` query param and navigates there after successful auth.

### 2.4 ContactSheet (bottom sheet)

**Trigger:** "Contacter" button on profile page (logged-in client only)

**Behaviour:**
- Slides up from bottom, covers ~60% of screen height
- Background is dimmed (overlay)
- Close button (×) in top-right corner, or tap overlay to close
- Swipe-to-dismiss is a Phase 4 (Capacitor/mobile) enhancement — not implemented in 1B
- Not a separate route — rendered inside PrestaireProfile as conditional JSX

**Contents:**
- Prestataire name + avatar (small, top of sheet)
- Textarea: placeholder `contact.placeholder` — "Décrivez votre besoin en quelques mots..."
- "Envoyer" button (disabled while loading)

**On submit:**
1. Upsert into `conversations` (`client_id` + `prestataire_id`) — reuses existing if UNIQUE constraint fires
2. Insert into `messages` (`conversation_id`, `sender_id` = client, `content`)
3. Show success state: `contact.success` — "Message envoyé !"
4. Auto-close sheet after 1.5s

**Error handling:** If either DB call fails, show `errors.generic` inline in the sheet. Sheet stays open so user can retry.

---

## 3. Data

### 3.1 Static data files

**`src/data/wilayas.js`** — array of 58 wilaya name strings in alphabetical order, used in all wilaya dropdowns.

**`src/data/categories.js`** — array of 7 objects:
```js
{ key: 'plombier', emoji: '🔧', fr: 'Plombier', ar: 'سبّاك', en: 'Plumber' }
```
Single source of truth for categories across home grid, search filters, and profile tags.

### 3.2 Seed data (migration 009)

10 fake prestataires inserted directly into Supabase via SQL — 2 per city:

| City | Wilaya | Prestataires |
|------|--------|-------------|
| Alger | Alger | 1 électricien, 1 plombier |
| Oran | Oran | 1 peintre, 1 informaticien |
| Constantine | Constantine | 1 menuisier, 1 électricien |
| Béjaïa | Béjaïa | 1 climaticien, 1 plombier |
| Mostaganem | Mostaganem | 1 frigoriste, 1 peintre |

Each seed prestataire has:
- A fixed UUID (prefixed `00000000-0000-0000-0000-` for easy identification and bulk delete in 1C)
- A realistic Algerian display name
- A short bio in French
- `badge = 'unverified'`, `is_visible = true`
- `avatar_url = null` (placeholder shown in UI)

Seed data is inserted via `supabase/migrations/009_seed_prestataires.sql`. Removed at the start of 1C with a cleanup migration.

> **Note:** Seeding auth users via SQL requires inserting into `auth.users` directly with `security definer` privileges — confirm this works with the Supabase MCP `apply_migration` tool. If not, seed only `profiles` + `prestataire_profiles` with pre-agreed UUIDs and skip auth user creation.

### 3.3 i18n keys to add

All three locales (FR/AR/EN) must be updated together:

```
search.placeholder       — "Quelle prestation recherchez-vous ?"  (already exists in home keys — reuse)
search.filter_category   — "Catégorie"
search.filter_wilaya     — "Wilaya"
search.no_results        — "Aucun prestataire trouvé dans cette zone."
search.results_count     — "{{count}} prestataire(s) trouvé(s)"
search.all_categories    — "Toutes les catégories"
search.all_wilayas       — "Toutes les wilayas"
profile.contact_btn      — "Contacter"
profile.no_portfolio     — "Aucune photo de portfolio pour le moment."
profile.no_reviews       — "Aucun avis pour le moment."
profile.badge_unverified — "Non vérifié"
profile.badge_verified   — "Vérifié ✓"
profile.badge_trusted    — "Fiable ⭐"
profile.years_exp        — "{{count}} an(s) d'expérience"
contact.placeholder      — "Décrivez votre besoin en quelques mots..."
contact.send             — "Envoyer"
contact.success          — "Message envoyé !"
contact.login_required   — "Connectez-vous pour contacter ce prestataire"
```

---

## 4. New Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/data/wilayas.js` | Static array of 58 Algerian wilaya names |
| Create | `src/data/categories.js` | 7 categories with key, emoji, fr/ar/en labels |
| Create | `src/components/ui/PrestaCard.jsx` | Search result card component |
| Create | `src/components/ui/ContactSheet.jsx` | Bottom sheet with first message form |
| Create | `src/pages/Search.jsx` | Search results page |
| Create | `src/pages/PrestaireProfile.jsx` | Prestataire profile page |
| Modify | `src/pages/Home.jsx` | Replace stub with hero + category grid + search bar |
| Modify | `src/pages/Login.jsx` | Read `redirect` query param, navigate there after auth |
| Modify | `src/App.jsx` | Add `/search` and `/prestataire/:id` routes |
| Modify | `src/locales/fr.json` | Add all new i18n keys |
| Modify | `src/locales/ar.json` | Add all new i18n keys |
| Modify | `src/locales/en.json` | Add all new i18n keys |
| Create | `supabase/migrations/009_seed_prestataires.sql` | Seed 10 fake prestataires |

---

## 5. Testing

Each new component and page gets a Vitest + React Testing Library test:

| Test file | What it covers |
|-----------|---------------|
| `src/__tests__/Home.test.jsx` | Renders hero text, renders 7 category cards with emoji, search bar present |
| `src/__tests__/Search.test.jsx` | Renders filter bar, shows no_results on empty data, renders PrestaCards on mock data |
| `src/__tests__/PrestaCard.test.jsx` | Renders name, badge, wilaya; clicking navigates to profile |
| `src/__tests__/PrestaireProfile.test.jsx` | Renders profile data; shows Contact button for client; hides it for prestataire; redirects if not logged in |
| `src/__tests__/ContactSheet.test.jsx` | Renders textarea + send button; calls supabase on submit; shows success message |

All existing 11 tests must remain green.

---

## 6. Future Considerations

- **Google Maps / Geolocation (Phase 3):** PrestaCard and PrestaireProfile are designed with wilaya text today. In Phase 3, a `coordinates` column will be added to `prestataire_profiles` and a map view will be added to `/search` alongside the card grid. The wilaya dropdown filter will be replaced or supplemented by a radius-based geo search.
- **Commune-level search (1C):** The wilaya dropdown will be extended with a dependent commune dropdown once real data patterns are established.
- **Portfolio photos (1D):** The portfolio section on PrestaireProfile shows an empty state today. In 1D, prestataires will be able to upload photos via Supabase Storage.
