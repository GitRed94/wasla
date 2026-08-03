# Wasla Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire Wasla app to the approved design system (Uber/Airbnb/Doctolib-style: blue+green palette, Inter font, rounded cards, Lucide icons, mobile bottom nav), and restructure the two profile pages into tabbed "ribbon" layouts with an upgraded 3-field password-change flow — no new backend fields, no new integrations.

**Architecture:** Foundation first (design tokens, shared UI kit, icon library), then structural pieces that other pages depend on (BottomNav, PasswordChangeForm), then the two profile-page rewrites that consume those pieces, then batch restyle passes over the remaining pages grouped by area (browsing, messaging, auth). Each task keeps the 53 existing tests green and adds new tests where new behavior is introduced.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4 (`@theme` tokens), Vitest + RTL, react-i18next (FR/AR/EN), React Router v7, Supabase JS v2, new dependency: `lucide-react`.

## Global Constraints

- **NEVER** add `Co-Authored-By: Claude` to any commit message — hard constraint, no exceptions.
- Commit messages: lowercase, conventional: `feat:`, `fix:`, `chore:`, `refactor:`.
- All user-visible strings go through `t('key')` — no hardcoded French/English/Arabic. (Note: the current password-change section in `MonProfil.jsx`/`MonProfilClient.jsx` hardcodes French strings — this plan fixes that as part of the rewrite.)
- 53 existing tests must keep passing after every task. Do not delete tests; update them when behaviour changes.
- `useAuth()` from `src/context/AuthContext` returns `{ user, profile, loading, signOut }` — no `session`/password helpers, so re-authentication in the password flow calls `supabase.auth.signInWithPassword` directly.
- Supabase project ID: `ueodorekpepgwpzqnezb`.
- Design tokens (from spec `docs/superpowers/specs/2026-08-04-wasla-design-overhaul-design.md`): `--color-primary #2563EB`, `--color-secondary #10B981`, `--color-surface #FFFFFF`, `--color-surface-muted #F3F4F6`, `--color-text #1F2937`, `--radius-card 18px`, font `Inter` with `Noto Kufi Arabic` fallback for `ar`.
- Vitest hoisting: `vi.mock()` is hoisted before variable initialization — inline mock data in factory functions or use `vi.hoisted()`.

## File Map

| Status | Path | Responsibility |
|--------|------|---------------|
| Modify | `index.html` | Google Fonts `<link>` for Inter + Noto Kufi Arabic |
| Modify | `src/index.css` | `@theme` tokens, base font-family |
| Modify | `package.json` | Add `lucide-react` dependency |
| Create | `src/components/ui/Button.jsx` | Primary/secondary button variants |
| Create | `src/components/ui/Card.jsx` | Rounded/shadow wrapper |
| Create | `src/components/ui/Skeleton.jsx` | Loading placeholder |
| Create | `src/components/ui/Badge.jsx` | Pill label (restyle of existing badge concept) |
| Create | `src/components/ui/Tabs.jsx` | Ribbon tab strip |
| Create | `src/components/ui/BottomNav.jsx` | Mobile fixed bottom tab bar |
| Create | `src/components/ui/PasswordChangeForm.jsx` | Shared 3-field password change w/ re-auth |
| Modify | `src/data/categories.js` | Emoji → Lucide icon key per category |
| Modify | `src/__tests__/data.test.js` | Update category icon assertions |
| Modify | `src/components/layout/Navbar.jsx` | Desktop restyle; mounts `BottomNav` on mobile |
| Modify | `src/App.jsx` | Bottom padding on mobile so content clears `BottomNav` |
| Modify | `src/pages/MonProfil.jsx` | Ribbon/tabs restructure + `PasswordChangeForm` + restyle |
| Modify | `src/pages/MonProfilClient.jsx` | Ribbon/tabs restructure + `PasswordChangeForm` + restyle |
| Modify | `src/__tests__/MonProfil.test.jsx` | Update for tabbed layout |
| Modify | `src/__tests__/MonProfilClient.test.jsx` | Update for tabbed layout |
| Modify | `src/pages/Home.jsx` | Restyle |
| Modify | `src/components/ui/PrestaCard.jsx` | Restyle |
| Modify | `src/pages/Search.jsx` | Restyle |
| Modify | `src/pages/PrestaireProfile.jsx` | Restyle |
| Modify | `src/pages/Dashboard.jsx` | Restyle |
| Modify | `src/pages/Messages.jsx` | Restyle |
| Modify | `src/pages/Conversation.jsx` | Restyle |
| Modify | `src/components/ui/ContactSheet.jsx` | Restyle |
| Modify | `src/pages/Login.jsx` | Restyle (targeted) |
| Modify | `src/pages/Register.jsx` | Restyle (targeted) |
| Modify | `src/locales/fr.json`, `ar.json`, `en.json` | New keys: `account.*`, `profile_setup.tab_*` |

---

## Task 1: Design tokens + font

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Produces: Tailwind utilities `bg-primary`, `text-primary`, `border-primary`, `bg-secondary`, `text-secondary`, `bg-surface`, `bg-surface-muted`, `text-text`, `rounded-card` — consumed by every later task.

No new test (pure CSS/config) — verified by running the full suite and a manual visual check later. This mirrors how DB migrations were handled in Plan 1E (apply + verify, no unit test).

- [ ] **Step 1: Add Google Fonts link**

In `index.html`, add inside `<head>`, after the viewport meta tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Define theme tokens**

Replace `src/index.css` entirely:

```css
@import "tailwindcss";

@theme {
  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-secondary: #10B981;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F3F4F6;
  --color-text: #1F2937;
  --radius-card: 18px;
  --font-sans: "Inter", "Noto Kufi Arabic", sans-serif;
}

@layer base {
  button, [role="button"] { cursor: pointer; }
  body { font-family: var(--font-sans); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@layer utilities {
  .animate-fade-in { animation: fade-in 0.2s ease-out; }
}
```

- [ ] **Step 3: Run full suite**

```
npm run test
```

Expected: 53 passed, 0 failed (CSS-only change, no test should reference these tokens yet).

- [ ] **Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "feat: design tokens (blue/green palette, Inter font) via Tailwind v4 theme"
```

---

## Task 2: Shared UI kit — Button, Card, Skeleton, Badge

**Files:**
- Create: `src/components/ui/Button.jsx`
- Create: `src/components/ui/Card.jsx`
- Create: `src/components/ui/Skeleton.jsx`
- Create: `src/components/ui/Badge.jsx`
- Test: `src/__tests__/Button.test.jsx`
- Test: `src/__tests__/Card.test.jsx`

**Interfaces:**
- Produces: `<Button variant="primary"|"secondary" loading? disabled? type? onClick? className?>` (renders a `<button>`), `<Card className?>` (renders a `<div>`), `<Skeleton className?>` (renders a `<div>` with pulse animation), `<Badge tone="gray"|"blue"|"amber"|"green">` (renders a `<span>`).

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/Button.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Button from '../components/ui/Button'

test('renders children and handles click', () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Envoyer</Button>)
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('secondary variant applies outline styling', () => {
  render(<Button variant="secondary">Annuler</Button>)
  expect(screen.getByRole('button', { name: 'Annuler' }).className).toMatch(/border-primary/)
})

test('loading disables the button and shows a spinner', () => {
  render(<Button loading>Enregistrer</Button>)
  const btn = screen.getByRole('button')
  expect(btn).toBeDisabled()
  expect(btn.querySelector('svg')).toBeInTheDocument()
})

test('forwards extra props like data-testid to the underlying button', () => {
  render(<Button data-testid="contact-btn">Contacter</Button>)
  expect(screen.getByTestId('contact-btn')).toBeInTheDocument()
})
```

