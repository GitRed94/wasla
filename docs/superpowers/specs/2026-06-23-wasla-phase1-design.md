# Wasla — Phase 1 Design Document
**Date:** 2026-06-23  
**Author:** Redstar  
**Status:** Approved ✓

---

## 1. App Concept

**Wasla** (وصلة) — "Connection" in Arabic.  
A local service marketplace connecting clients with verified professional service providers (prestataires) in Algeria, with expansion to Morocco planned.

**Wasla is a "mise en relation" platform** — not a job board, not a trade directory. It connects people who need a service with professionals who provide it, entirely within the app.

### The Problem
- No verified reviews exist for tradespeople in Algeria
- Prices are opaque — no transparency
- Hard to find available, competent professionals quickly
- Current channels: Facebook groups, WhatsApp, word of mouth (bouche-à-oreille)

### The Opportunity
Nothing structured exists in Algeria. Ouedkniss, Yassir, and Leboncoin were referenced as comparable platforms (local context).

---

## 2. Brainstorm Q&A — All Decisions Recorded

### Q1: New repo or existing repo?
**Answer:** Brand new GitHub repository — clean start, separate from the existing Mawaqit project.  
**Repo name:** `wasla`

### Q2: App name?
**Options presented:**
| Name | Meaning |
|------|---------|
| Khidma | "Service/Job" in Arabic — ❌ rejected: causes confusion with job platforms |
| Hirfa | "Trade/Craft" — ❌ rejected: too specific to manual trades |
| Ustal | "Master craftsman" — considered |
| ArtiDZ | Artisan + Algeria — ❌ rejected: "artisan" too narrow (un boulanger est un artisan) |
| MonArtisan | "My Artisan" (French) — considered |
| Wasla | "Connection/Link" (وصلة) — ✅ **CHOSEN** |
| Nasseb | "Connect" in Darija — considered |
| TrouverPro | "Find a Pro" (French) — considered |
| MonPro | "My Professional" (French) — considered |
| Maharat | "Skills" (مهارات) — considered |

**Why Wasla:** One word, works in Arabic and French, means exactly what the app does (connecting client ↔ professional), sounds like a modern app name. Names can be changed later — all infrastructure is renameable.

### Q3: App language / i18n?
**Options presented:**
- A) French only
- B) Arabic only  
- C) Both from day 1

**Answer:** **French + Arabic + English from day 1.**  
Setting up `react-i18next` at the start costs ~1-2 hours but saves weeks of refactoring later. Arabic requires RTL layout support.

**Default language:** Auto-detect from device OS (`navigator.language`). Fallback = **French** if OS language is not in FR/AR/EN.  
Users can switch language anytime from the app menu.

### Q4: Authentication method?
**Options presented:**
- A) Email + password only
- B) Phone + SMS OTP only
- C) Both

**Answer:** **Both — email+password AND phone+SMS OTP.**  
Many Algerians don't use email regularly; phone login is more natural. Supabase supports both natively.

### Q5: User roles?
**Answer:** Three roles, with lazy registration for clients:

| Role | Account | Access |
|------|---------|--------|
| Visitor | None required | Browse, search, view profiles |
| Client | Email or Phone | Contact prestataires, leave reviews |
| Prestataire | Email or Phone | Create profile, receive messages, reply |

**Lazy registration pattern:** Clients are NOT required to register to browse. Registration is triggered only when they want to contact a prestataire. This reduces friction (Airbnb / LinkedIn pattern).

**No admin panel for Phase 1** — manual moderation via Supabase dashboard.

**Monetisation for prestataires:** Deferred. Will be designed separately once the platform has users. (Freemium / Abonnement Pro / Achat de leads model planned — see original concept notes.)

### Q6: Professional verification — how to ensure prestataires are real professionals?
**Answer:** 3-step profile setup at registration:
1. Basic info (name, phone, wilaya, commune)
2. Trade declaration (categories, years of experience, bio)
3. Proof upload — ONE of: photo of tools/workspace, past job photo, or professional document (registre de commerce, carte d'artisan) — NOT mandatory to block registration

**Badge progression:**
- `Non vérifié` — default at registration, profile is visible
- `Vérifié ✓` — after admin manually validates the profile
- `Fiable ⭐` — after real completed jobs through the app (see reviews section)

### Q7: Can a prestataire register for multiple trade categories?
**Answer:** Yes — free multi-selection from the category list for Phase 1. No hardcoded combination rules yet. We observe what people actually combine and add rules later based on real data.

**Example of valid combinations (future reference):**
| Primary | Compatible secondary |
|---------|---------------------|
| Électricien | Caméras/Alarmes, Domotique |
| Plombier | Climatisation |
| Informaticien | Réseaux, Caméras/Alarmes |
| Climaticien | Frigoriste |
| Peintre | *(standalone)* |
| Menuisier | *(standalone)* |

### Q8: How does client-prestataire contact work?
**Options presented:**
- A) In-app messaging (like Leboncoin)
- B) Structured contact form / request
- C) Phone number revealed after login

