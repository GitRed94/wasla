# Wasla Plan 1D — Fix + Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two real bugs (ContactSheet layout truncation + success state stale re-open) and polish two UX gaps (mobile navbar missing messages icon, PrestaireProfile hardcoded French strings).

**Architecture:** Two focused tasks, each touching one or two files. No new pages, no migrations, no new dependencies. Task 1 reworks ContactSheet to use flex layout and navigate-on-send. Task 2 adds a mobile icon to Navbar and replaces hardcoded strings in PrestaireProfile with i18n keys.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Vitest + RTL, react-i18next, React Router v6

## Global Constraints

- **NEVER** add `Co-Authored-By: Claude` to any commit message — hard constraint, no exceptions.
- Commit messages: lowercase, conventional: `feat:`, `fix:`, `chore:`.
- All user-visible strings go through `t('key')` — no hardcoded French/English/Arabic.
- 42 existing tests must keep passing after every commit. Do not delete tests; update them when behaviour changes.
- `useAuth()` from `src/context/AuthContext` returns `{ user, profile, loading, signOut }`.
- `<SelectField>` is at `src/components/ui/SelectField.jsx` — not relevant here but note it exists.
- Supabase project ID: `ueodorekpepgwpzqnezb`.

## File Map

| Status | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/components/ui/ContactSheet.jsx` | Fix flex layout, remove success state, navigate on send, reset on open |
| Modify | `src/__tests__/ContactSheet.test.jsx` | Update test 3 to assert navigate instead of success text |
| Modify | `src/components/layout/Navbar.jsx` | Add 💬/📋 icon always-visible for authenticated users on mobile |
| Modify | `src/pages/PrestaireProfile.jsx` | Replace two hardcoded French strings with `t()` calls |
| Modify | `src/locales/fr.json` | Add `profile.loading` and `profile.not_found` keys |
| Modify | `src/locales/ar.json` | Same keys in Arabic |
| Modify | `src/locales/en.json` | Same keys in English |

---

## Task 1: ContactSheet — layout fix + navigate on send

**Files:**
- Modify: `src/components/ui/ContactSheet.jsx`
- Modify: `src/__tests__/ContactSheet.test.jsx`

**Problem summary:**
1. The sheet is `height: 60vh` with `p-6` padding. The form inside uses `h-full`, meaning it tries to be 60vh tall — but it's already inside a padded container, so the Send button overflows and gets clipped on all viewports.
2. The `success` state is never reset when the sheet closes (the component stays mounted, just returns null). On re-open, it immediately shows "Message envoyé". Fix: remove `success` state entirely; navigate to the conversation instead.
3. After sending, the user lands back on the prestataire profile and has to click Contacter again. Fix: `navigate('/messages/${conv.id}')` after a successful send.

**Interfaces:**
- Consumes: `useNavigate()` from react-router-dom (already used in other pages — just add it here)
- Produces: no change in props — `{ open, onClose, prestaireId, prestaireName }` unchanged

- [ ] **Step 1: Update the failing test first**

Replace `src/__tests__/ContactSheet.test.jsx` entirely. The third test changes from asserting "Message envoyé" text to asserting `navigate` was called with the correct conversation URL:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import ContactSheet from '../components/ui/ContactSheet'

const mockNavigate = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'conv-1' }, error: null }),
  }),
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'conversations') return { upsert: mockUpsert }
      if (table === 'messages') return { insert: mockInsert }
      return {}
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
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
  mockInsert.mockClear()
  mockUpsert.mockClear()
  mockNavigate.mockClear()
})

test('renders textarea and send button when open', () => {
  render(
    <ContactSheet open={true} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  expect(screen.getByPlaceholderText(/Décrivez votre besoin/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument()
})

test('does not render when closed', () => {
  render(
    <ContactSheet open={false} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  expect(screen.queryByPlaceholderText(/Décrivez votre besoin/i)).not.toBeInTheDocument()
})

test('navigates to conversation after successful send', async () => {
  const onClose = vi.fn()
  render(
    <ContactSheet open={true} onClose={onClose} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  fireEvent.change(screen.getByPlaceholderText(/Décrivez votre besoin/i), {
    target: { value: "Bonjour, j'ai besoin de vous." },
  })
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }))
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1')
  })
  expect(onClose).toHaveBeenCalled()
  expect(mockUpsert).toHaveBeenCalled()
  expect(mockInsert).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the updated test to confirm it fails**

```
npm run test -- --run src/__tests__/ContactSheet.test.jsx
```

Expected: test 3 FAILS (current code shows success text, doesn't call navigate).

- [ ] **Step 3: Rewrite ContactSheet.jsx**

Replace `src/components/ui/ContactSheet.jsx` entirely:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ContactSheet({ open, onClose, prestaireId, prestaireName }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setMessage('')
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSend(e) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .upsert(
        { client_id: user.id, prestataire_id: prestaireId },
        { onConflict: 'client_id,prestataire_id' }
      )
      .select('id')
      .single()

    if (convErr) { setError(t('errors.generic')); setLoading(false); return }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.id, sender_id: user.id, content: message.trim() })

    if (msgErr) { setError(t('errors.generic')); setLoading(false); return }

    setLoading(false)
    onClose()
    navigate(`/messages/${conv.id}`)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 flex flex-col"
        style={{ height: '60vh' }}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <p className="font-semibold text-gray-800">{prestaireName}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1 gap-4 min-h-0">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('contact.placeholder')}
            className="flex-1 min-h-0 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-600 text-sm shrink-0">{error}</p>}
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0"
          >
            {t('contact.send')}
          </button>
        </form>
      </div>
    </div>
  )
}
```