Create `src/__tests__/Card.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import Card from '../components/ui/Card'

test('renders children inside a rounded card', () => {
  render(<Card>Contenu</Card>)
  const el = screen.getByText('Contenu')
  expect(el.className).toMatch(/rounded-card/)
})

test('merges extra className', () => {
  render(<Card className="mb-4">X</Card>)
  expect(screen.getByText('X').className).toMatch(/mb-4/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm run test -- --run src/__tests__/Button.test.jsx src/__tests__/Card.test.jsx
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Implement `Button.jsx`**

```jsx
export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  children,
  ...rest
}) {
  const base = 'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-surface text-primary border border-primary hover:bg-surface-muted',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
```

Note the `...rest` spread: `PrestaireProfile.jsx` (Task 10) passes `data-testid="contact-btn"` through to the underlying `<button>` for existing tests to query — without this spread that attribute would be silently dropped and break `PrestaireProfile.test.jsx`.

- [ ] **Step 4: Implement `Card.jsx`**

```jsx
export default function Card({ className = '', children, ...rest }) {
  return (
    <div className={`bg-surface rounded-card shadow-sm animate-fade-in ${className}`} {...rest}>
      {children}
    </div>
  )
}
```

`animate-fade-in` is the keyframe utility defined in Task 1's `index.css` — every `Card` fades in on mount by default, matching spec §9.

- [ ] **Step 5: Implement `Skeleton.jsx`**

```jsx
export default function Skeleton({ className = '' }) {
  return <div className={`bg-surface-muted rounded-card animate-pulse ${className}`} />
}
```

- [ ] **Step 6: Implement `Badge.jsx`**

```jsx
const TONES = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-primary',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-secondary',
}

