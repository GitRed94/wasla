# Wasla Plan 1C — Messaging + Prestataire Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the client↔prestataire communication loop — prestataires can set up their profile after registration, clients see their conversation inbox, and both parties can exchange messages in real time.

**Architecture:** Five protected pages are built or replaced (MonProfil, Messages, Conversation, Dashboard). All data comes from the existing `conversations` and `messages` Supabase tables (created in migration 003, RLS already hardened). Real-time updates use a Supabase Realtime channel subscription scoped to the open conversation. No new dependencies.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Supabase JS v2, React Router v6, react-i18next, Vitest + RTL

## Global Constraints

- **Never** add `Co-Authored-By: Claude` to any commit message — this is a hard constraint.
- All user-visible strings go through `useTranslation()` / `t('key')` — no hardcoded French/English text.
- All dropdowns use `<SelectField>` from `src/components/ui/SelectField.jsx` (NOT native `<select>`).
- `useAuth()` from `src/context/AuthContext` returns `{ user, profile, loading, signOut }` where `user.id` equals `auth.uid()` and `profile.role` is `'client'` or `'prestataire'`.
- `cursor: pointer` is already globally set for `button` and `[role="button"]` in `src/index.css` — no need to add it again.
- Supabase project ID: `ueodorekpepgwpzqnezb`.
- Tests run with `npm run test -- --run`; all 30 existing tests must keep passing after every commit.
- Commit messages: lowercase, conventional: `feat:`, `fix:`, `chore:`.

## Existing Schema (read-only — do not modify these tables)

```sql
-- conversations (migration 003)
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(client_id, prestataire_id)
);
-- RLS: SELECT where client_id=uid OR prestataire_id=uid ✓
-- RLS: INSERT for clients only (hardened in migration 007) ✓

-- messages (migration 003)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz,
  is_flagged boolean default false
);
-- RLS: SELECT for conversation participants ✓
-- RLS: INSERT for participants (sender_id = auth.uid()) ✓

-- prestataire_profiles (migration 002)
-- id, display_name, bio, avatar_url, categories text[], wilaya, commune,
-- years_experience int, badge, is_visible, created_at
-- RLS: INSERT for prestataires (auth.uid()=id AND role='prestataire') ✓
-- RLS: UPDATE for prestataires (auth.uid()=id) ✓
```

## File Map

| Status | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/011_realtime_messages.sql` | Enable Supabase Realtime on messages table |
| Modify | `src/locales/fr.json` | Add messages.*, dashboard.*, profile_setup.* keys |
| Modify | `src/locales/ar.json` | Same keys in Arabic |
| Modify | `src/locales/en.json` | Same keys in English |
| Modify | `src/App.jsx` | Add `/messages` and `/messages/:id` routes inside ProtectedRoute |
| Replace | `src/pages/MonProfil.jsx` | Prestataire profile setup/edit form |
| Create | `src/__tests__/MonProfil.test.jsx` | 3 tests for MonProfil |
| Create | `src/pages/Messages.jsx` | Client conversation inbox |
| Create | `src/__tests__/Messages.test.jsx` | 3 tests for Messages |
| Create | `src/pages/Conversation.jsx` | Shared conversation view (both roles) + realtime |
| Create | `src/__tests__/Conversation.test.jsx` | 3 tests for Conversation |
| Replace | `src/pages/Dashboard.jsx` | Prestataire conversation requests |
| Create | `src/__tests__/Dashboard.test.jsx` | 3 tests for Dashboard |

---

## Task 1: i18n keys + Routes + Realtime migration

**Files:**
- Create: `supabase/migrations/011_realtime_messages.sql`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/en.json`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: i18n keys `messages.*`, `dashboard.*`, `profile_setup.*` consumed by Tasks 2–5
- Produces: routes `/messages` → `<Messages>` and `/messages/:id` → `<Conversation>` consumed by Tasks 3–4

- [ ] **Step 1: Create migration 011**

Create `supabase/migrations/011_realtime_messages.sql`:

```sql
-- Enable Supabase Realtime for messages so conversation views update live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;
```

- [ ] **Step 2: Apply migration via MCP**

Use `mcp__supabase__apply_migration` with:
- `project_id`: `ueodorekpepgwpzqnezb`
- `name`: `011_realtime_messages`
- `query`: contents of the file above

- [ ] **Step 3: Add i18n keys to fr.json**

Add the following keys to `src/locales/fr.json` (after the `"contact"` block):

