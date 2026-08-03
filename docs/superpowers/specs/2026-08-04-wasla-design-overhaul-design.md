# Wasla — Design Overhaul (Design Spec)
**Date:** 2026-08-04
**Status:** Draft — pending user review
**Referred to in conversation as:** "Plan 1D" (note: `docs/superpowers/plans/2026-06-25-wasla-1d-fix-polish.md` already exists and is already implemented — this is a distinct, later piece of work. Final plan-doc numbering to be settled when this moves to `writing-plans`.)

---

## 1. Goal

Restyle the existing Wasla app (all pages, all existing functionality) to a new visual design system: clean, minimal, trustworthy — in the style of Uber / Airbnb / Doctolib — rather than the current default-Tailwind look. Also restructure the two profile pages with a tabbed ("ribbon") layout and upgrade the password-change flow. No new backend features, no new data fields, no new integrations.

## 2. Non-goals (explicitly out of scope — next plan)

- Trust badges beyond the existing `unverified`/`verified`/`trusted` badge (no "Disponible aujourd'hui", "Intervention rapide")
- WhatsApp / one-click-call contact buttons
- Payment method display (BaridiMob / CIB / cash)
- Geolocation
- Ratings/reviews UI (no rating data currently rendered anywhere in the app — would require new UI against the existing `reviews` table, which is a feature addition, not a restyle)

These come from the same brainstorming conversation as this design and should become the next plan immediately after this one ships.

## 3. Design tokens

Tailwind v4's `@theme` directive in `src/index.css` (currently just `@import "tailwindcss"` plus one base-layer rule) defines the palette as CSS variables, replacing scattered `bg-blue-600`/`text-gray-*` literals across ~15 files:

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#2563EB` | primary actions, links, active nav state |
| `--color-secondary` | `#10B981` | availability/success/validation signals |
| `--color-surface` | `#FFFFFF` | page background |
| `--color-surface-muted` | `#F3F4F6` | cards, secondary backgrounds |
| `--color-text` | `#1F2937` | body text |
| `--radius-card` | `18px` | card corner radius |
| `--font-sans` | `"Inter", "Noto Kufi Arabic", sans-serif` | all text; Arabic fallback because Inter has no Arabic glyphs |

Font loaded via `@font-face` (self-hosted) or a Google Fonts `@import` — implementation detail for the plan, not a design decision. Shadows use Tailwind's built-in `shadow-sm` (already matches the brief, no new token needed).

## 4. Shared UI kit (`src/components/ui/`)

New primitives so every page composes shared building blocks instead of re-implementing card/tab/button markup:

| Component | Responsibility |
|---|---|
| `Button.jsx` | `primary` (solid blue) / `secondary` (white + blue outline) variants, disabled/loading state |
| `Card.jsx` | Rounded (`--radius-card`) + `shadow-sm` wrapper |
| `Tabs.jsx` | The "ribbon" — horizontal tab strip, local state only (no route change) |
| `BottomNav.jsx` | Fixed bottom tab bar, mobile-only, role-aware (see §7) |
| `Badge.jsx` | Small pill label — restyles the existing badge concept, no new badge types |
| `Skeleton.jsx` | Loading placeholder shape, used while data fetches |

`SelectField.jsx` (existing) is restyled with the new tokens, not rebuilt. `PrestaCard.jsx` (existing) is restyled to compose `Card` + `Badge`.

## 5. Icons

Add `lucide-react` as a new dependency. Used everywhere icons currently appear, **including category icons** (replacing the emoji set like ❄️🔌🚿🪚🎨 in `src/data/categories.js` — needs a category→Lucide-icon mapping added there) and all `Navbar`/`BottomNav` chrome (🔍💬📋👤 → Lucide equivalents). This is the only new npm dependency introduced by this plan.

## 6. Pages/components in scope

