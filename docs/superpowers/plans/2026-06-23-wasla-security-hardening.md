# Wasla Security Hardening (Pre-1B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical, High, and Medium security issues identified in the Phase 1A security review before building any 1B features.

**Architecture:** Three Supabase migration files patch RLS policies and the role-assignment trigger; two frontend changes add ProtectedRoute guards and client-side input validation. No new tables or components are introduced beyond ProtectedRoute.

**Tech Stack:** React 18, React Router v6, Vitest + React Testing Library, Supabase (Postgres RLS + triggers), i18next

## Global Constraints

- Never commit `Co-Authored-By: Claude` — omit it from every commit message
- Run `npx vitest run` to execute the test suite; all 8 existing tests must remain green after every task
- Apply DB migrations via the `mcp__supabase__apply_migration` MCP tool; project ref is `ueodorekpepgwpzqnezb`
- Verify migration applied via `mcp__supabase__list_migrations`
- Migration filenames must start with the next sequential number (currently up to 005)
- All locale files (fr/ar/en) must be updated together whenever a new i18n key is added

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/006_harden_trigger_prestataire_update.sql` | Fix role trigger + prestataire_profiles UPDATE policy |
| Create | `supabase/migrations/007_harden_conversations_reviews.sql` | Harden conversations INSERT + reviews INSERT policies |
| Create | `supabase/migrations/008_fix_portfolio_reports.sql` | Remove redundant portfolio policy + harden reports INSERT |
| Create | `src/components/auth/ProtectedRoute.jsx` | Route guard that redirects unauthenticated users to /login |
| Create | `src/__tests__/ProtectedRoute.test.jsx` | Tests for ProtectedRoute |
| Modify | `src/App.jsx` | Wrap /dashboard and /mon-profil in ProtectedRoute |
| Modify | `src/components/layout/Navbar.jsx` | Navigate to / after signOut |
| Modify | `src/pages/Register.jsx` | Add JS-level password length + phone format validation |
| Modify | `src/pages/Login.jsx` | Add JS-level phone format validation |
| Modify | `src/locales/fr.json` | Add `errors.password_too_short` |
| Modify | `src/locales/ar.json` | Add `errors.password_too_short` |
| Modify | `src/locales/en.json` | Add `errors.password_too_short` |

---

### Task 1: DB — Harden role trigger + prestataire_profiles UPDATE policy

**Issues fixed:** Critical — role assignment client-controlled; Critical — badge self-promotion; High — UPDATE policy missing role sub-select check.

**Files:**
- Create: `supabase/migrations/006_harden_trigger_prestataire_update.sql`

**Interfaces:**
- Produces: hardened `handle_new_user()` trigger function + new `prestataire_profiles` UPDATE policy (consumed by all future DB tasks)

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/006_harden_trigger_prestataire_update.sql` with this exact content:

```sql
-- Harden handle_new_user: reject anything that isn't explicitly 'client' or 'prestataire'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when (new.raw_user_meta_data->>'role') in ('client', 'prestataire')
        then (new.raw_user_meta_data->>'role')::text
      else 'client'
    end
  );
  return new;
end;
$$;

-- Add role sub-select check and WITH CHECK to prevent badge self-promotion
drop policy "Prestataires can update their own profile" on public.prestataire_profiles;

create policy "Prestataires can update their own profile"
  on public.prestataire_profiles for update
  using (
    auth.uid() = id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'prestataire'
    )
  )
  with check (
    auth.uid() = id
    and badge = (select badge from public.prestataire_profiles where id = auth.uid())
  );
```

- [ ] **Step 2: Apply the migration**

Use `mcp__supabase__apply_migration` with:
- project_ref: `ueodorekpepgwpzqnezb`
- name: `006_harden_trigger_prestataire_update`
- query: (full SQL above)

- [ ] **Step 3: Verify migration applied**

Use `mcp__supabase__list_migrations` with project_ref `ueodorekpepgwpzqnezb`.
Expected: migration `006_harden_trigger_prestataire_update` appears in the list.

- [ ] **Step 4: Run tests**

```
npx vitest run
```
Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```
git add supabase/migrations/006_harden_trigger_prestataire_update.sql
git commit -m "fix: harden role trigger and prestataire_profiles UPDATE policy"
```

---

### Task 2: DB — Harden conversations + reviews INSERT policies