**Answer:** **Option A — in-app messaging.**  
All communication stays inside Wasla. Benefits: platform control, moderation capability, phone numbers stay private, future monetisation lever (gate messaging behind paid plan).

### Q9: Location granularity?
**Options presented:**
- A) Wilaya only
- B) Wilaya + commune
- C) GPS geolocation

**Answer:** **Wilaya + Commune for Phase 1.**  
Algerian wilayas are very large (e.g., Tamanrasset, Adrar) — commune-level precision is genuinely useful. Referenced: Ouedkniss uses wilaya + commune.  
GPS geolocation deferred to a later phase (referenced: Yassir model).

---

## 3. Architecture

### Option A — React + Vite + Supabase + Vercel ✅ CHOSEN
```
┌─────────────────────────────────────────────┐
│              WASLA (React + Vite)            │
│                  Vercel CDN                  │
│                                              │
│  Pages:  Home / Search / Profile / Messages  │
│  i18n:   react-i18next (FR / AR / EN)        │
│  Styling: Tailwind CSS                       │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│                 SUPABASE                     │
│                                              │
│  Auth      → email+password, phone OTP       │
│  Database  → PostgreSQL (profiles, messages, │
│              reviews, categories, wilayas)   │
│  Storage   → profile photos, portfolio imgs, │
│              review job photos               │
│  Realtime  → in-app messaging                │
└─────────────────────────────────────────────┘
```

**Why Option A:** Supabase handles auth, DB, storage AND realtime messaging in one place — no separate backend to build. Vercel deploys automatically on every push. React+Vite already familiar from Mawaqit project.

**Mobile strategy:** Since this is a React web app, it already works in mobile and desktop browsers. In Phase 4, Capacitor wraps the same codebase into an Android APK → Google Play Store. One codebase → web + mobile.

### Option B — Next.js + Supabase + Vercel (not chosen)
Same backend but with server-side rendering for better SEO. More complex than React+Vite, overkill for Phase 1 validation. Can migrate in Phase 3 if SEO becomes a priority.

### Option C — React + Firebase + Vercel (not chosen)
Firebase instead of Supabase. Rejected because Supabase is already connected and configured, and Firebase is more expensive at scale.

---

## 4. Phase 1 Feature Set

| Feature | Details |
|---------|---------|
| Auth | Email+password + Phone OTP, role selection at signup |
| Language | FR/AR/EN, auto-detect from OS, switchable anytime, default = French |
| Browse | Home with category grid + search bar, no login needed |
| Search | Filter by category + wilaya + commune |
| Prestataire profile | Bio, categories, portfolio photos, badge, reviews |
| Client registration | Lazy — only triggered when contacting someone |
| Messaging | In-app realtime, profanity filter, report button |
| Reviews | Only after job marked complete, optional job photos |
| Badges | Non vérifié → Vérifié → Fiable |
| Moderation | Auto profanity filter + manual reports + strike system |
| Responsive design | Mobile-first, works on desktop (future website reuse) |

---

## 5. Pages & Navigation

```
PUBLIC (no account needed)
├── /                  Home — search bar + category grid
├── /search            Results — filtered by category + wilaya + commune
├── /prestataire/:id   Profile page — portfolio, reviews, contact button
├── /login             Login page (email or phone)
└── /register          Registration — choose role (client | prestataire)

CLIENT (logged in)
├── /messages          Inbox — all conversations
├── /messages/:id      Single conversation with a prestataire
└── /mon-compte        Profile settings

PRESTATAIRE (logged in)
├── /dashboard         Received requests + messages overview
├── /messages/:id      Single conversation with a client
├── /mon-profil        Edit profile, portfolio, categories
└── /mon-compte        Account settings
```

Total: 5 public pages + 7 authenticated pages = **12 pages for Phase 1**

---

## 6. Data Model