```json
"messages": {
  "title": "Mes messages",
  "empty": "Aucune conversation pour le moment.",
  "type_message": "Écrire un message...",
  "send": "Envoyer",
  "you": "Vous"
},
"dashboard": {
  "title": "Tableau de bord",
  "requests": "Demandes reçues",
  "empty": "Aucune demande reçue pour le moment.",
  "client_label": "Client"
},
"profile_setup": {
  "title": "Configurer mon profil",
  "display_name": "Nom affiché",
  "bio": "Description (optionnel)",
  "bio_placeholder": "Décrivez votre expérience, vos spécialités...",
  "wilaya": "Wilaya",
  "commune": "Commune / Ville",
  "years_exp": "Années d'expérience",
  "categories": "Vos spécialités",
  "save": "Enregistrer",
  "saved": "Profil enregistré !",
  "min_one_category": "Sélectionnez au moins une spécialité."
}
```

- [ ] **Step 4: Add i18n keys to ar.json**

Add the same keys in Arabic:

```json
"messages": {
  "title": "رسائلي",
  "empty": "لا توجد محادثات بعد.",
  "type_message": "اكتب رسالة...",
  "send": "إرسال",
  "you": "أنت"
},
"dashboard": {
  "title": "لوحة التحكم",
  "requests": "الطلبات الواردة",
  "empty": "لا توجد طلبات واردة بعد.",
  "client_label": "عميل"
},
"profile_setup": {
  "title": "إعداد ملفي",
  "display_name": "الاسم المعروض",
  "bio": "نبذة (اختياري)",
  "bio_placeholder": "صف خبرتك وتخصصاتك...",
  "wilaya": "الولاية",
  "commune": "البلدية / المدينة",
  "years_exp": "سنوات الخبرة",
  "categories": "تخصصاتي",
  "save": "حفظ",
  "saved": "تم حفظ الملف!",
  "min_one_category": "اختر تخصصاً واحداً على الأقل."
}
```

- [ ] **Step 5: Add i18n keys to en.json**

```json
"messages": {
  "title": "My messages",
  "empty": "No conversations yet.",
  "type_message": "Type a message...",
  "send": "Send",
  "you": "You"
},
"dashboard": {
  "title": "Dashboard",
  "requests": "Received requests",
  "empty": "No requests received yet.",
  "client_label": "Client"
},
"profile_setup": {
  "title": "Set up my profile",
  "display_name": "Display name",
  "bio": "About me (optional)",
  "bio_placeholder": "Describe your experience and specialties...",
  "wilaya": "Wilaya",
  "commune": "Commune / City",
  "years_exp": "Years of experience",
  "categories": "Your specialties",
  "save": "Save",
  "saved": "Profile saved!",
  "min_one_category": "Select at least one specialty."
}
```

- [ ] **Step 6: Update App.jsx to add missing routes**

Current `src/App.jsx` has no `/messages` or `/messages/:id` routes. Replace the full file:

```jsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Search from './pages/Search'
import PrestaireProfile from './pages/PrestaireProfile'
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/prestataire/:id" element={<PrestaireProfile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mon-profil" element={<MonProfil />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
        </Route>
      </Routes>
    </div>
  )
}
```

- [ ] **Step 7: Run tests to confirm no regression**

```
npm run test -- --run
```

Expected: 30 passed (10 test files).

- [ ] **Step 8: Commit**

```
git add supabase/migrations/011_realtime_messages.sql src/locales/fr.json src/locales/ar.json src/locales/en.json src/App.jsx
git commit -m "feat: add messaging i18n keys, routes, and realtime migration"
```

---

## Task 2: Prestataire Profile Setup (/mon-profil)

**Files:**
- Replace: `src/pages/MonProfil.jsx`
- Create: `src/__tests__/MonProfil.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, profile }`, CATEGORIES from `src/data/categories.js`, WILAYAS from `src/data/wilayas.js`, `<SelectField>` from `src/components/ui/SelectField.jsx`
- Consumes: i18n keys `profile_setup.*` (from Task 1)
- Produces: `/mon-profil` page usable after prestataire registration

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/MonProfil.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfil from '../pages/MonProfil'

const mockUpsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: mockUpsert,
        }
      }
      return {}
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' }, profile: { role: 'prestataire' } }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockUpsert.mockClear()
})

test('shows setup form when no profile exists', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/Nom affiché/i)).toBeInTheDocument()
  })
})