**Issues fixed:** High — conversations INSERT doesn't verify caller is a client or prestataire is visible; High — reviews INSERT fake review risk (no message required).

**Files:**
- Create: `supabase/migrations/007_harden_conversations_reviews.sql`

**Interfaces:**
- Consumes: `public.profiles`, `public.prestataire_profiles`, `public.messages` (all exist from migrations 001–004)
- Produces: hardened INSERT policies for `conversations` and `reviews`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/007_harden_conversations_reviews.sql` with this exact content:

```sql
-- Require caller to be a client and prestataire to be visible
drop policy "Clients can create conversations" on public.conversations;

create policy "Clients can create conversations"
  on public.conversations for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
    and exists (
      select 1 from public.prestataire_profiles
      where id = prestataire_id and is_visible = true
    )
  );

-- Require at least one message in the conversation before allowing a review
drop policy "Clients can insert reviews after conversation" on public.reviews;

create policy "Clients can insert reviews after conversation"
  on public.reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.conversations c
      join public.messages m on m.conversation_id = c.id
      where c.client_id = auth.uid()
      and c.prestataire_id = reviews.prestataire_id
    )
  );
```

- [ ] **Step 2: Apply the migration**

Use `mcp__supabase__apply_migration` with:
- project_ref: `ueodorekpepgwpzqnezb`
- name: `007_harden_conversations_reviews`
- query: (full SQL above)

- [ ] **Step 3: Verify migration applied**

Use `mcp__supabase__list_migrations` with project_ref `ueodorekpepgwpzqnezb`.
Expected: `007_harden_conversations_reviews` appears in the list.

- [ ] **Step 4: Run tests**

```
npx vitest run
```
Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```
git add supabase/migrations/007_harden_conversations_reviews.sql
git commit -m "fix: harden conversations and reviews INSERT policies"
```

---

### Task 3: DB — Fix portfolio_photos + reports policies

**Issues fixed:** Medium — portfolio_photos has redundant SELECT policies and no role check on INSERT; Medium — reports INSERT allows filing against users the reporter has never interacted with.

**Files:**
- Create: `supabase/migrations/008_fix_portfolio_reports.sql`

**Interfaces:**
- Consumes: `public.profiles`, `public.conversations` (all exist from prior migrations)
- Produces: cleaned portfolio_photos policies + conversation-scoped reports INSERT policy

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/008_fix_portfolio_reports.sql` with this exact content:

```sql
-- Remove redundant SELECT policy (covered by "Anyone can view portfolio photos")
-- and add role check to INSERT
drop policy "Prestataires can view their own photos for management" on public.portfolio_photos;
drop policy "Prestataires can insert their own photos" on public.portfolio_photos;

create policy "Prestataires can insert their own photos"
  on public.portfolio_photos for insert
  with check (
    auth.uid() = prestataire_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'prestataire'
    )
  );

-- Require reporter to be a participant in the referenced conversation
drop policy "Authenticated users can file reports" on public.reports;

create policy "Authenticated users can file reports"
  on public.reports for insert
  with check (
    auth.uid() = reporter_id
    and (
      conversation_id is null
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_id
        and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
      )
    )
  );
```

- [ ] **Step 2: Apply the migration**

Use `mcp__supabase__apply_migration` with:
- project_ref: `ueodorekpepgwpzqnezb`
- name: `008_fix_portfolio_reports`
- query: (full SQL above)

- [ ] **Step 3: Verify migration applied**

Use `mcp__supabase__list_migrations` with project_ref `ueodorekpepgwpzqnezb`.
Expected: `008_fix_portfolio_reports` appears in the list.

- [ ] **Step 4: Run tests**

```
npx vitest run
```
Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```
git add supabase/migrations/008_fix_portfolio_reports.sql
git commit -m "fix: remove redundant portfolio policy and scope reports to known conversations"
```

---

### Task 4: Frontend — ProtectedRoute component + route guards

**Issues fixed:** High — no route guards on /dashboard and /mon-profil.

**Files:**
- Create: `src/components/auth/ProtectedRoute.jsx`
- Create: `src/__tests__/ProtectedRoute.test.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/context/AuthContext.jsx` — returns `{ user, loading }`
- Produces: `ProtectedRoute` default export — a React Router layout route that wraps protected `<Route>` entries; renders `<Outlet />` when authenticated, `<Navigate to="/login" replace />` when not, nothing while loading

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/ProtectedRoute.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/auth/ProtectedRoute'

