# Wasla — Plan 1A: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Wasla project with a working GitHub repo, Supabase database, full auth (email + phone OTP), i18n (FR/AR/EN), and a routed React app where users can register and log in.

**Architecture:** React 19 + Vite 8 frontend deployed on Vercel, Supabase for auth + PostgreSQL database. Auth context wraps the entire app; protected routes redirect unauthenticated users. i18n is configured at app boot with OS language detection and French fallback.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, React Router v7, @supabase/supabase-js v2, react-i18next v15, i18next-browser-languagedetector, Vitest + @testing-library/react

## Global Constraints

- GitHub account: `GitRed94` — all repos created under this account
- Supabase org: `RedOrg`, project: `RedProject` (ref: `ueodorekpepgwpzqnezb`) — must be restored before any DB work
- Vercel team: `Red1's projects` (id: `team_ovoFe79tjMsvFdK48DuALjiM`)
- App name: `Wasla` — display name in UI
- Languages: French (`fr`), Arabic (`ar`), English (`en`) — default fallback is `fr`
- RTL support required for Arabic — set `dir="rtl"` on `<html>` when `ar` is active
- All user-facing strings go through i18n keys — never hardcode display text
- Roles: `client` | `prestataire` — set at registration, stored in `profiles` table
- No Co-Authored-By lines in any git commit messages

---

## File Structure

```
wasla/
├── .env.local                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (never commit)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx                      # App entry — mounts Router + i18n + AuthProvider
│   ├── App.jsx                       # Route definitions
│   ├── supabaseClient.js             # Single Supabase client instance
│   ├── i18n.js                       # i18next configuration
│   ├── locales/
│   │   ├── fr.json                   # French translations
│   │   ├── ar.json                   # Arabic translations
│   │   └── en.json                   # English translations
│   ├── context/
│   │   └── AuthContext.jsx           # Session state + signIn/signOut/signUp helpers
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.jsx            # Top nav — auth state + language switcher
│   │   └── ui/
│   │       └── LanguageSwitcher.jsx  # FR/AR/EN toggle button
│   └── pages/
│       ├── Home.jsx                  # Placeholder — "Coming soon" for now
│       ├── Login.jsx                 # Email+password OR phone OTP login
│       └── Register.jsx              # Role selection + email/phone registration
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql
│       ├── 002_prestataire_profiles.sql
│       ├── 003_messaging.sql
│       ├── 004_reviews.sql
│       └── 005_moderation.sql
└── src/
    └── __tests__/
        ├── AuthContext.test.jsx
        ├── Login.test.jsx
        ├── Register.test.jsx
        └── LanguageSwitcher.test.jsx
```

---

## Task 1: Create GitHub Repo + Bootstrap Local Project

**Files:**
- Create: `wasla/` (new directory at same level as ClaudeTest, e.g. `C:/Repo/wasla`)
- Create: `wasla/package.json`
- Create: `wasla/vite.config.js`
- Create: `wasla/index.html`
- Create: `wasla/.gitignore`

**Interfaces:**
- Produces: A running `npm run dev` at `http://localhost:5173` showing a blank React page

- [ ] **Step 1: Create GitHub repo via MCP**

Use the `mcp__github__create_repository` tool with:
```json
{
  "name": "wasla",
  "description": "Plateforme de mise en relation — services locaux en Algérie",
  "private": false,
  "autoInit": false
}
```

- [ ] **Step 2: Scaffold the project locally**

Run in PowerShell (NOT inside C:/Repo/ClaudeTest):
```powershell
cd C:/Repo
npm create vite@latest wasla -- --template react
cd wasla
npm install
```

- [ ] **Step 3: Verify dev server starts**

```powershell
npm run dev
```
Expected: terminal shows `http://localhost:5173`, browser shows Vite+React default page. Stop with Ctrl+C.

- [ ] **Step 4: Create .gitignore**

Replace the existing `.gitignore` with:
```
node_modules
dist
.env.local
.env
*.local
```