```sql
-- Core user account (both clients and prestataires)
users
  id, email, phone, role (client | prestataire)
  preferred_language (fr | ar | en)
  wilaya, commune
  strike_count
  created_at

-- Prestataire extended profile
prestataire_profiles
  user_id, display_name, bio, avatar_url
  categories[]              -- free multi-select
  wilaya, commune
  years_experience
  badge (unverified | verified | trusted)
  is_visible (bool)
  created_at

-- Portfolio images uploaded by prestataire
portfolio_photos
  id, prestataire_id, photo_url, caption, created_at

-- Messaging
conversations
  id, client_id, prestataire_id, created_at

messages
  id, conversation_id
  sender_id, receiver_id
  content, created_at
  read_at
  is_flagged (bool)

-- Reviews
reviews
  id, client_id, prestataire_id
  rating (1–5), comment
  job_photos[]              -- optional, uploaded by client
  job_marked_complete (bool)
  created_at

-- Moderation
reports
  id, reporter_id, reported_user_id
  conversation_id, message_id
  reason (profanity | harassment | inappropriate)
  created_at, reviewed (bool)

user_warnings
  id, user_id, reason
  strike_number (1 | 2 | 3)
  created_at
```

**Business rule:** A client can only submit a review if `job_marked_complete = true` on that conversation. This prevents fake reviews from people who never actually used the service.

---

## 7. Moderation System

### Automated layer
- Profanity filter runs on every message before it is saved (French + Arabic word list)
- Blocked messages are not sent — sender receives a warning notice
- Repeated violations escalate the strike count

### Manual layer
- Any user can tap "Signaler" on any message or conversation
- Reports are stored in the `reports` table
- Reviewed manually via Supabase dashboard (Phase 1), admin panel (Phase 2+)

### Strike system
| Strike | Action |
|--------|--------|
| 1st | Warning notification sent to user |
| 2nd | Account temporarily suspended |
| 3rd | Account permanently banned |

---

## 8. Trade Categories (Phase 1)

1. Plombier
2. Électricien
3. Climaticien
4. Frigoriste
5. Peintre
6. Menuisier
7. Informaticien

To be expanded based on market demand.

---

## 9. Roadmap

| Phase | Focus | Key features |
|-------|-------|-------------|
| **Phase 1** | Core MVP | Auth, profiles, search (wilaya+commune), messaging, reviews, badges, moderation, i18n |
| **Phase 2** | Engagement | Admin panel, favorites, ratings dashboard, push notifications, profile verification workflow |
| **Phase 3** | Scale & Trust | GPS geolocation, commune-level precision, Arabic RTL polish, moderation tools, SEO (Next.js migration?) |
| **Phase 4** | Mobile | Capacitor → Android APK → Google Play Store |

---

## 10. Deferred Decisions

- **Monetisation for prestataires:** Freemium / Abonnement Pro (~500–1500 DZD/month) / Achat de leads — to be designed once the platform has users
- **Trade combination rules:** Which category combinations are allowed — to be defined after observing real registration patterns
- **GPS geolocation:** Deferred to Phase 3+ (Yassir-style)
- **Commission on completed jobs:** Requires payment infrastructure — deferred
- **Admin panel:** Phase 2
- **"Fiable" badge automation:** Exact threshold (how many completed jobs?) — to be defined

---

## 11. Infrastructure Connected

| Service | Account | Status |
|---------|---------|--------|
| GitHub | ClaudeTest | ✓ Connected |
| Supabase | RedOrg / RedProject | ✓ Connected (project paused — to restore) |
| Vercel | Red1's projects | ✓ Connected |

> **Note:** Supabase RedProject is currently paused and will need to be restored before starting implementation.

---

## 12. Security Review — Findings & Fixes (Phase 1A)

**When:** End of Phase 1A, before starting Plan 1B (Discovery).  
**Tool used:** `superpowers:security-review` skill → produced a prioritised finding list. Then fixed via `superpowers:subagent-driven-development` (5 tasks, 5 migrations/frontend commits, reviewed by a task-reviewer agent after each task + a final whole-branch reviewer agent).  
**Branch:** commits `02cbf6f` → `0e35c16` on main (5 commits, 11 tests passing).

### What we found and fixed

#### Critical — fixed

| Finding | Root cause | Fix applied |
|---------|-----------|------------|
| Role assignment is client-controlled | `signUp()` sends `{ data: { role } }` from the browser; the trigger used `COALESCE` which accepted any string | Migration 006: trigger now uses `CASE … IN ('client', 'prestataire') ELSE 'client'` — rejects any other value |
| Prestataire can self-promote badge to 'verified'/'trusted' | UPDATE policy had no `WITH CHECK` — only `USING` | Migration 006: added `WITH CHECK (badge = (select badge from prestataire_profiles where id = auth.uid()))` — badge can never change via client UPDATE |

#### High — fixed