export default function Badge({ tone = 'gray', className = '', children }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 7: Run tests to verify they pass**

```
npm run test -- --run src/__tests__/Button.test.jsx src/__tests__/Card.test.jsx
```

Expected: 7 passed.

- [ ] **Step 8: Run full suite and commit**

```bash
npm run test
git add src/components/ui/Button.jsx src/components/ui/Card.jsx src/components/ui/Skeleton.jsx src/components/ui/Badge.jsx src/__tests__/Button.test.jsx src/__tests__/Card.test.jsx
git commit -m "feat: shared Button, Card, Skeleton, Badge UI primitives"
```

---

## Task 3: `Tabs` component (the "ribbon")

**Files:**
- Create: `src/components/ui/Tabs.jsx`
- Test: `src/__tests__/Tabs.test.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `<Tabs items={[{ key, label }]} active={key} onChange={(key) => void} />` — controlled component, no internal routing. Consumed by Task 8 (`MonProfil.jsx`) and Task 9 (`MonProfilClient.jsx`).

- [ ] **Step 1: Write failing test**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Tabs from '../components/ui/Tabs'

const items = [
  { key: 'profile', label: 'Configurer mon profil' },
  { key: 'account', label: 'Mon Compte' },
  { key: 'portfolio', label: 'Photos de réalisations' },
]

test('renders all tab labels', () => {
  render(<Tabs items={items} active="profile" onChange={vi.fn()} />)
  expect(screen.getByRole('tab', { name: 'Configurer mon profil' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Mon Compte' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Photos de réalisations' })).toBeInTheDocument()
})

test('marks the active tab and calls onChange on click', () => {
  const onChange = vi.fn()
  render(<Tabs items={items} active="profile" onChange={onChange} />)
  expect(screen.getByRole('tab', { name: 'Configurer mon profil' })).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(screen.getByRole('tab', { name: 'Mon Compte' }))
  expect(onChange).toHaveBeenCalledWith('account')
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run test -- --run src/__tests__/Tabs.test.jsx
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `Tabs.jsx`**

```jsx
export default function Tabs({ items, active, onChange }) {
  return (
    <div role="tablist" className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      {items.map(item => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npm run test -- --run src/__tests__/Tabs.test.jsx
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Tabs.jsx src/__tests__/Tabs.test.jsx
git commit -m "feat: add Tabs ribbon component"
```

---

## Task 4: `lucide-react` + category icon mapping

**Files:**
- Modify: `package.json` (add dependency)
- Modify: `src/data/categories.js`
- Modify: `src/__tests__/data.test.js`

**Interfaces:**
- Produces: each `CATEGORIES` entry gains an `icon` field (a Lucide component reference) alongside the existing `emoji` field. **`emoji` is kept** (not removed) because `t()`-driven category select-option labels elsewhere still read `cat.emoji` in this task's scope — Task 10 swaps those call sites to `cat.icon` and only then is `emoji` actually dead code; removing it here would break Task 10's diff base. Task 10 removes `emoji` once every call site is migrated.

- [ ] **Step 1: Install dependency**

```bash
npm install lucide-react
```

- [ ] **Step 2: Update the data test first**

In `src/__tests__/data.test.js`, find the assertion that checks each category has an `emoji` string and add an `icon` check alongside it (read the existing test file to match its exact structure before editing — it currently asserts `CATEGORIES.length === 19` and that each entry has `key`, `emoji`, `cluster`). Add:

```js
test('every category has an icon component', () => {
  CATEGORIES.forEach(cat => {
    expect(cat.icon).toBeDefined()
  })
})
```

- [ ] **Step 3: Run to verify it fails**

```
npm run test -- --run src/__tests__/data.test.js
```

Expected: FAIL — `cat.icon` is undefined.

- [ ] **Step 4: Add Lucide icon imports and mapping**

At the top of `src/data/categories.js`, add imports and an `icon` field per entry:

```js
import {
  Wrench, Zap, Snowflake, Refrigerator, Construction, Grid3x3, Home,
  Paintbrush, PaintBucket, Hammer, DoorOpen, KeyRound, SquareStack,
  Camera, ShieldAlert, Plug, Sun, Laptop, Smartphone,
} from 'lucide-react'

export const CATEGORIES = [
  { key: 'plombier',             emoji: '🔧', icon: Wrench,        cluster: 'plomberie' },
  { key: 'electricien',          emoji: '⚡', icon: Zap,           cluster: 'electricite' },
  { key: 'climaticien',          emoji: '❄️', icon: Snowflake,     cluster: 'froid' },
  { key: 'frigoriste',           emoji: '🧊', icon: Refrigerator,  cluster: 'froid' },
  { key: 'macon',                emoji: '🧱', icon: Construction,  cluster: 'gros_oeuvre' },
  { key: 'carreleur',            emoji: '🪨', icon: Grid3x3,       cluster: 'gros_oeuvre' },
  { key: 'etancheur',            emoji: '🏚️', icon: Home,         cluster: 'gros_oeuvre' },
  { key: 'peintre',              emoji: '🖌️', icon: Paintbrush,   cluster: 'finitions' },
  { key: 'platrier',             emoji: '🏗️', icon: PaintBucket,  cluster: 'finitions' },
  { key: 'menuisier',            emoji: '🪵', icon: Hammer,        cluster: 'finitions' },
  { key: 'menuisier_alu',        emoji: '🪟', icon: DoorOpen,      cluster: 'finitions' },
  { key: 'serrurier',            emoji: '🔑', icon: KeyRound,      cluster: 'finitions' },
  { key: 'vitrier',              emoji: '🔲', icon: SquareStack,   cluster: 'finitions' },
  { key: 'cameras',              emoji: '📷', icon: Camera,        cluster: 'securite' },
  { key: 'alarmes',              emoji: '🚨', icon: ShieldAlert,   cluster: 'securite' },
  { key: 'electromenager',       emoji: '🔌', icon: Plug,          cluster: 'equipements' },
  { key: 'panneaux_solaires',    emoji: '☀️', icon: Sun,          cluster: 'equipements' },
  { key: 'informaticien',        emoji: '💻', icon: Laptop,        cluster: 'informatique' },
  { key: 'reparation_telephone', emoji: '📱', icon: Smartphone,    cluster: 'informatique' },
]
```

(Leave `CATEGORY_CLUSTERS` and `INCOMPATIBLE_PAIRS` untouched.)

- [ ] **Step 5: Run to verify it passes**

```
npm run test -- --run src/__tests__/data.test.js
```

Expected: all `data.test.js` tests pass.

- [ ] **Step 6: Run full suite and commit**

```bash
npm run test
git add package.json package-lock.json src/data/categories.js src/__tests__/data.test.js
git commit -m "feat: add lucide-react and per-category icon mapping"
```

---

## Task 5: `BottomNav` component

**Files:**
- Create: `src/components/ui/BottomNav.jsx`
- Test: `src/__tests__/BottomNav.test.jsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, profile }`; `lucide-react` icons `Home, Search, ClipboardList, MessageCircle, User` (added in Task 4).
- Produces: `<BottomNav />` — reads route/role internally, no props. Consumed by Task 6 (`Navbar.jsx`).

Per spec §7: 4 items, the 3rd role-aware (`/dashboard` for prestataire vs `/messages` for client). Unauthenticated users see `Accueil`, `Recherche`, and a `Connexion` item in place of the 3rd/4th slots.

- [ ] **Step 1: Write failing tests**

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BottomNav from '../components/ui/BottomNav'

let mockAuth = { user: null, profile: null }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

function renderNav() {
  return render(<BottomNav />, { wrapper: MemoryRouter })
}

test('guest sees Accueil, Recherche, and Connexion', () => {
  mockAuth = { user: null, profile: null }
  renderNav()
  expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: /rechercher/i })).toHaveAttribute('href', '/search')
  expect(screen.getByRole('link', { name: /connexion/i })).toHaveAttribute('href', '/login')
})

test('prestataire sees dashboard and presta profile links', () => {
  mockAuth = { user: { id: 'u1' }, profile: { role: 'prestataire' } }
  renderNav()
  expect(screen.getByRole('link', { name: /tableau de bord/i })).toHaveAttribute('href', '/dashboard')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-presta')
})

test('client sees messages and client profile links', () => {
  mockAuth = { user: { id: 'u2' }, profile: { role: 'client' } }
  renderNav()
  expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute('href', '/messages')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-client')
})
```

- [ ] **Step 2: Run to verify it fails**

```
npm run test -- --run src/__tests__/BottomNav.test.jsx
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `BottomNav.jsx`**

```jsx
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search, ClipboardList, MessageCircle, User, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const location = useLocation()
  const isPresta = profile?.role === 'prestataire'

  const items = [
    { key: 'home', to: '/', icon: Home, label: t('nav.home') },
    { key: 'search', to: '/search', icon: Search, label: t('nav.search') },
    user
      ? isPresta
        ? { key: 'dashboard', to: '/dashboard', icon: ClipboardList, label: t('nav.dashboard') }
        : { key: 'messages', to: '/messages', icon: MessageCircle, label: t('nav.messages') }
      : { key: 'login', to: '/login', icon: LogIn, label: t('nav.login') },
    user
      ? { key: 'profile', to: isPresta ? '/mon-profil-presta' : '/mon-profil-client', icon: User, label: t('nav.my_profile') }
      : null,
  ].filter(Boolean)

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 flex justify-around z-40">
      {items.map(item => {
        const Icon = item.icon
        const active = location.pathname === item.to
        return (
          <Link
            key={item.key}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${active ? 'text-primary' : 'text-gray-500'}`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

```
npm run test -- --run src/__tests__/BottomNav.test.jsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/BottomNav.jsx src/__tests__/BottomNav.test.jsx
git commit -m "feat: add mobile BottomNav component"
```

---

## Task 6: Navbar restyle + mount `BottomNav`

**Files:**
- Modify: `src/components/layout/Navbar.jsx`
- Modify: `src/App.jsx`
- Modify: `src/__tests__` — check existing Navbar-related assertions still pass (Navbar has no dedicated test file today; covered indirectly by page tests that render the full app shell — verify in Step 4).

**Interfaces:**
- Consumes: `BottomNav` (Task 5).

- [ ] **Step 1: Replace `Navbar.jsx`**

The desktop nav keeps its current structure/links but restyled to tokens; the per-item mobile-icon links (previously `hidden sm:inline` text) are removed since mobile now uses `BottomNav` entirely — desktop nav becomes `hidden sm:flex`:

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import BottomNav from '../ui/BottomNav'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) setSigningOut(false)
  }, [user])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

  return (
    <>
      <nav className="hidden sm:flex bg-surface border-b border-gray-200 px-4 py-3 items-center justify-between gap-2">
        <Link to="/" className="text-lg sm:text-xl font-bold text-primary shrink-0">
          {t('app_name')}
        </Link>

        <div className="flex items-center gap-4 shrink-0">
          <Link to="/search" className="text-gray-700 hover:text-primary flex items-center gap-1 text-sm">
            <Search size={16} /> {t('nav.search')}
          </Link>

          {user ? (
            <>
              <Link
                to={profile?.role === 'prestataire' ? '/mon-profil-presta' : '/mon-profil-client'}
                className="text-gray-700 hover:text-primary text-sm"
              >
                {t('nav.my_profile')}
              </Link>
              <Link
                to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
                className="text-gray-700 hover:text-primary text-sm"
              >
                {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                title={t('nav.logout')}
                className="text-gray-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                {signingOut
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <LogOut size={16} />
                }
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-primary">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark">
                {t('nav.register')}
              </Link>
            </>
          )}

          <LanguageSwitcher />
        </div>
      </nav>

      <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-gray-200">
        <Link to="/" className="text-lg font-bold text-primary">{t('app_name')}</Link>
        <LanguageSwitcher />
      </div>

      <BottomNav />
    </>
  )
}
```

- [ ] **Step 2: Add bottom padding on mobile so `BottomNav` never overlaps page content**

In `src/App.jsx`, change the wrapping `<div>` className:

```jsx
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-16 sm:pb-0">
```

(was: `className="min-h-screen bg-gray-50 overflow-x-hidden"`)

- [ ] **Step 3: Run full suite**

```
npm run test
```

Expected: 53+ passed (from Tasks 1-5), 0 failed. If any existing test queries a Navbar link by text that moved (e.g. a test that asserted the mobile-only emoji span), fix that test's query to match the new structure — read the failing test output before editing.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.jsx src/App.jsx
git commit -m "feat: restyle Navbar for desktop, mount BottomNav on mobile"
```

---

## Task 7: `PasswordChangeForm` shared component

**Files:**
- Create: `src/components/ui/PasswordChangeForm.jsx`
- Test: `src/__tests__/PasswordChangeForm.test.jsx`
- Modify: `src/locales/fr.json`, `src/locales/ar.json`, `src/locales/en.json` (add `account.*` keys)

**Interfaces:**
- Consumes: `supabase.auth.signInWithPassword`, `supabase.auth.updateUser` from `src/supabaseClient`.
- Produces: `<PasswordChangeForm userEmail={string} />` — fully self-contained (owns its own field state, calls Supabase directly). Consumed by Task 8 and Task 9.

- [ ] **Step 1: Add i18n keys**

In `src/locales/fr.json`, add a new top-level `"account"` object (insert after `"profile_setup"`):

```json
"account": {
  "title": "Mon Compte",
  "email_label": "Adresse email",
  "current_password": "Mot de passe actuel",
  "new_password": "Nouveau mot de passe",
  "confirm_password": "Confirmer le nouveau mot de passe",
  "change_password": "Changer le mot de passe",
  "updating": "Mise à jour...",
  "password_updated": "Mot de passe mis à jour ✓",
  "password_rules_not_met": "Le mot de passe ne respecte pas les règles ci-dessous",
  "password_mismatch": "Les deux mots de passe ne correspondent pas",
  "current_password_wrong": "Mot de passe actuel incorrect"
}
```

In `src/locales/ar.json`, same keys:

```json
"account": {
  "title": "حسابي",
  "email_label": "البريد الإلكتروني",
  "current_password": "كلمة المرور الحالية",
  "new_password": "كلمة المرور الجديدة",
  "confirm_password": "تأكيد كلمة المرور الجديدة",
  "change_password": "تغيير كلمة المرور",
  "updating": "جارٍ التحديث...",
  "password_updated": "تم تحديث كلمة المرور ✓",
  "password_rules_not_met": "كلمة المرور لا تستوفي الشروط أدناه",
  "password_mismatch": "كلمتا المرور غير متطابقتين",
  "current_password_wrong": "كلمة المرور الحالية غير صحيحة"
}
```

In `src/locales/en.json`, same keys:

```json
"account": {
  "title": "My Account",
  "email_label": "Email address",
  "current_password": "Current password",
  "new_password": "New password",
  "confirm_password": "Confirm new password",
  "change_password": "Change password",
  "updating": "Updating...",
  "password_updated": "Password updated ✓",
  "password_rules_not_met": "Password doesn't meet the rules below",
  "password_mismatch": "The two passwords don't match",
  "current_password_wrong": "Current password is incorrect"
}
```

- [ ] **Step 2: Write failing tests**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'

const mockSignIn = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignIn(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
  },
}))

function Wrapper({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockSignIn.mockReset()
  mockUpdateUser.mockReset()
})

function fillAndSubmit({ current = 'OldPass1!', next = 'NewPass1!', confirm = 'NewPass1!' } = {}) {
  fireEvent.change(screen.getByLabelText(/mot de passe actuel/i), { target: { value: current } })
  fireEvent.change(screen.getByLabelText(/^nouveau mot de passe$/i), { target: { value: next } })
  fireEvent.change(screen.getByLabelText(/confirmer le nouveau mot de passe/i), { target: { value: confirm } })
  fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }))
}

test('rejects mismatched confirm password without calling supabase', async () => {
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit({ confirm: 'Different1!' })
  await waitFor(() => {
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument()
  })
  expect(mockSignIn).not.toHaveBeenCalled()
})

test('rejects wrong current password and never calls updateUser', async () => {
  mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit()
  await waitFor(() => {
    expect(screen.getByText(/mot de passe actuel incorrect/i)).toBeInTheDocument()
  })
  expect(mockUpdateUser).not.toHaveBeenCalled()
})

test('re-authenticates then updates password on success', async () => {
  mockSignIn.mockResolvedValue({ error: null })
  mockUpdateUser.mockResolvedValue({ error: null })
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit()
  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'OldPass1!' })
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass1!' })
    expect(screen.getByText(/mis à jour/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run to verify failure**

```
npm run test -- --run src/__tests__/PasswordChangeForm.test.jsx
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement `PasswordChangeForm.jsx`**

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import Button from './Button'

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: 'Une majuscule' },
  { test: v => /[0-9]/.test(v),        label: 'Un chiffre' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial' },
]

export default function PasswordChangeForm({ userEmail }) {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!PASSWORD_RULES.every(r => r.test(newPassword))) {
      setError(t('account.password_rules_not_met'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('account.password_mismatch'))
      return
    }

    setLoading(true)
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    })
    if (reauthError) {
      setLoading(false)
      setError(t('account.current_password_wrong'))
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (updateError) {
      setError(t('errors.generic'))
      return
    }
    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.current_password')}
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={e => { setCurrentPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.new_password')}
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {newPassword && (
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map(r => (
              <li key={r.label} className={`text-xs flex items-center gap-1 ${r.test(newPassword) ? 'text-secondary' : 'text-gray-400'}`}>
                <span>{r.test(newPassword) ? '✓' : '○'}</span> {r.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.confirm_password')}
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-secondary text-sm font-medium">{t('account.password_updated')}</p>}

      <Button
        type="submit"
        variant="secondary"
        loading={loading}
        disabled={!currentPassword || !newPassword || !confirmPassword}
      >
        {loading ? t('account.updating') : t('account.change_password')}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Run to verify tests pass**

```
npm run test -- --run src/__tests__/PasswordChangeForm.test.jsx
```

Expected: 3 passed.

- [ ] **Step 6: Run full suite and commit**

```bash
npm run test
git add src/components/ui/PasswordChangeForm.jsx src/__tests__/PasswordChangeForm.test.jsx src/locales/fr.json src/locales/ar.json src/locales/en.json
git commit -m "feat: add shared PasswordChangeForm with current-password re-authentication"
```

---

## Task 8: `MonProfil.jsx` (prestataire) — ribbon tabs + restyle

**Files:**
- Modify: `src/pages/MonProfil.jsx`
- Modify: `src/__tests__/MonProfil.test.jsx`
- Modify: `src/locales/fr.json`, `ar.json`, `en.json` (tab label keys)

**Interfaces:**
- Consumes: `Tabs` (Task 3), `PasswordChangeForm` (Task 7), `Button`/`Card` (Task 2).

**Problem summary:** current file is one long scroll: profile form → Compte section (hardcoded French, single-field password change) → Portfolio section. This task splits it into 3 tabs and swaps the password section for `PasswordChangeForm`. All existing submit/photo-upload/category logic is preserved verbatim, just moved under the "profile" and "portfolio" tab bodies.

- [ ] **Step 1: Add tab-label i18n keys**

In `src/locales/fr.json`, inside `"profile_setup"`, add:

```json
"tab_profile": "Configurer mon profil",
"tab_account": "Mon Compte",
"tab_portfolio": "Photos de réalisations"
```

Same keys in `ar.json` (`"جارٍ" style Arabic values — "إعداد ملفي", "حسابي", "صور الإنجازات"`) and `en.json` (`"Set up my profile", "My Account", "Portfolio photos"`).

- [ ] **Step 2: Update `MonProfil.test.jsx` for the tabbed layout**

Read the current full test file first (it mocks `prestataire_profiles`/`portfolio_photos`/storage as shown in the File Map). Add an import for `fireEvent` if not already present, and add these tests before the closing of the file (keep all existing tests — they cover the "profile" tab which is active by default, so they keep passing unmodified):

```jsx
test('switches to the account tab and shows the password form', () => {
  mockSingle.mockResolvedValue({ data: { display_name: 'Ahmed', categories: ['plombier'], primary_category: 'plombier' } })
  render(<MonProfil />, { wrapper: Wrapper })
  fireEvent.click(screen.getByRole('tab', { name: /mon compte/i }))
  expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument()
})

test('switches to the portfolio tab and shows the upload control', () => {
  mockSingle.mockResolvedValue({ data: { display_name: 'Ahmed', categories: ['plombier'], primary_category: 'plombier' } })
  render(<MonProfil />, { wrapper: Wrapper })
  fireEvent.click(screen.getByRole('tab', { name: /photos de réalisations/i }))
  expect(screen.getByText(/ajouter une photo/i)).toBeInTheDocument()
})
```

- [ ] **Step 3: Run to verify the two new tests fail**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: the two new tests FAIL (no tabs exist yet in current markup); pre-existing tests still PASS (they only assert on the "profile" tab's fields, which don't move behind a tab click).

- [ ] **Step 4: Restructure `MonProfil.jsx`**

Keep the whole top of the file identical through the `handlePhotoDelete` function (lines 1–225 of the current file — all state, `fetchData`, `handlePasswordChange` is **deleted** since `PasswordChangeForm` owns that now, `handleSubmit`, `handlePhotoUpload`, `handlePhotoDelete` stay unchanged). Add imports and a new `activeTab` state, then replace everything from the `if (fetching)` line to the end of the file:

Add to the top imports:
```js
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'
```

Remove the password-change state block (`newPassword`, `passwordError`, `passwordSuccess`, `changingPassword`) and the `handlePasswordChange` function entirely — `PasswordChangeForm` is self-contained.

Add after the `fetching`/`categoriesLocked` state declarations:
```js
const [activeTab, setActiveTab] = useState('profile')
```

Replace from `if (fetching) return ...` to the end of the file with:

```jsx
  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  const hasNoCategories = !primaryCategory && !categoriesLocked

  const TABS = [
    { key: 'profile', label: t('profile_setup.tab_profile') },
    { key: 'account', label: t('profile_setup.tab_account') },
    { key: 'portfolio', label: t('profile_setup.tab_portfolio') },
  ]

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">{t('profile_setup.title')}</h1>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <>
          {hasNoCategories && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              ⚠️ {t('profile_setup.visibility_warning')}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {success && <p className="text-secondary text-sm mb-4 font-medium">Changements sauvegardés ✓</p>}

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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile_setup.wilaya')} *</label>
              <SelectField value={wilaya} onChange={setWilaya} placeholder={t('search.all_wilayas')} options={wilayaOptions} className="w-full" />
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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="years-exp" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile_setup.years_exp')}
              </label>
              <input
                id="years-exp"
                type="text"
                inputMode="numeric"
                value={yearsExp}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
                  setYearsExp(val)
                }}
                placeholder="ex: 5"
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {categoriesLocked ? (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">{t('profile_setup.categories')}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[primaryCategory, ...secondaryCategories].filter(Boolean).map(key => {
                    const cat = CATEGORIES.find(c => c.key === key)
                    return (
                      <span key={key} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {cat?.emoji} {t(`categories.${key}`)}
                        {key === primaryCategory && <span className="ml-1 text-xs text-primary">{t('profile_setup.primary_label')}</span>}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400">{t('profile_setup.categories_locked')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile_setup.primary_category')} *
                  </label>
                  <SelectField
                    value={primaryCategory}
                    onChange={v => { setPrimaryCategory(v); setSecondaryCategories([]) }}
                    placeholder={t('search.all_categories')}
                    options={categoryOptions}
                    className="w-full"
                  />
                </div>

                {primaryCategory && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t('profile_setup.secondary_categories')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {secondaryCategoryOptions.map(cat => {
                        const isSelected = secondaryCategories.includes(cat.key)
                        const isDisabled = !isSelected && secondaryCategories.length >= 2
                        return (
                          <label
                            key={cat.key}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                              isSelected ? 'border-primary bg-blue-50 text-primary cursor-pointer'
                              : isDisabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => toggleSecondary(cat.key)}
                              className="accent-primary shrink-0"
                            />
                            <span>{cat.emoji} {t(`categories.${cat.key}`)}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {showWarning && (
                  <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ {t('profile_setup.warning_incompatible')}
                  </p>
                )}
              </div>
            )}

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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <Button type="submit" loading={loading}>
              {loading ? t('profile_setup.saving') : t('profile_setup.save')}
            </Button>
          </form>
        </>
      )}

      {activeTab === 'account' && (
        <Card className="p-5">
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1">{t('account.email_label')}</p>
            <p className="text-sm text-gray-500 bg-surface-muted border border-gray-200 rounded-lg px-3 py-2">{user.email ?? user.phone ?? '—'}</p>
          </div>
          <PasswordChangeForm userEmail={user.email} />
        </Card>
      )}

      {activeTab === 'portfolio' && (
        <section>
          <p className="text-xs text-gray-400 mb-4">{t('portfolio.disclaimer')}</p>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative rounded-card overflow-hidden border border-gray-200">
                  <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-32 object-cover" />
                  {photo.caption && <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>}
                  <button
                    onClick={() => handlePhotoDelete(photo)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full hover:bg-red-700"
                  >
                    {t('portfolio.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS ? (
            <div className="space-y-2">
              <input
                type="text"
                value={pendingCaption}
                onChange={e => setPendingCaption(e.target.value)}
                placeholder={t('portfolio.caption_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-primary rounded-card py-3 text-sm text-primary cursor-pointer hover:bg-blue-50 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                <span>{uploadingPhoto ? t('portfolio.uploading') : t('portfolio.upload')}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('portfolio.max_reached')}</p>
          )}
        </section>
      )}
    </main>
  )
}
```

Note: `error`/`success` (profile-save feedback) stay scoped to the "profile" tab only, matching current behavior where they were tied to `handleSubmit`.

- [ ] **Step 5: Run to verify tests pass**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: all tests pass, including the 2 new ones.

- [ ] **Step 6: Run full suite and commit**

```bash
npm run test
git add src/pages/MonProfil.jsx src/__tests__/MonProfil.test.jsx src/locales/fr.json src/locales/ar.json src/locales/en.json
git commit -m "feat: restructure MonProfil into ribbon tabs, use shared PasswordChangeForm"
```

---

## Task 9: `MonProfilClient.jsx` — ribbon tabs + restyle

**Files:**
- Modify: `src/pages/MonProfilClient.jsx`
- Modify: `src/__tests__/MonProfilClient.test.jsx`

**Interfaces:**
- Consumes: `Tabs`, `PasswordChangeForm`, `Button`, `Card` (same as Task 8).

Same pattern as Task 8 but 2 tabs (no portfolio) and the simpler client field set.

- [ ] **Step 1: Update `MonProfilClient.test.jsx`**

Following the same pattern as Task 8 Step 2, add (keep all existing tests, which cover the default "profile" tab):

```jsx
test('switches to the account tab and shows the password form', () => {
  render(<MonProfilClient />, { wrapper: Wrapper })
  fireEvent.click(screen.getByRole('tab', { name: /mon compte/i }))
  expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

```
npm run test -- --run src/__tests__/MonProfilClient.test.jsx
```

Expected: FAIL — no tabs yet.

- [ ] **Step 3: Restructure `MonProfilClient.jsx`**

Add imports:
```js
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'
```

Remove `ALGERIA_PHONE_REGEX`... no — keep `ALGERIA_PHONE_REGEX`, only remove `PASSWORD_RULES` (moved into `PasswordChangeForm`), the password-change state block (`newPassword`, `passwordError`, `passwordSuccess`, `changingPassword`), and `handlePasswordChange` — same deletions as Task 8.

Add after the existing state declarations:
```js
const [activeTab, setActiveTab] = useState('profile')
```

Replace from `if (fetching) return ...` to the end of the file:

```jsx
  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  const TABS = [
    { key: 'profile', label: t('profile_setup.tab_profile') },
    { key: 'account', label: t('profile_setup.tab_account') },
  ]

  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">{t('client_profile.title')}</h1>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {success && <p className="text-secondary text-sm mb-4 font-medium">Changements sauvegardés ✓</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.first_name')} *
              </label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.last_name')} *
              </label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.wilaya')}
              </label>
              <SelectField value={wilaya} onChange={setWilaya} placeholder={t('search.all_wilayas')} options={wilayaOptions} className="w-full" />
            </div>

            <div>
              <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.phone')}
              </label>
              <input
                id="client-phone"
                type="tel"
                placeholder="+213612345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">{t('client_profile.phone_privacy')}</p>
            </div>

            <Button type="submit" loading={loading}>
              {loading ? t('client_profile.saving') : t('client_profile.save')}
            </Button>
          </form>
        </>
      )}

      {activeTab === 'account' && (
        <Card className="p-5">
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1">{t('account.email_label')}</p>
            <p className="text-sm text-gray-500 bg-surface-muted border border-gray-200 rounded-lg px-3 py-2">{user.email ?? user.phone ?? '—'}</p>
          </div>
          <PasswordChangeForm userEmail={user.email} />
        </Card>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run to verify tests pass**

```
npm run test -- --run src/__tests__/MonProfilClient.test.jsx
```

Expected: all pass, including the new one.

- [ ] **Step 5: Run full suite and commit**

```bash
npm run test
git add src/pages/MonProfilClient.jsx src/__tests__/MonProfilClient.test.jsx
git commit -m "feat: restructure MonProfilClient into ribbon tabs, use shared PasswordChangeForm"
```

---

## Task 10: Restyle browsing pages (Home, PrestaCard, Search, PrestaireProfile)

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/components/ui/PrestaCard.jsx`
- Modify: `src/pages/Search.jsx`
- Modify: `src/pages/PrestaireProfile.jsx`
- Modify: `src/locales/fr.json`, `ar.json`, `en.json` (add `home.greeting`)

Pure restyle — no behavior changes. All `cat.emoji` call sites switch to `cat.icon` (a component), completing the Task 4 migration; `emoji` field can now be dropped from `categories.js` in this task's Step 5.

- [ ] **Step 1: Add greeting key**

In `fr.json` under `"home"`, add: `"greeting": "Bonjour 👋"`. In `ar.json`: `"greeting": "مرحباً 👋"`. In `en.json`: `"greeting": "Hello 👋"`.

- [ ] **Step 2: Replace `Home.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from 'lucide-react'
import { CATEGORIES, CATEGORY_CLUSTERS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [wilaya, setWilaya] = useState('')

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat.key, label: t(`categories.${cat.key}`) }))
  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (wilaya) params.set('wilaya', wilaya)
    navigate(`/search?${params.toString()}`)
  }

  function handleCategoryClick(key) {
    navigate(`/search?category=${key}`)
  }

  return (
    <main>
      <section className="px-6 py-10 text-center">
        <p className="text-lg text-text mb-1">{t('home.greeting')}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-8">{t('home.hero_title')}</h1>

        <form
          role="form"
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
        >
          <SelectField
            value={category}
            onChange={setCategory}
            placeholder={t('search.all_categories')}
            options={categoryOptions}
            className="w-full sm:flex-1"
          />
          <SelectField
            value={wilaya}
            onChange={setWilaya}
            placeholder={t('search.all_wilayas')}
            options={wilayaOptions}
            className="w-full sm:flex-1"
          />
          <Button type="submit" className="sm:w-auto sm:px-6">
            <SearchIcon size={16} /> {t('search.submit')}
          </Button>
        </form>
      </section>

      <section className="px-6 py-10 max-w-4xl mx-auto space-y-8">
        {CATEGORY_CLUSTERS.map(cluster => {
          const cats = CATEGORIES.filter(c => c.cluster === cluster.key)
          return (
            <div key={cluster.key}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {cluster.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {cats.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.key}
                      data-testid={`category-card-${cat.key}`}
                      onClick={() => handleCategoryClick(cat.key)}
                      className="text-left"
                    >
                      <Card className="flex flex-col items-center gap-2 p-4 border border-gray-200 hover:border-primary active:scale-95 transition-all">
                        <Icon size={28} className="text-primary" />
                        <span className="text-sm font-medium text-gray-700 text-center leading-tight">
                          {t(`categories.${cat.key}`)}
                        </span>
                      </Card>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Replace `PrestaCard.jsx`**

```jsx
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from './Card'
import Badge from './Badge'

const BADGE_TONES = {
  unverified: 'gray',
  verified: 'blue',
  trusted: 'amber',
}

export { BADGE_TONES }

export default function PrestaCard({ id, display_name, badge, wilaya, categories, avatar_url }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(`/prestataire/${id}`)} className="w-full text-left active:scale-95 transition-transform">
      <Card className="p-4 border border-gray-200 hover:border-primary hover:shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-gray-400 text-xl overflow-hidden shrink-0">
            {avatar_url
              ? <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
              : '👤'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{display_name}</p>
            <p className="text-sm text-gray-500">{wilaya}</p>
          </div>
        </div>

        <Badge tone={BADGE_TONES[badge] ?? 'gray'} className="mb-2">
          {t(`profile.badge_${badge}`)}
        </Badge>

        <div className="flex flex-wrap gap-1 mt-1">
          {(categories ?? []).slice(0, 3).map(cat => (
            <span key={cat} className="text-xs bg-blue-50 text-primary px-2 py-0.5 rounded-full">
              {t(`categories.${cat}`)}
            </span>
          ))}
        </div>
      </Card>
    </button>
  )
}
```

Note: `PrestaireProfile.jsx` imports `BADGE_STYLES` from this file (Step 4 updates that import to `BADGE_TONES`/`Badge`).

- [ ] **Step 4: Replace `PrestaireProfile.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BADGE_TONES } from '../components/ui/PrestaCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ContactSheet from '../components/ui/ContactSheet'

export default function PrestaireProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile: authProfile } = useAuth()

  const [profile, setProfile] = useState(null)
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)

  const handleContactClose = useCallback(() => setContactOpen(false), [])

  useEffect(() => {
    async function fetchProfile() {
      const [profileResult, photosResult] = await Promise.all([
        supabase.from('prestataire_profiles').select('*').eq('id', id).single(),
        supabase.from('portfolio_photos').select('*').eq('prestataire_id', id).order('created_at'),
      ])
      if (!profileResult.error) setProfile(profileResult.data)
      setPortfolioPhotos(photosResult.data ?? [])
      setLoading(false)
      supabase.rpc('increment_profile_views', { presta_id: id })
    }
    fetchProfile()
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-400">{t('profile.loading')}</div>
  if (!profile) return <div className="p-8 text-center text-gray-500">{t('profile.not_found')}</div>

  const isClient = user && authProfile?.role === 'client'
  const isGuest = !user

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-muted flex items-center justify-center text-3xl sm:text-4xl shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover rounded-full" />
            : '👤'}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text truncate">{profile.display_name}</h1>
          <p className="text-gray-500 text-sm">{profile.wilaya}</p>
          <Badge tone={BADGE_TONES[profile.badge] ?? 'gray'} className="mt-1">
            {t(`profile.badge_${profile.badge}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(profile.categories ?? []).map(cat => (
          <span key={cat} className="text-sm bg-blue-50 text-primary px-3 py-1 rounded-full">
            {t(`categories.${cat}`)}
          </span>
        ))}
        {profile.years_experience && (
          <span className="text-sm text-gray-500 px-3 py-1">
            {t('profile.years_exp', { count: profile.years_experience })}
          </span>
        )}
      </div>

      {profile.bio && <p className="text-gray-700 mb-8 leading-relaxed">{profile.bio}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">Portfolio</h2>
        {portfolioPhotos.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('profile.no_portfolio')}</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{t('portfolio.disclaimer')}</p>
            <div className="grid grid-cols-2 gap-3">
              {portfolioPhotos.map(photo => (
                <div key={photo.id} className="rounded-card overflow-hidden border border-gray-200">
                  <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-32 object-cover" />
                  {photo.caption && <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mb-24">
        <h2 className="text-lg font-semibold text-text mb-3">Avis</h2>
        <p className="text-gray-400 text-sm">{t('profile.no_reviews')}</p>
      </section>

      {(isClient || isGuest) && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-surface border-t border-gray-200 px-4 py-3">
          {isClient && (
            <Button data-testid="contact-btn" onClick={() => setContactOpen(true)}>
              {t('profile.contact_btn')}
            </Button>
          )}
          {isGuest && (
            <Button data-testid="contact-btn-guest" onClick={() => navigate(`/login?redirect=/prestataire/${id}`)}>
              {t('profile.contact_btn')}
            </Button>
          )}
        </div>
      )}

      <ContactSheet open={contactOpen} onClose={handleContactClose} prestaireId={id} prestaireName={profile.display_name} />
    </main>
  )
}
```

Note the sticky contact bar moves to `bottom-16 sm:bottom-0` so it sits above `BottomNav` on mobile instead of overlapping it.

- [ ] **Step 5: Replace `Search.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import PrestaCard from '../components/ui/PrestaCard'
import SelectField from '../components/ui/SelectField'
import Skeleton from '../components/ui/Skeleton'

export default function Search() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const wilaya = searchParams.get('wilaya') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat.key, label: t(`categories.${cat.key}`) }))
  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      setFetchError(null)
      let q = supabase
        .from('prestataire_profiles')
        .select('id, display_name, badge, wilaya, categories, avatar_url')
        .eq('is_visible', true)
      if (category) q = q.contains('categories', [category])
      if (wilaya) q = q.eq('wilaya', wilaya)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) {
        setFetchError(error.message)
      } else {
        setResults(data ?? [])
      }
      setLoading(false)
    }
    fetchResults()
  }, [category, wilaya])

  function handleFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SelectField
          value={category}
          onChange={v => handleFilter('category', v)}
          placeholder={t('search.all_categories')}
          options={categoryOptions}
          className="w-full sm:flex-1"
        />
        <SelectField
          value={wilaya}
          onChange={v => handleFilter('wilaya', v)}
          placeholder={t('search.all_wilayas')}
          options={wilayaOptions}
          className="w-full sm:flex-1"
        />
      </div>

      {fetchError && <p className="text-center text-red-500 py-4 text-sm">{fetchError}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => <Skeleton key={n} className="h-36" />)}
        </div>
      ) : results.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('search.no_results')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {results.map(p => <PrestaCard key={p.id} {...p} />)}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Migrate `MonProfil.jsx`'s remaining `emoji` call sites**

`categories.js` still keeps the `emoji` field for now — `Register.jsx` (Task 12) hasn't been migrated yet, so the field can't be dropped until that task finishes. This step only fixes the two spots in `MonProfil.jsx` (already rewritten in Task 8, still reading `cat?.emoji`/`cat.emoji`):

```
grep -n "\.emoji" src/pages/MonProfil.jsx
```

Replace both matches (category-lock display badge and the secondary-category checkbox label) with `{cat?.icon && <cat.icon size={14} className="inline" />}` (lock display) and `<cat.icon size={14} className="inline" />` (checkbox label), removing the `{cat?.emoji}`/`{cat.emoji}` text. `Register.jsx`'s two remaining `.emoji` spots and the final removal of the `emoji` field from `categories.js` happen in Task 12 — do not touch `categories.js`'s data here.

- [ ] **Step 7: Update `data.test.js`**

No change needed yet — `emoji` is still present on `CATEGORIES` entries (kept until Task 12 finishes migrating `Register.jsx`). Just confirm the Task 4 `cat.icon` assertion still passes.

- [ ] **Step 8: Run full suite**

```
npm run test
```

Expected: all tests pass. Fix any test that queried category options by emoji-prefixed label text (e.g. `screen.getByText('🔧 Plombier')`) — update to the plain translated label.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Home.jsx src/components/ui/PrestaCard.jsx src/pages/Search.jsx src/pages/PrestaireProfile.jsx src/data/categories.js src/__tests__/data.test.js src/locales/fr.json src/locales/ar.json src/locales/en.json
git commit -m "feat: restyle Home, Search, PrestaCard, PrestaireProfile; drop emoji category field"
```

---

## Task 11: Restyle messaging pages (Dashboard, Messages, Conversation, ContactSheet)

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/pages/Messages.jsx`
- Modify: `src/pages/Conversation.jsx`
- Modify: `src/components/ui/ContactSheet.jsx`

Pure restyle, same token/`Card`/`Skeleton` swaps as Task 10. No behavior changes.

- [ ] **Step 1: Replace `Dashboard.jsx`**

Same structure as current, swap `bg-white`/`border-gray-200`→`Card`, `bg-blue-50`/`text-blue-*`→token classes:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [views, setViews] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [convsResult, profileResult] = await Promise.all([
        supabase
          .from('conversations')
          .select(`id, client_id, created_at, messages ( id, content, created_at, sender_id )`)
          .eq('prestataire_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('prestataire_profiles')
          .select('views')
          .eq('id', user.id)
          .single(),
      ])
      setConversations(convsResult.data ?? [])
      setViews(profileResult.data?.views ?? 0)
      setLoading(false)
    }
    fetchData()

    const channel = supabase
      .channel(`dashboard:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `prestataire_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user.id])

  function getLastMsg(msgs) {
    if (!msgs?.length) return null
    return [...msgs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  }

  if (loading) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-text mb-1">{t('dashboard.title')}</h1>
      <p className="text-sm text-gray-500 mb-5">{t('dashboard.requests')}</p>

      {views !== null && (
        <Card className="flex items-center gap-2 mb-5 bg-blue-50 px-4 py-3">
          <Eye size={22} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">{t('dashboard.views_label')}</p>
            <p className="text-lg font-bold text-text">{t('dashboard.views', { count: views })}</p>
          </div>
        </Card>
      )}

      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('dashboard.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map(conv => {
            const lastMsg = getLastMsg(conv.messages)
            return (
              <li key={conv.id}>
                <button onClick={() => navigate(`/messages/${conv.id}`)} className="w-full text-left active:scale-95 transition-transform">
                  <Card className="flex items-center gap-3 p-4 border border-gray-200 hover:border-primary hover:shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center shrink-0 text-lg">👤</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text truncate">{t('dashboard.client_label')}</p>
                      {lastMsg && <p className="text-sm text-gray-500 truncate">{lastMsg.content}</p>}
                    </div>
                    {lastMsg && <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg.created_at)}</span>}
                  </Card>
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

- [ ] **Step 2: Replace `Messages.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
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

  if (loading) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-text mb-4">{t('messages.title')}</h1>

      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('messages.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map(conv => {
            const presta = conv.prestataire_profiles
            const lastMsg = getLastMsg(conv.messages)
            return (
              <li key={conv.id}>
                <button onClick={() => navigate(`/messages/${conv.id}`)} className="w-full text-left active:scale-95 transition-transform">
                  <Card className="flex items-center gap-3 p-4 border border-gray-200 hover:border-primary hover:shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center shrink-0 text-lg">
                      {presta?.avatar_url
                        ? <img src={presta.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : '👤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text truncate">{presta?.display_name ?? '—'}</p>
                      {lastMsg && (
                        <p className="text-sm text-gray-500 truncate">
                          {lastMsg.sender_id === user.id ? `${t('messages.you')}: ` : ''}{lastMsg.content}
                        </p>
                      )}
                    </div>
                    {lastMsg && <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg.created_at)}</span>}
                  </Card>
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

- [ ] **Step 3: Replace `Conversation.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, content })
    setSending(false)
  }

  function otherPartyName() {
    if (!conv) return ''
    if (user.id === conv.client_id) return conv.prestataire_profiles?.display_name ?? '—'
    return t('dashboard.client_label')
  }

  if (loading) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-surface shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-sm shrink-0">👤</div>
        <span className="font-medium text-text truncate">{otherPartyName()}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-gray-200 text-text rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-surface shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('messages.type_message')}
          className="flex-1 min-w-0 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dark disabled:opacity-50 shrink-0"
        >
          {t('messages.send')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Replace `ContactSheet.jsx`**

Same logic, restyled bottom sheet:

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'

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
      .upsert({ client_id: user.id, prestataire_id: prestaireId }, { onConflict: 'client_id,prestataire_id' })
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

      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-6 flex flex-col" style={{ height: '60vh' }}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <p className="font-semibold text-text">{prestaireName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1 gap-4 min-h-0">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('contact.placeholder')}
            className="flex-1 min-h-0 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-600 text-sm shrink-0">{error}</p>}
          <Button type="submit" disabled={loading || !message.trim()}>
            {t('contact.send')}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run full suite**

```
npm run test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.jsx src/pages/Messages.jsx src/pages/Conversation.jsx src/components/ui/ContactSheet.jsx
git commit -m "feat: restyle Dashboard, Messages, Conversation, ContactSheet"
```

---

## Task 12: Restyle auth pages (Login, Register) — targeted

**Files:**
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Register.jsx`

Both files are large; this task changes only color/token classes and swaps the raw `<button>` submit elements for `Button`, without touching any handler logic, state, or validation. Category-chip emoji spans (`{cat.emoji}`) switch to `<cat.icon size={14} className="inline" />` — the last remaining call sites, so this task also removes the now-dead `emoji` field from `src/data/categories.js` (Task 10 left it in place specifically for this).

- [ ] **Step 1: `Login.jsx` — targeted replacements**

In `src/pages/Login.jsx`:

1. Add `import Button from '../components/ui/Button'` to the imports.
2. Replace every `bg-blue-600` → `bg-primary`, `hover:bg-blue-700` → `hover:bg-primary-dark`, `focus:ring-blue-500` → `focus:ring-primary`, `text-blue-600` → `text-primary`, `bg-gray-50` (outer page wrapper only, line 75) → `bg-surface-muted` (find-and-replace across the file — these are the only color tokens used).
3. Replace the email-tab submit `<button>` (lines 124–136) with:
   ```jsx
   <Button type="submit" loading={loading}>
     {loading ? 'Connexion en cours...' : t('auth.submit_login')}
   </Button>
   ```
4. Replace the phone-tab submit `<button>` (lines 156–162) with:
   ```jsx
   <Button type="submit" loading={loading}>
     {t('auth.submit_login')}
   </Button>
   ```
5. Replace the OTP-verify submit `<button>` (lines 182–188) with:
   ```jsx
   <Button type="submit" loading={loading}>
     {t('auth.verify')}
   </Button>
   ```

- [ ] **Step 2: `Register.jsx` — targeted replacements**

In `src/pages/Register.jsx`:

1. Add `import Button from '../components/ui/Button'` to the imports.
2. Global find-and-replace across the file: `bg-blue-600` → `bg-primary`, `hover:bg-blue-700` → `hover:bg-primary-dark`, `focus:ring-blue-500` → `focus:ring-primary`, `border-blue-500` → `border-primary`, `bg-blue-50` → `bg-blue-50` (unchanged — tint stays), `text-blue-700`/`text-blue-600` → `text-primary`, page-wrapper `bg-gray-50` → `bg-surface-muted`.
3. Replace `{cat.emoji}` (2 occurrences — step-2 category radio/checkbox chips, lines ~327 and referenced pattern) with `<cat.icon size={14} className="inline mr-1" />` — requires the category options list (`categoryOptions`) already carrying `.icon` from `CATEGORIES` (it does, since `categoryOptions` maps directly from `CATEGORIES` entries which gained `icon` in Task 4).
3a. `grep -rn "\.emoji" src/` — this should now only match the `emoji: '...'` field definitions inside `src/data/categories.js` itself (every JSX call site was migrated across Tasks 10 and 12). Remove the `emoji: '...'` key from all 19 entries in `src/data/categories.js`, and remove the now-obsolete emoji assertion (if any) from `src/__tests__/data.test.js`.
4. Replace each of the 5 submit `<button>` elements (step-2 presta save, step-2 presta skip stays a plain secondary button, step-2 client save, step-1 email register, step-1 phone send-otp, step-1 otp-verify) with `<Button>`/`<Button variant="secondary">` equivalents, preserving their exact `onClick`/`type`/`disabled`/loading-text logic — e.g. the step-2 presta pair (lines 344–360) becomes:
   ```jsx
   <div className="flex gap-3 pt-2">
     <Button type="button" variant="secondary" onClick={() => afterStep2('prestataire')}>
       {t('register_step2.skip')}
     </Button>
     <Button type="submit" loading={loading}>
       {t('register_step2.save')}
     </Button>
   </div>
   ```
   Apply the same `Button`/`Button variant="secondary"` swap pattern to the step-2 client pair and the three step-1 submit buttons (each becomes a single full-width `<Button type="submit" loading={loading}>{...}</Button>`).

- [ ] **Step 3: Run full suite**

```
npm run test
```

Expected: all pass — no test in `Register.test.jsx`/`Login.test.jsx` asserts on Tailwind color classes (confirm by reading their current assertions before this step; if any do, update the expected class name).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/pages/Register.jsx src/data/categories.js src/__tests__/data.test.js
git commit -m "feat: restyle Login and Register with design tokens; drop emoji category field"
```

---

## Task 13: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full suite**

```
npm run test
```

Expected: all tests pass (53 original + new tests from Tasks 2, 3, 5, 7, 8, 9).

- [ ] **Step 2: Grep for leftover raw color classes outside the token system**

```
grep -rn "bg-blue-600\|text-blue-600\|focus:ring-blue-500" src/pages src/components
```

Expected: no matches (everything migrated to `bg-primary`/`text-primary`/`focus:ring-primary`). Fix any stragglers found.

- [ ] **Step 3: Grep for leftover `.emoji` references**

```
grep -rn "\.emoji" src/
```

Expected: no matches — confirms Task 10 Step 6 and Task 12 Step 2.3 fully migrated off the `emoji` field.

- [ ] **Step 4: Manual smoke test**

```
npm run dev
```

Visit `http://localhost:5173`, resize to a mobile width, and confirm: `BottomNav` shows instead of the top nav bar, tapping between `/mon-profil-presta` tabs works, the password-change form has 3 fields.

- [ ] **Step 5: Push**

```bash
git push
```