- [ ] **Step 5: Initialize git and push to GitHub**

```powershell
cd C:/Repo/wasla
git init
git add .
git commit -m "chore: scaffold Vite React project for Wasla"
git branch -M main
git remote add origin https://github.com/GitRed94/wasla.git
git push -u origin main
```

---

## Task 2: Install Dependencies + Configure Tailwind CSS v4

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `src/index.css`
- Modify: `src/main.jsx` (import order only)

**Interfaces:**
- Produces: Tailwind utility classes work in any component; all runtime dependencies installed

- [ ] **Step 1: Install all dependencies**

```powershell
cd C:/Repo/wasla
npm install @supabase/supabase-js react-router-dom react-i18next i18next i18next-browser-languagedetector
npm install -D @tailwindcss/vite tailwindcss @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Configure Tailwind in vite.config.js**

Replace `C:/Repo/wasla/vite.config.js` entirely:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 3: Add Tailwind import to index.css**

Replace `src/index.css` entirely:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Configure Vitest in vite.config.js**

Replace `C:/Repo/wasla/vite.config.js` entirely (adds test block):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `C:/Repo/wasla/src/setupTests.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Update package.json test script**

In `package.json`, change the scripts section to:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: Verify Tailwind works**

In `src/App.jsx`, replace everything with:
```jsx
export default function App() {
  return <div className="text-3xl font-bold text-blue-600 p-8">Wasla</div>
}
```
Run `npm run dev` — browser should show "Wasla" in large blue bold text. Stop server.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "chore: install dependencies and configure Tailwind v4 + Vitest"
```

---

## Task 3: Restore Supabase + Apply Database Migrations

**Files:**
- Create: `supabase/migrations/001_profiles.sql`
- Create: `supabase/migrations/002_prestataire_profiles.sql`
- Create: `supabase/migrations/003_messaging.sql`
- Create: `supabase/migrations/004_reviews.sql`
- Create: `supabase/migrations/005_moderation.sql`

**Interfaces:**
- Produces: All tables exist in Supabase with RLS enabled; `profiles` table auto-populates on auth signup via trigger

- [ ] **Step 1: Restore the Supabase project**

Use `mcp__supabase__restore_project` with:
```json
{ "project_ref": "ueodorekpepgwpzqnezb" }
```
Wait for status to become `ACTIVE_HEALTHY` (poll with `mcp__supabase__get_project`).

- [ ] **Step 2: Get Supabase credentials**

Use `mcp__supabase__get_project_url` and `mcp__supabase__get_publishable_keys` with `project_ref: "ueodorekpepgwpzqnezb"`.

Create `C:/Repo/wasla/.env.local`:
```
VITE_SUPABASE_URL=<url from get_project_url>
VITE_SUPABASE_ANON_KEY=<anon key from get_publishable_keys>
```

- [ ] **Step 3: Apply migration 001 — profiles**

Save to `supabase/migrations/001_profiles.sql`, then apply via `mcp__supabase__apply_migration`:

```sql
-- Auto-create a profile row when a user signs up
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('client', 'prestataire')),
  preferred_language text default 'fr' check (preferred_language in ('fr', 'ar', 'en')),
  wilaya text,
  commune text,
  strike_count int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow public to read prestataire profiles (needed for browse)
create policy "Public can view prestataire profiles"
  on public.profiles for select
  using (role = 'prestataire');

-- Trigger: insert profile row on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (new.id, (new.raw_user_meta_data->>'role')::text);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 4: Apply migration 002 — prestataire_profiles**

