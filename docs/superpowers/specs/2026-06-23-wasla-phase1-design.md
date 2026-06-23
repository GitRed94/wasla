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