| File | Change |
|---|---|
| `src/pages/Home.jsx` | Greeting header, large search bar, category grid as `Card` + Lucide icons |
| `src/pages/Search.jsx` | Results as restyled `PrestaCard` list |
| `src/components/ui/PrestaCard.jsx` | Restyled: round photo, name, trade, location, badge — no rating (see §2) |
| `src/pages/PrestaireProfile.jsx` | Restyled with tokens/`Card` |
| `src/pages/MonProfil.jsx` (prestataire) | **Restructured** into 3-tab ribbon: *Configurer mon profil* (name, bio, category, location) / *Mon Compte* (email, password) / *Photos de réalisations* (portfolio). New password flow (§8). |
| `src/pages/MonProfilClient.jsx` | **Restructured** into 2-tab ribbon: *Configurer mon profil* / *Mon Compte*. New password flow (§8). |
| `src/pages/Dashboard.jsx` | Restyled with tokens/`Card` |
| `src/pages/Messages.jsx`, `src/pages/Conversation.jsx` | Restyled with tokens |
| `src/pages/Login.jsx`, `src/pages/Register.jsx` | Restyled with tokens |
| `src/components/layout/Navbar.jsx` | Desktop: restyled top nav, unchanged structure. Mobile: **replaced** by `BottomNav` (see §7) |
| `src/components/ui/ContactSheet.jsx` | Restyled with tokens |
| `src/data/categories.js` | Add Lucide icon key per category (19 categories) |

## 7. Mobile navigation change

On mobile (`sm:` breakpoint and below), `BottomNav` fully replaces the top `Navbar` — matches the Uber/Airbnb/Doctolib pattern from the brief. Desktop keeps the existing top navbar (restyled only).

**Assumption flagged for review:** the original brief listed 5 bottom-nav items (Accueil / Recherche / Mes demandes / Messages / Profil), but the app currently only has one "requests/conversations" route per role (`/messages` for clients, `/dashboard` for prestataires) — there's no separate "Mes demandes" page distinct from "Messages". Rather than invent a page, `BottomNav` ships with **4 items**, role-aware on the 3rd:

| Item | Route |
|---|---|
| Accueil | `/` |
| Recherche | `/search` |
| Mes demandes (prestataire) / Messages (client) | `/dashboard` or `/messages` |
| Profil | `/mon-profil-presta` or `/mon-profil-client` |

Logout moves into the Profil tab area rather than being a 5th bottom-nav item (matches how logout isn't a primary nav destination in Uber/Airbnb). **Please confirm this 4-item mapping is acceptable, or clarify what "Mes demandes" should mean for clients if it needs to be a distinct 5th item.**

## 8. Password change flow (both profile pages)

Current: single "new password" field, no verification of identity, straight `supabase.auth.updateUser({ password })` call.

New: 3 fields — current password, new password, confirm new password (mirrors the pattern already used in `Register.jsx` for password rule display). Flow:
1. Client-side: confirm new password === confirm field, and new password passes the existing `PASSWORD_RULES`.
2. Re-authenticate: `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`. Failure → inline error, `updateUser` is never called.
3. On re-auth success: `supabase.auth.updateUser({ password: newPassword })`.

Lives inside the *Mon Compte* tab on both profile pages.

## 9. Animations

Subtle only, no new dependency (Tailwind transitions cover all of it):
- Card fade-in on mount (CSS transition)
- Click feedback: `active:scale-95`
- `Skeleton` placeholders while data loads
- Smooth transition on tab switch in `Tabs`

## 10. Testing

- All 53 existing tests must keep passing; tests asserting specific Tailwind classes get updated for new tokens, tests asserting behavior/content are untouched.
- New tests: `Tabs` (switching sections), `BottomNav` (role-aware links, correct route per role), password change flow (wrong current password rejected, mismatch rejected, success path re-authenticates then updates).

## 11. Constraints carried over from existing plans

- Never add `Co-Authored-By: Claude` to commits.
- Commit messages: lowercase, conventional (`feat:`, `fix:`, `chore:`).
- All user-visible strings through `t('key')` — new tab labels, nav labels need FR/AR/EN i18n keys.
- Supabase project ID: `ueodorekpepgwpzqnezb`.