```sql
create table public.prestataire_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  display_name text not null,
  bio text,
  avatar_url text,
  categories text[] default '{}',
  wilaya text not null,
  commune text not null,
  years_experience int,
  badge text default 'unverified' check (badge in ('unverified', 'verified', 'trusted')),
  is_visible boolean default true,
  created_at timestamptz default now()
);

alter table public.prestataire_profiles enable row level security;

create policy "Anyone can view visible prestataire profiles"
  on public.prestataire_profiles for select
  using (is_visible = true);

create policy "Prestataires can update their own profile"
  on public.prestataire_profiles for update
  using (auth.uid() = id);

create policy "Prestataires can insert their own profile"
  on public.prestataire_profiles for insert
  with check (auth.uid() = id);

create table public.portfolio_photos (
  id uuid default gen_random_uuid() primary key,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz default now()
);

alter table public.portfolio_photos enable row level security;

create policy "Anyone can view portfolio photos"
  on public.portfolio_photos for select
  using (true);

create policy "Prestataires can manage their own photos"
  on public.portfolio_photos for all
  using (auth.uid() = prestataire_id);
```

- [ ] **Step 5: Apply migration 003 — messaging**

```sql
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(client_id, prestataire_id)
);

alter table public.conversations enable row level security;

create policy "Conversation participants can view"
  on public.conversations for select
  using (auth.uid() = client_id or auth.uid() = prestataire_id);

create policy "Clients can create conversations"
  on public.conversations for insert
  with check (auth.uid() = client_id);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz,
  is_flagged boolean default false
);

alter table public.messages enable row level security;

create policy "Conversation participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
    )
  );
```

- [ ] **Step 6: Apply migration 004 — reviews**

```sql
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  job_photos text[] default '{}',
  job_marked_complete boolean default false,
  created_at timestamptz default now(),
  unique(client_id, prestataire_id, conversation_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Clients can insert reviews for completed jobs"
  on public.reviews for insert
  with check (
    auth.uid() = client_id and
    job_marked_complete = true
  );
```

- [ ] **Step 7: Apply migration 005 — moderation**

```sql
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  conversation_id uuid references public.conversations(id),
  message_id uuid references public.messages(id),
  reason text check (reason in ('profanity', 'harassment', 'inappropriate')),
  created_at timestamptz default now(),
  reviewed boolean default false
);

alter table public.reports enable row level security;

create policy "Authenticated users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create table public.user_warnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  strike_number int not null check (strike_number between 1 and 3),
  created_at timestamptz default now()
);

alter table public.user_warnings enable row level security;

create policy "Users can view their own warnings"
  on public.user_warnings for select
  using (auth.uid() = user_id);
```

- [ ] **Step 8: Commit migration files**

```powershell
git add supabase/
git commit -m "feat: add database schema migrations (profiles, messaging, reviews, moderation)"
```

---

## Task 4: Supabase Client + Auth Context

**Files:**
- Create: `src/supabaseClient.js`
- Create: `src/context/AuthContext.jsx`
- Create: `src/__tests__/AuthContext.test.jsx`

**Interfaces:**
- Produces:
  - `supabase` — default export from `src/supabaseClient.js`, a configured Supabase client
  - `AuthProvider` — React context provider wrapping the app
  - `useAuth()` — hook returning `{ user, profile, loading, signOut }`

- [ ] **Step 1: Create Supabase client**

Create `src/supabaseClient.js`:
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 2: Write failing test for AuthContext**

Create `src/__tests__/AuthContext.test.jsx`:
```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { vi } from 'vitest'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

function TestConsumer() {
  const { user, loading } = useAuth()
  if (loading) return <div>loading</div>
  return <div>{user ? user.id : 'no-user'}</div>
}

test('provides null user when not authenticated', async () => {
  render(<AuthProvider><TestConsumer /></AuthProvider>)
  await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument())
})
```

- [ ] **Step 3: Run test to verify it fails**

```powershell
npm test
```
Expected: FAIL — `AuthProvider` and `useAuth` not found

- [ ] **Step 4: Create AuthContext**

Create `src/context/AuthContext.jsx`:
```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 5: Run test to verify it passes**

```powershell
npm test
```
Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add src/supabaseClient.js src/context/AuthContext.jsx src/__tests__/AuthContext.test.jsx
git commit -m "feat: add Supabase client and AuthContext"
```

---

## Task 5: i18n Configuration