| Finding | Root cause | Fix applied |
|---------|-----------|------------|
| No route guards on /dashboard and /mon-profil | Both routes were open `<Route>` elements with no auth check | Task 4: `ProtectedRoute` component (renders `null` while loading, `<Navigate to="/login" replace />` if unauthenticated, `<Outlet />` if authenticated). 3 tests. App.jsx wraps both routes. |
| `prestataire_profiles` UPDATE policy missing role check | USING clause only checked `auth.uid() = id`, not that caller is a prestataire | Migration 006: USING now also requires `exists (select 1 from profiles where id = auth.uid() and role = 'prestataire')` |
| `conversations` INSERT doesn't verify caller is a client or prestataire is visible | WITH CHECK only checked `auth.uid() = client_id` | Migration 007: added role = 'client' sub-select + `is_visible = true` check on prestataire |
| `reviews` INSERT fake review risk — conversation exists but no messages required | Policy only checked a conversation existed between the parties | Migration 007: rewrote to JOIN on messages — at least one message must exist in the conversation |

#### Medium — fixed

| Finding | Root cause | Fix applied |
|---------|-----------|------------|
| `portfolio_photos` redundant SELECT policies + no role check on INSERT | Two overlapping SELECT policies; INSERT only checked `auth.uid() = prestataire_id` | Migration 008: removed redundant SELECT policy; INSERT now also requires `role = 'prestataire'` sub-select |
| `reports` INSERT allows filing against arbitrary UUIDs | No check that reporter interacted with the reported user | Migration 008: reports INSERT now requires `conversation_id IS NULL OR exists (select 1 from conversations where id = conversation_id and (client_id = auth.uid() or prestataire_id = auth.uid()))` |
| Password only HTML-validated (minLength=6) | `minLength` attribute on `<input>` can be bypassed via DevTools or direct API calls | Task 5: JS guard in `handleEmailRegister` — `if (password.length < 8)` — shows `errors.password_too_short` i18n error |
| `signOut` no redirect after logout | `AuthContext.signOut()` called supabase but didn't navigate | Task 5: Navbar wraps `signOut` in `handleSignOut` → `await signOut()` then `navigate('/')` |
| Phone number no format validation | Phone field was free-text, any value sent to Supabase OTP | Task 5: `PHONE_REGEX = /^\+\d{7,15}$/` validates E.164 format in both Login.jsx and Register.jsx before the OTP call |

### What is still open (fix before 1B)

| Finding | Severity | Details |
|---------|----------|---------|
| `reviews` INSERT missing explicit `role = 'client'` check | Important | The `c.client_id = auth.uid()` sub-select is a proxy for the client role but not identical. Should add `exists (select 1 from profiles where id = auth.uid() and role = 'client')` for consistency with the conversations policy. Low risk but inconsistent. |
| `PHONE_REGEX` duplicated in Login.jsx + Register.jsx | Minor | Extract to `src/utils/validation.js` |
| `portfolio_photos` DELETE policy has no role check | Minor | Only checks `auth.uid() = prestataire_id`, no `role = 'prestataire'` sub-select |
| `ProtectedRoute` renders nothing during auth hydration | Minor | User sees blank page briefly — add a spinner |
| `handleSignOut` in Navbar does not handle errors | Minor | If `signOut()` rejects, `navigate('/')` still fires |

### Lessons for future apps — apply from day 1

1. **Never trust client-sent role.** DB trigger must validate it with an explicit allowlist (`CASE … IN (…) ELSE 'default'`), not `COALESCE`.
2. **Every UPDATE policy needs `WITH CHECK`.** `USING` controls which rows you can update; `WITH CHECK` controls what values you can write. Without it, users can overwrite badge/role/status fields.
3. **Role sub-select on every write policy.** A user whose `auth.uid()` matches a row ID is not necessarily authorized to write it. Always add `exists (select 1 from profiles where id = auth.uid() and role = 'expected_role')`.
4. **Protected routes from day 1.** Never leave authenticated pages as open `<Route>` elements. Wire `ProtectedRoute` at the same time you create the page.
5. **signOut must redirect.** Always call `navigate()` after sign-out — leaving the user on a protected page after logout is both a UX and security issue.
6. **JS validation, not just HTML attributes.** `minLength`, `required`, `type="email"` can be bypassed from browser DevTools. Add a JS guard before any API call for every constraint that matters (password length, phone format, role selection).
7. **Scope write policies to interactions.** Reports, reviews, and messages should only be allowed between users who have actually interacted (joined a conversation). A bare `auth.uid() = reporter_id` is too permissive.
8. **Run the `superpowers:security-review` skill immediately after Plan 1A** — before building any 1B features. Fixing security on a small codebase is cheap; fixing it after 20 more pages are built is expensive.