test('renders children when authenticated', () => {
  useAuth.mockReturnValue({ user: { id: 'abc' }, loading: false })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('redirects to /login when not authenticated', () => {
  useAuth.mockReturnValue({ user: null, loading: false })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Login Page')).toBeInTheDocument()
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
})

test('renders nothing while auth is loading', () => {
  useAuth.mockReturnValue({ user: null, loading: true })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/ProtectedRoute.test.jsx
```
Expected: 3 tests fail with "Cannot find module '../components/auth/ProtectedRoute'"

- [ ] **Step 3: Create ProtectedRoute component**

Create `src/components/auth/ProtectedRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/__tests__/ProtectedRoute.test.jsx
```
Expected: 3 tests pass.

- [ ] **Step 5: Update App.jsx to guard /dashboard and /mon-profil**

Replace the full content of `src/App.jsx` with:

```jsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mon-profil" element={<MonProfil />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </div>
  )
}
```

- [ ] **Step 6: Run full test suite**

```
npx vitest run
```
Expected: 11 tests pass (8 existing + 3 new), 0 fail.

- [ ] **Step 7: Commit**

```
git add src/components/auth/ProtectedRoute.jsx src/__tests__/ProtectedRoute.test.jsx src/App.jsx
git commit -m "fix: add ProtectedRoute and guard /dashboard and /mon-profil"
```

---

### Task 5: Frontend — signOut redirect + password/phone validation

**Issues fixed:** Medium — signOut has no redirect; Medium — password only HTML-validated; Medium — phone number no format validation.

**Files:**
- Modify: `src/components/layout/Navbar.jsx`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/en.json`
- Modify: `src/pages/Register.jsx`
- Modify: `src/pages/Login.jsx`

**Interfaces:**
- Consumes: `signOut()` from `useAuth()` (already returns a Promise); `useNavigate()` from react-router-dom; `t('errors.password_too_short')` and `t('errors.invalid_phone')` from i18n (already exists for invalid_phone)
- Produces: no new exports — all changes are internal to existing components

- [ ] **Step 1: Add `password_too_short` i18n key to all three locales**

In `src/locales/fr.json`, add inside `"errors"`:
```json
"password_too_short": "Le mot de passe doit contenir au moins 8 caractères"
```

In `src/locales/ar.json`, add inside `"errors"`:
```json
"password_too_short": "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل"
```

In `src/locales/en.json`, add inside `"errors"`:
```json
"password_too_short": "Password must be at least 8 characters"
```

- [ ] **Step 2: Fix signOut redirect in Navbar.jsx**

Replace the full content of `src/components/layout/Navbar.jsx` with:

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

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
              onClick={handleSignOut}
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

- [ ] **Step 3: Add phone validation helper**

The phone regex `/^\+\d{7,15}$/` validates E.164 format (e.g. `+213612345678`). This will be used inline in both Register.jsx and Login.jsx in the next steps.

- [ ] **Step 4: Update Register.jsx with password + phone validation**

Replace the full content of `src/pages/Register.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const PHONE_REGEX = /^\+\d{7,15}$/

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

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  async function handleEmailRegister(e) {
    e.preventDefault()
    if (!role) { setError(t('errors.required')); return }
    if (password.length < 8) { setError(t('errors.password_too_short')); return }
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
    if (!PHONE_REGEX.test(phone)) { setError(t('errors.invalid_phone')); return }
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
                minLength={8}
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

- [ ] **Step 5: Update Login.jsx with phone validation**

Replace the full content of `src/pages/Login.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const PHONE_REGEX = /^\+\d{7,15}$/

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

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

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
    if (!PHONE_REGEX.test(phone)) { setError(t('errors.invalid_phone')); return }
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

- [ ] **Step 6: Run full test suite**

```
npx vitest run
```
Expected: 11 tests pass, 0 fail.

- [ ] **Step 7: Commit**

```
git add src/components/layout/Navbar.jsx src/pages/Register.jsx src/pages/Login.jsx src/locales/fr.json src/locales/ar.json src/locales/en.json
git commit -m "fix: add signOut redirect, password length validation, phone format validation"
```