**Files:**
- Create: `src/i18n.js`
- Create: `src/locales/fr.json`
- Create: `src/locales/ar.json`
- Create: `src/locales/en.json`
- Create: `src/__tests__/LanguageSwitcher.test.jsx`
- Create: `src/components/ui/LanguageSwitcher.jsx`

**Interfaces:**
- Produces:
  - `src/i18n.js` — side-effect import that configures i18next; import once in `main.jsx`
  - `useTranslation()` — from `react-i18next`, usable in any component
  - `<LanguageSwitcher />` — renders three buttons: FR / AR / EN

- [ ] **Step 1: Create translation files**

Create `src/locales/fr.json`:
```json
{
  "app_name": "Wasla",
  "nav": {
    "home": "Accueil",
    "search": "Rechercher",
    "login": "Connexion",
    "register": "S'inscrire",
    "logout": "Déconnexion",
    "dashboard": "Tableau de bord",
    "my_profile": "Mon profil",
    "messages": "Messages"
  },
  "auth": {
    "email": "Email",
    "phone": "Téléphone",
    "password": "Mot de passe",
    "login_title": "Connexion",
    "register_title": "Créer un compte",
    "or": "ou",
    "submit_login": "Se connecter",
    "submit_register": "S'inscrire",
    "choose_role": "Vous êtes...",
    "role_client": "Client — je cherche un prestataire",
    "role_prestataire": "Prestataire — je propose mes services",
    "already_account": "Déjà un compte ?",
    "no_account": "Pas encore de compte ?",
    "otp_sent": "Code envoyé par SMS",
    "enter_otp": "Entrez le code reçu",
    "verify": "Vérifier"
  },
  "errors": {
    "required": "Ce champ est requis",
    "invalid_email": "Email invalide",
    "invalid_phone": "Numéro invalide (ex: +213612345678)",
    "auth_failed": "Échec de la connexion. Vérifiez vos informations.",
    "generic": "Une erreur est survenue"
  },
  "home": {
    "hero_title": "Trouvez le bon prestataire près de chez vous",
    "hero_subtitle": "Plombiers, électriciens, peintres et plus — vérifiés et disponibles.",
    "search_placeholder": "Quelle prestation recherchez-vous ?"
  }
}
```

Create `src/locales/ar.json`:
```json
{
  "app_name": "وصلة",
  "nav": {
    "home": "الرئيسية",
    "search": "بحث",
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "خروج",
    "dashboard": "لوحة التحكم",
    "my_profile": "ملفي",
    "messages": "الرسائل"
  },
  "auth": {
    "email": "البريد الإلكتروني",
    "phone": "رقم الهاتف",
    "password": "كلمة المرور",
    "login_title": "تسجيل الدخول",
    "register_title": "إنشاء حساب",
    "or": "أو",
    "submit_login": "دخول",
    "submit_register": "إنشاء الحساب",
    "choose_role": "أنت...",
    "role_client": "عميل — أبحث عن مزود خدمة",
    "role_prestataire": "مزود خدمة — أقدم خدماتي",
    "already_account": "لديك حساب؟",
    "no_account": "ليس لديك حساب؟",
    "otp_sent": "تم إرسال الرمز عبر SMS",
    "enter_otp": "أدخل الرمز المستلم",
    "verify": "تحقق"
  },
  "errors": {
    "required": "هذا الحقل مطلوب",
    "invalid_email": "بريد إلكتروني غير صالح",
    "invalid_phone": "رقم غير صالح (مثال: +213612345678)",
    "auth_failed": "فشل تسجيل الدخول. تحقق من معلوماتك.",
    "generic": "حدث خطأ ما"
  },
  "home": {
    "hero_title": "اعثر على مزود الخدمة المناسب بالقرب منك",
    "hero_subtitle": "سبّاكون، كهربائيون، دهّانون والمزيد — موثّقون ومتاحون.",
    "search_placeholder": "ما الخدمة التي تبحث عنها؟"
  }
}
```

