# Wasla Roadmap — Foundation to Play Store

**Last updated:** 2026-08-04

---

## Phase 1 — MVP

### Plan 1A — Foundation ✅ DONE
Auth (email + phone OTP), roles, i18n (FR/AR/EN + RTL), Navbar, DB schema, Vercel deploy, security hardening.
`docs/superpowers/plans/2026-06-23-wasla-1a-foundation.md`, `docs/superpowers/plans/2026-06-23-wasla-security-hardening.md`

### Plan 1B — Discovery ✅ DONE (2026-06-24)
Home page (hero + category grid + search bar), `/search` results (filter by category + wilaya), `/prestataire/:id` profile (bio, badge, portfolio, contact button), ContactSheet (send first message only). Seed data: 10 fake prestataires.
`docs/superpowers/plans/2026-06-24-wasla-1b-discovery.md`

### Plan 1C — Messaging ✅ DONE (2026-06-24)
Full conversation thread (`/messages/:id`), inbox (`/messages`), real-time (Supabase Realtime). Dashboard for prestataires to see received requests.
`docs/superpowers/plans/2026-06-24-wasla-1c-messaging.md`

### Plan 1D — Fix + Polish ✅ DONE (2026-06-25)
ContactSheet layout truncation fix + navigate-to-conversation-on-send, mobile navbar messages/dashboard icon, PrestaireProfile i18n cleanup. (Smaller scope than originally planned "Prestataire Tools" — that work landed under 1E instead, see below.)
`docs/superpowers/plans/2026-06-25-wasla-1d-fix-polish.md`

### Plan 1E — Profiles & Registration ✅ DONE (2026-06-27)
This is where "Prestataire Tools" actually landed: registration Step 2 for both roles, categories expanded 8 → 19 (clustered, with incompatible-pair warnings), `/mon-profil-presta` (edit profile, category lock + primary category, portfolio photo upload, max 6 photos), `/mon-profil-client` (new — first/last name, wilaya, phone), Navbar profile icon, portfolio gallery + profile-view counter on the public prestataire page and dashboard.
`docs/superpowers/plans/2026-06-27-wasla-1e-profiles-registration.md`

### Round 3 polish (2026-07 → 2026-08-03, no formal plan doc)
Keyboard nav in SelectField, scroll-to-top, presta profile redirect, years_exp strict validation, form field contrast, logout spinner, dashboard realtime, signingOut reset on login, SelectField search filter, category search fix, validation message fixes, dark-background text-contrast fixes.

### Plan 1F — Design Overhaul ✅ DONE (2026-08-04)
Visual redesign: Uber/Airbnb/Doctolib-style, blue (`#2563EB`) + green (`#10B981`) palette, Inter font, Lucide icons, rounded cards, mobile bottom nav. Profile pages restructured into tabbed ("ribbon") layouts — `/mon-profil-presta` gets 3 tabs (Configurer mon profil / Mon Compte / Photos de réalisations), `/mon-profil-client` gets 2 (Configurer mon profil / Mon Compte). Password-change flow upgraded to 3 fields (current + new + confirm) with re-authentication. Mobile sign-out added to the "Mon Compte" tab (`SignOutButton`) after final review caught it missing. No new backend features.
Spec: `docs/superpowers/specs/2026-08-04-wasla-design-overhaul-design.md`
Plan: `docs/superpowers/plans/2026-08-04-wasla-design-overhaul.md`
Built via 13 tasks (subagent-driven-development) + 1 final-review fix wave, 74 tests passing, pushed to origin/main.
Explicitly deferred out of 1F: trust badges ("Vérifié", "Intervention rapide", "Disponible aujourd'hui"), WhatsApp/one-click-call buttons, payment method display (BaridiMob/CIB/cash), geolocation, ratings/reviews UI.

---

## Phase 2 — Trust & Engagement
Admin panel (manual badge approval), favorites, push notifications, profile verification workflow, ratings dashboard. Likely home for the items deferred out of 1F above (trust badges, ratings/reviews UI).

## Phase 3 — Scale
GPS geolocation, commune-level search, Arabic RTL polish, SEO (possible Next.js migration), moderation tools.

## Phase 4 — Mobile
Capacitor wraps the React app → Android APK → Google Play Store.