Key changes vs original:
- Added `useNavigate` import
- Removed `success` state entirely
- Removed timer `useEffect`
- Added reset `useEffect` on `open`
- Sheet div: added `flex flex-col`
- Header div: added `shrink-0`
- Form: `flex-1 min-h-0` instead of `h-full`
- Textarea: added `min-h-0`
- Button + error: added `shrink-0`
- On success: `onClose()` + `navigate('/messages/${conv.id}')`

- [ ] **Step 4: Run ContactSheet tests to confirm all 3 pass**

```
npm run test -- --run src/__tests__/ContactSheet.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 42 passed, 0 failed.

- [ ] **Step 6: Commit**

```
git add src/components/ui/ContactSheet.jsx src/__tests__/ContactSheet.test.jsx
git commit -m "fix: ContactSheet layout truncation and navigate to conversation on send"
```

---

## Task 2: Navbar mobile icon + PrestaireProfile i18n strings

**Files:**
- Modify: `src/components/layout/Navbar.jsx`
- Modify: `src/pages/PrestaireProfile.jsx`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/en.json`

**Problem summary:**
1. Navbar: the messages/dashboard link for authenticated users is `hidden sm:block` — invisible on mobile. The 🔍 search link uses `hidden sm:inline` for its text but shows the emoji always. Apply the same pattern to the messages/dashboard link.
2. PrestaireProfile: two hardcoded French strings — `"Chargement..."` (line 34) and `"Profil introuvable."` (line 35) — violate the no-hardcoded-strings rule. They need i18n keys.

**Interfaces:**
- No change in component props or exported values — purely visual and string changes.

- [ ] **Step 1: Add i18n keys to fr.json**

In `src/locales/fr.json`, find the `"profile"` key block and add two new keys:

```json
"loading": "Chargement...",
"not_found": "Profil introuvable."
```

The profile block should look like (add at the end of the block, before the closing `}`):

```json
"profile": {
  ...existing keys...,
  "loading": "Chargement...",
  "not_found": "Profil introuvable."
}
```

- [ ] **Step 2: Add i18n keys to ar.json**

Same keys in Arabic, in the `"profile"` block:

```json
"loading": "جارٍ التحميل...",
"not_found": "الملف غير موجود."
```

- [ ] **Step 3: Add i18n keys to en.json**

Same keys in English, in the `"profile"` block:

```json
"loading": "Loading...",
"not_found": "Profile not found."
```

- [ ] **Step 4: Fix PrestaireProfile.jsx hardcoded strings**

In `src/pages/PrestaireProfile.jsx`, replace lines 34–35:

Current:
```jsx
if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>
if (!profile) return <div className="p-8 text-center text-gray-500">Profil introuvable.</div>
```

Replace with:
```jsx
if (loading) return <div className="p-8 text-center text-gray-400">{t('profile.loading')}</div>
if (!profile) return <div className="p-8 text-center text-gray-500">{t('profile.not_found')}</div>
```

- [ ] **Step 5: Fix Navbar.jsx — always-visible messages/dashboard icon**

In `src/components/layout/Navbar.jsx`, find the authenticated user block:

Current:
```jsx
<Link
  to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
  className="hidden sm:block text-sm text-gray-700 hover:text-blue-600 shrink-0"
>
  {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
</Link>
```

Replace with:
```jsx
<Link
  to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
  className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1"
>
  <span>{profile?.role === 'prestataire' ? '📋' : '💬'}</span>
  <span className="hidden sm:inline text-sm">
    {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
  </span>
</Link>
```

This mirrors the exact pattern already used for the 🔍 search link.

- [ ] **Step 6: Run full test suite**

```
npm run test -- --run
```

Expected: 42 passed, 0 failed.

- [ ] **Step 7: Commit**

```
git add src/components/layout/Navbar.jsx src/pages/PrestaireProfile.jsx src/locales/fr.json src/locales/ar.json src/locales/en.json
git commit -m "fix: mobile messages icon in navbar, i18n for PrestaireProfile loading states"
```

- [ ] **Step 8: Push**

```
git push
```