Create `src/locales/en.json`:
```json
{
  "app_name": "Wasla",
  "nav": {
    "home": "Home",
    "search": "Search",
    "login": "Login",
    "register": "Sign up",
    "logout": "Logout",
    "dashboard": "Dashboard",
    "my_profile": "My Profile",
    "messages": "Messages"
  },
  "auth": {
    "email": "Email",
    "phone": "Phone",
    "password": "Password",
    "login_title": "Login",
    "register_title": "Create an account",
    "or": "or",
    "submit_login": "Login",
    "submit_register": "Sign up",
    "choose_role": "I am a...",
    "role_client": "Client — looking for a professional",
    "role_prestataire": "Professional — offering my services",
    "already_account": "Already have an account?",
    "no_account": "No account yet?",
    "otp_sent": "Code sent by SMS",
    "enter_otp": "Enter the code you received",
    "verify": "Verify"
  },
  "errors": {
    "required": "This field is required",
    "invalid_email": "Invalid email",
    "invalid_phone": "Invalid number (e.g. +213612345678)",
    "auth_failed": "Login failed. Check your credentials.",
    "generic": "Something went wrong"
  },
  "home": {
    "hero_title": "Find the right professional near you",
    "hero_subtitle": "Plumbers, electricians, painters and more — verified and available.",
    "search_placeholder": "What service are you looking for?"
  }
}
```

- [ ] **Step 2: Create i18n.js**

Create `src/i18n.js`:
```js
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'ar', 'en'],
    detection: {
      order: ['navigator'],
      caches: [],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
```

- [ ] **Step 3: Write failing test for LanguageSwitcher**

Create `src/__tests__/LanguageSwitcher.test.jsx`:
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

function Wrapper({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

test('renders FR, AR, EN buttons', () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  expect(screen.getByText('FR')).toBeInTheDocument()
  expect(screen.getByText('AR')).toBeInTheDocument()
  expect(screen.getByText('EN')).toBeInTheDocument()
})

test('changes language to Arabic and sets dir=rtl', async () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText('AR'))
  expect(i18n.language).toBe('ar')
  expect(document.documentElement.getAttribute('dir')).toBe('rtl')
})

test('changes language to French and removes rtl', async () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText('FR'))
  expect(i18n.language).toBe('fr')
  expect(document.documentElement.getAttribute('dir')).toBe('ltr')
})
```

- [ ] **Step 4: Run test to verify it fails**

```powershell
npm test
```
Expected: FAIL — `LanguageSwitcher` not found

- [ ] **Step 5: Create LanguageSwitcher component**

Create `src/components/ui/LanguageSwitcher.jsx`:
```jsx
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', code)
  }

  return (
    <div className="flex gap-1">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`px-2 py-1 text-sm rounded font-medium transition-colors ${
            i18n.language === code
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```powershell
npm test
```
Expected: all PASS

- [ ] **Step 7: Commit**

```powershell
git add src/i18n.js src/locales/ src/components/ui/LanguageSwitcher.jsx src/__tests__/LanguageSwitcher.test.jsx
git commit -m "feat: add i18n configuration with FR/AR/EN and LanguageSwitcher"
```

---

## Task 6: React Router + App Shell

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/pages/Home.jsx`
- Create: `src/pages/Login.jsx` (placeholder)
- Create: `src/pages/Register.jsx` (placeholder)
- Create: `src/components/layout/Navbar.jsx`

**Interfaces:**
- Produces:
  - `<App />` — defines all routes, wraps with `AuthProvider`
  - `<Navbar />` — top bar visible on all pages
  - Routes: `/` → Home, `/login` → Login, `/register` → Register

- [ ] **Step 1: Update main.jsx**

Replace `src/main.jsx` entirely:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 2: Create placeholder pages**

Create `src/pages/Home.jsx`:
```jsx
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t('home.hero_title')}</h1>
      <p className="text-gray-600 mt-2">{t('home.hero_subtitle')}</p>
    </main>
  )
}
```

Create `src/pages/Login.jsx`:
```jsx
export default function Login() {
  return <div className="p-8">Login — coming in Task 7</div>
}
```

Create `src/pages/Register.jsx`:
```jsx
export default function Register() {
  return <div className="p-8">Register — coming in Task 8</div>
}
```

- [ ] **Step 3: Create Navbar**

Create `src/components/layout/Navbar.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-blue-600">
        {t('app_name')}
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/search" className="text-sm text-gray-700 hover:text-blue-600">
          {t('nav.search')}
        </Link>

        {user ? (
          <>
            <Link
              to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-700 hover:text-red-600"
            >
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600">
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              {t('nav.register')}
            </Link>
          </>
        )}

        <LanguageSwitcher />
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Update App.jsx with routes**

Replace `src/App.jsx` entirely:
```jsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}
```

- [ ] **Step 5: Verify in browser**

```powershell
npm run dev
```
- Navigate to `http://localhost:5173` — see Navbar + "Trouvez le bon prestataire..." text
- Click FR/AR/EN buttons — text changes language, Arabic flips to RTL
- Click "Connexion" link — navigates to `/login`
- Stop server.