test('shows category checkboxes', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Plombier/i)).toBeInTheDocument()
    expect(screen.getByText(/Électricien/i)).toBeInTheDocument()
  })
})

test('submit calls supabase upsert', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/Nom affiché/i))

  fireEvent.change(screen.getByLabelText(/Nom affiché/i), { target: { value: 'Karim Pro' } })
  fireEvent.change(screen.getByLabelText(/Commune/i), { target: { value: 'Alger Centre' } })

  // Select at least one category checkbox
  const checkboxes = screen.getAllByRole('checkbox')
  fireEvent.click(checkboxes[0])

  fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
  await waitFor(() => {
    expect(mockUpsert).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: FAIL (MonProfil is a stub).

- [ ] **Step 3: Implement MonProfil.jsx**

Replace `src/pages/MonProfil.jsx` entirely:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

export default function MonProfil() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [commune, setCommune] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('prestataire_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setDisplayName(data.display_name ?? '')
        setBio(data.bio ?? '')
        setWilaya(data.wilaya ?? '')
        setCommune(data.commune ?? '')
        setYearsExp(data.years_experience?.toString() ?? '')
        setCategories(data.categories ?? [])
      }
      setFetching(false)
    }
    fetchProfile()
  }, [user.id])

  function toggleCategory(key) {
    setCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError(t('errors.required')); return }
    if (!wilaya) { setError(t('errors.required')); return }
    if (!commune.trim()) { setError(t('errors.required')); return }
    if (categories.length === 0) { setError(t('profile_setup.min_one_category')); return }
    setError('')
    setLoading(true)
    const { error: upsertError } = await supabase
      .from('prestataire_profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        wilaya,
        commune: commune.trim(),
        years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
        categories,
        is_visible: true,
      })
    setLoading(false)
    if (upsertError) {
      setError(t('errors.generic'))
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile_setup.title')}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4 font-medium">{t('profile_setup.saved')}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile_setup.display_name')} *
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile_setup.wilaya')} *
          </label>
          <SelectField
            value={wilaya}
            onChange={setWilaya}
            placeholder={t('search.all_wilayas')}
            options={wilayaOptions}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile_setup.commune')} *
          </label>
          <input
            id="commune"
            type="text"
            value={commune}
            onChange={e => setCommune(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="years-exp" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile_setup.years_exp')}
          </label>
          <input
            id="years-exp"
            type="number"
            min="0"
            max="60"
            value={yearsExp}
            onChange={e => setYearsExp(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile_setup.categories')} *
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <label
                key={cat.key}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                  categories.includes(cat.key)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat.key)}
                  onChange={() => toggleCategory(cat.key)}
                  className="accent-blue-600 shrink-0"
                />
                <span>{cat.emoji} {t(`categories.${cat.key}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile_setup.bio')}
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={t('profile_setup.bio_placeholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : t('profile_setup.save')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 33 passed (30 + 3 new).

- [ ] **Step 6: Commit**

```
git add src/pages/MonProfil.jsx src/__tests__/MonProfil.test.jsx
git commit -m "feat: prestataire profile setup and edit form"
```

---

## Task 3: Client Messages Inbox (/messages)

**Files:**
- Create: `src/pages/Messages.jsx`
- Create: `src/__tests__/Messages.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user }`, i18n keys `messages.*` (Task 1), route `/messages/:id` (Task 1)
- Produces: `/messages` page listing client conversations, each linking to `/messages/:id`

**Data shape returned by Supabase query:**
```js
[
  {
    id: 'conv-uuid',
    prestataire_id: 'p-uuid',
    created_at: '2026-06-24T10:00:00Z',
    prestataire_profiles: { display_name: 'Karim Benali', avatar_url: null },
    messages: [
      { id: 'm-uuid', content: 'Bonjour...', created_at: '2026-06-24T10:05:00Z', sender_id: 'u-uuid' }
    ]
  }
]
```

`prestataire_profiles` is an object (not array) because `conversations.prestataire_id` has a direct FK to `prestataire_profiles.id`.
`messages` is an array of all messages in the conversation — sort descending and take index 0 to get the last message.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Messages.test.jsx`:

```jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Messages from '../pages/Messages'

const mockData = [
  {
    id: 'conv-1',
    prestataire_id: 'p-1',
    created_at: '2026-06-24T09:00:00Z',
    prestataire_profiles: { display_name: 'Karim Benali', avatar_url: null },
    messages: [
      { id: 'm-1', content: 'Bonjour, j\'ai besoin de vous.', created_at: '2026-06-24T09:05:00Z', sender_id: 'u-1' },
    ],
  },
]

vi.mock('../supabaseClient', () => {
  const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { supabase: { from: vi.fn().mockReturnValue({ select: mockSelect }) } }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/messages']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/messages" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockNavigate.mockClear() })

test('shows conversation list with prestataire name and last message', async () => {
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText(/Bonjour, j'ai besoin de vous/i)).toBeInTheDocument()
  })
})

test('shows empty state when no conversations', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Aucune conversation/i)).toBeInTheDocument()
  })
})

test('clicking a conversation navigates to /messages/:id', async () => {
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Karim Benali'))
  fireEvent.click(screen.getByText('Karim Benali'))
  expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1')
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
npm run test -- --run src/__tests__/Messages.test.jsx
```

Expected: FAIL (Messages.jsx does not exist).

- [ ] **Step 3: Implement Messages.jsx**

Create `src/pages/Messages.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id,
          prestataire_id,
          created_at,
          prestataire_profiles ( display_name, avatar_url ),
          messages ( id, content, created_at, sender_id )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setConversations(data ?? [])
      setLoading(false)
    }
    fetchConversations()
  }, [user.id])

  function getLastMsg(msgs) {
    if (!msgs?.length) return null
    return [...msgs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">{t('messages.title')}</h1>

      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('messages.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map(conv => {
            const presta = conv.prestataire_profiles
            const lastMsg = getLastMsg(conv.messages)
            return (
              <li key={conv.id}>
                <button
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-lg">
                    {presta?.avatar_url
                      ? <img src={presta.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      : '👤'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{presta?.display_name ?? '—'}</p>
                    {lastMsg && (
                      <p className="text-sm text-gray-500 truncate">
                        {lastMsg.sender_id === user.id ? `${t('messages.you')}: ` : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  {lastMsg && (
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg.created_at)}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```
npm run test -- --run src/__tests__/Messages.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 36 passed.

- [ ] **Step 6: Commit**

```
git add src/pages/Messages.jsx src/__tests__/Messages.test.jsx
git commit -m "feat: client messages inbox"
```

---

## Task 4: Conversation View (/messages/:id)

**Files:**
- Create: `src/pages/Conversation.jsx`
- Create: `src/__tests__/Conversation.test.jsx`

**Interfaces:**
- Consumes: `useParams()` → `id` (conversation UUID), `useAuth()` → `{ user }`, i18n keys `messages.*` (Task 1)
- Consumes: Supabase Realtime (migration 011 from Task 1)
- Produces: `/messages/:id` shared conversation view used by both client and prestataire

**Supabase queries used:**
1. Fetch conversation metadata: `from('conversations').select('id, client_id, prestataire_id, prestataire_profiles!prestataire_id(display_name)').eq('id', id).single()`
2. Fetch messages: `from('messages').select('id, content, sender_id, created_at').eq('conversation_id', id).order('created_at', {ascending:true})`
3. Send message: `from('messages').insert({ conversation_id: id, sender_id: user.id, content })`
4. Realtime: `supabase.channel('conv:id').on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:'conversation_id=eq.'+id }, cb).subscribe()`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Conversation.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Conversation from '../pages/Conversation'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'conv-1', client_id: 'u-1', prestataire_id: 'p-1', prestataire_profiles: { display_name: 'Karim Benali' } },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'messages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'm-1', content: 'Bonjour Karim', sender_id: 'u-1', created_at: '2026-06-24T10:00:00Z' },
                  { id: 'm-2', content: 'Bonjour, comment puis-je vous aider ?', sender_id: 'p-1', created_at: '2026-06-24T10:01:00Z' },
                ],
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        }
      }
      return {}
    }),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/messages/conv-1']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/messages/:id" element={children} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockInsert.mockClear() })