- [ ] **Step 6: Commit**

```powershell
git add src/main.jsx src/App.jsx src/pages/ src/components/layout/
git commit -m "feat: add React Router, app shell, Navbar with auth state and language switcher"
```

---

## Task 7: Login Page

**Files:**
- Modify: `src/pages/Login.jsx`
- Create: `src/__tests__/Login.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` from `AuthContext`, `supabase` from `supabaseClient`
- Produces: Functional login page — email+password tab and phone OTP tab; redirects to `/` on success

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/Login.test.jsx`:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Login from '../pages/Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

test('renders email and phone tabs', () => {
  render(<Login />, { wrapper: Wrapper })
  expect(screen.getByText('Email')).toBeInTheDocument()
  expect(screen.getByText(/t.l.phone/i) || screen.getByLabelText(/phone/i) || screen.getByText('Téléphone')).toBeTruthy()
})

test('shows email and password fields by default', () => {
  render(<Login />, { wrapper: Wrapper })
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/mot de passe|password/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm test -- Login
```
Expected: FAIL

- [ ] **Step 3: Implement Login page**

Replace `src/pages/Login.jsx`:
```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/'); return null }

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(t('errors.auth_failed'))
    else navigate('/')
    setLoading(false)
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) setError(t('errors.auth_failed'))
    else setOtpSent(true)
    setLoading(false)
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) setError(t('errors.auth_failed'))
    else navigate('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.login_title')}</h1>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'email' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.email')}
          </button>
          <button
            onClick={() => setTab('phone')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'phone' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.phone')}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.submit_login')}
            </button>
          </form>
        )}

        {tab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.phone')}
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+213612345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.submit_login')}
            </button>
          </form>
        )}

        {tab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">{t('auth.otp_sent')}</p>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.enter_otp')}
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.verify')}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```powershell
npm test
```
Expected: all PASS

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Login.jsx src/__tests__/Login.test.jsx
git commit -m "feat: add Login page with email+password and phone OTP tabs"
```

---

## Task 8: Register Page

**Files:**
- Modify: `src/pages/Register.jsx`
- Create: `src/__tests__/Register.test.jsx`

**Interfaces:**
- Consumes: `supabase.auth.signUp()` — pass `options.data.role` so the DB trigger picks it up
- Produces: Registration form with role selection (client | prestataire); on success redirects based on role

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/Register.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Register from '../pages/Register'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

test('renders role selection', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getByText(/client/i)).toBeInTheDocument()
  expect(screen.getByText(/prestataire/i)).toBeInTheDocument()
})

test('shows email and phone tabs', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getByText('Email')).toBeInTheDocument()
  expect(screen.getByText('Téléphone')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npm test -- Register
```
Expected: FAIL

- [ ] **Step 3: Implement Register page**

Replace `src/pages/Register.jsx`:
```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [role, setRole] = useState('')
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/'); return null }

  async function handleEmailRegister(e) {
    e.preventDefault()
    if (!role) { setError(t('errors.required')); return }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    if (error) setError(t('errors.auth_failed'))
    else navigate(role === 'prestataire' ? '/mon-profil' : '/')
    setLoading(false)
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!role) { setError(t('errors.required')); return }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { role } },
    })
    if (error) setError(t('errors.auth_failed'))
    else setOtpSent(true)
    setLoading(false)
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) setError(t('errors.auth_failed'))
    else navigate(role === 'prestataire' ? '/mon-profil' : '/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.register_title')}</h1>

        <p className="text-sm font-medium text-gray-700 mb-3">{t('auth.choose_role')}</p>
        <div className="space-y-2 mb-6">
          {['client', 'prestataire'].map(r => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="accent-blue-600"
              />
              <span className="text-sm">{t(`auth.role_${r}`)}</span>
            </label>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'email' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.email')}
          </button>
          <button
            onClick={() => setTab('phone')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'phone' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.phone')}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {tab === 'email' && (
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.submit_register')}
            </button>
          </form>
        )}

        {tab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.phone')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+213612345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.submit_register')}
            </button>
          </form>
        )}

        {tab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">{t('auth.otp_sent')}</p>
            <div>
              <label htmlFor="reg-otp" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.enter_otp')}
              </label>
              <input
                id="reg-otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.verify')}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.already_account')}{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```powershell
npm test
```
Expected: all PASS

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Register.jsx src/__tests__/Register.test.jsx
git commit -m "feat: add Register page with role selection, email and phone OTP"
```

---

## Task 9: Connect Vercel + Deploy

**Files:** No code changes — deployment configuration only

**Interfaces:**
- Produces: Live URL at `wasla-xxx.vercel.app` with automatic deploys on every push to `main`

- [ ] **Step 1: Push all current work to GitHub**

```powershell
git push origin main
```

- [ ] **Step 2: Create Vercel project via MCP**

Use `mcp__vercel__deploy_to_vercel` or the Vercel dashboard:
- Go to vercel.com → New Project → Import `GitRed94/wasla`
- Framework: Vite
- Root directory: `/`
- Build command: `npm run build`
- Output directory: `dist`

- [ ] **Step 3: Add environment variables in Vercel**

In Vercel project settings → Environment Variables, add:
- `VITE_SUPABASE_URL` — value from `.env.local`
- `VITE_SUPABASE_ANON_KEY` — value from `.env.local`

- [ ] **Step 4: Trigger deploy and verify**

Push an empty commit or use "Redeploy" in Vercel dashboard:
```powershell
git commit --allow-empty -m "ci: trigger initial Vercel deploy"
git push origin main
```

Wait for deploy to complete. Visit the generated URL and verify:
- Navbar shows Wasla
- Language switcher works
- `/login` and `/register` routes load

---

## Self-Review

**Spec coverage check:**
- ✅ New GitHub repo `wasla` — Task 1
- ✅ React + Vite + Tailwind + Supabase + Vercel — Tasks 1, 2, 9
- ✅ i18n FR/AR/EN from day 1, OS detection, French fallback — Task 5
- ✅ RTL for Arabic — Task 5 (LanguageSwitcher sets `dir`)
- ✅ Auth: email+password + phone OTP — Tasks 7, 8
- ✅ Role selection at registration (client | prestataire) — Task 8
- ✅ All 5 DB tables + RLS — Task 3
- ✅ Auto-profile trigger on signup — Task 3 migration 001
- ✅ Vercel deployment — Task 9
- ✅ No Co-Authored-By in commits — all commit messages clean

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:**
- `useAuth()` returns `{ user, profile, loading, signOut }` — defined in Task 4, consumed in Tasks 6, 7, 8 ✅
- `supabase` exported from `supabaseClient.js` — used in Tasks 7, 8 ✅
- `profile.role` used in Navbar — matches `role` column in `profiles` table ✅