test('renders messages from both parties', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Bonjour Karim')).toBeInTheDocument()
    expect(screen.getByText('Bonjour, comment puis-je vous aider ?')).toBeInTheDocument()
  })
})

test('send button and textarea are present', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Bonjour Karim'))
  expect(screen.getByPlaceholderText(/Écrire un message/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument()
})

test('sending a message calls supabase insert', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Bonjour Karim'))
  fireEvent.change(screen.getByPlaceholderText(/Écrire un message/i), {
    target: { value: 'Je reviens demain.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }))
  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Je reviens demain.', sender_id: 'u-1', conversation_id: 'conv-1' })
    )
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
npm run test -- --run src/__tests__/Conversation.test.jsx
```

Expected: FAIL (Conversation.jsx does not exist).

- [ ] **Step 3: Implement Conversation.jsx**

Create `src/pages/Conversation.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Conversation() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [{ data: convData }, { data: msgs }] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, client_id, prestataire_id, prestataire_profiles!prestataire_id(display_name)')
          .eq('id', id)
          .single(),
        supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true }),
      ])
      if (!convData) { navigate('/messages'); return }
      setConv(convData)
      setMessages(msgs ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id, navigate])

  useEffect(() => {
    const channel = supabase
      .channel(`conv:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content,
    })
    setSending(false)
  }

  function otherPartyName() {
    if (!conv) return ''
    if (user.id === conv.client_id) return conv.prestataire_profiles?.display_name ?? '—'
    return t('dashboard.client_label')
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <main className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-lg">←</button>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">👤</div>
        <span className="font-medium text-gray-900 truncate">{otherPartyName()}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('messages.type_message')}
          className="flex-1 min-w-0 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          {t('messages.send')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```
npm run test -- --run src/__tests__/Conversation.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 39 passed.

- [ ] **Step 6: Commit**

```
git add src/pages/Conversation.jsx src/__tests__/Conversation.test.jsx
git commit -m "feat: conversation view with real-time messaging"
```

---

## Task 5: Prestataire Dashboard (/dashboard)

**Files:**
- Replace: `src/pages/Dashboard.jsx`
- Create: `src/__tests__/Dashboard.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user }`, i18n keys `dashboard.*` (Task 1), route `/messages/:id` (Task 1)
- Produces: `/dashboard` page showing prestataire's incoming conversations, each linking to `/messages/:id`

**Data shape:** Same as Task 3 (Messages) but queried from the prestataire's perspective (`eq('prestataire_id', user.id)`). The `messages` array on each conversation is sorted to find the last message. No `prestataire_profiles` join is needed (we show the first message as the conversation summary).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/Dashboard.test.jsx`:

```jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Dashboard from '../pages/Dashboard'

const mockData = [
  {
    id: 'conv-1',
    client_id: 'c-1',
    created_at: '2026-06-24T09:00:00Z',
    messages: [
      { id: 'm-1', content: 'Bonjour, robinet cassé.', created_at: '2026-06-24T09:05:00Z', sender_id: 'c-1' },
    ],
  },
]

vi.mock('../supabaseClient', () => {
  const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { supabase: { from: vi.fn().mockReturnValue({ select: mockSelect }) } }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'p-1' } }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/dashboard" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockNavigate.mockClear() })

test('shows conversation requests with last message preview', async () => {
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/robinet cassé/i)).toBeInTheDocument()
  })
})

test('shows empty state when no requests', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Aucune demande/i)).toBeInTheDocument()
  })
})

test('clicking a request navigates to /messages/:id', async () => {
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText(/robinet cassé/i))
  fireEvent.click(screen.getByText(/robinet cassé/i))
  expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1')
})
```

- [ ] **Step 2: Run test to confirm it fails**

```
npm run test -- --run src/__tests__/Dashboard.test.jsx
```

Expected: FAIL (Dashboard is a stub).

- [ ] **Step 3: Implement Dashboard.jsx**

Replace `src/pages/Dashboard.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id,
          client_id,
          created_at,
          messages ( id, content, created_at, sender_id )
        `)
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false })
      setConversations(data ?? [])
      setLoading(false)
    }
    fetchConversations()
  }, [user.id])

  function getLastMsg(msgs) {
    if (!msgs?.length) return null
    return [...msgs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.title')}</h1>
      <p className="text-sm text-gray-500 mb-5">{t('dashboard.requests')}</p>

      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('dashboard.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map(conv => {
            const lastMsg = getLastMsg(conv.messages)
            return (
              <li key={conv.id}>
                <button
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-lg">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{t('dashboard.client_label')}</p>
                    {lastMsg && (
                      <p className="text-sm text-gray-500 truncate">{lastMsg.content}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg.created_at)}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```
npm run test -- --run src/__tests__/Dashboard.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 42 passed (30 original + 12 new across 4 tasks).

- [ ] **Step 6: Commit**

```
git add src/pages/Dashboard.jsx src/__tests__/Dashboard.test.jsx
git commit -m "feat: prestataire dashboard with conversation requests"
```

- [ ] **Step 7: Push to production**

```
git push
```

Vercel deploys automatically on push to main.
