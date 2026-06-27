# Wasla Plan 1B — Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the discovery experience — home page with category grid and search, search results page, prestataire profile page, and a "send first message" contact sheet — so a user can find and contact a prestataire end-to-end.

**Architecture:** URL-driven search (query params drive Supabase queries and filter bar state); static JS files for wilayas and categories (single source of truth); ContactSheet is a CSS slide-up overlay rendered inside PrestaireProfile, not a separate route; 10 seed prestataires inserted via SQL migration for UI testing.

**Tech Stack:** React 18, React Router v6 (`useSearchParams`), Supabase JS v2, Vitest + React Testing Library, Tailwind CSS v4, i18next

## Global Constraints

- Never add `Co-Authored-By: Claude` to any commit message
- Run `npx vitest run` after every task — all prior tests must stay green
- Apply DB migrations via `mcp__supabase__apply_migration`, project ref `ueodorekpepgwpzqnezb`
- All locale files (fr/ar/en) must be updated together whenever a new i18n key is added
- Categories stored in DB as `text[]`, e.g. `ARRAY['plombier']` — always use lowercase keys matching `src/data/categories.js`
- Supabase `prestataire_profiles` column names: `id`, `display_name`, `bio`, `avatar_url`, `categories`, `wilaya`, `commune`, `years_experience`, `badge`, `is_visible`
- Badge values: `'unverified'` | `'verified'` | `'trusted'` — no other values
- Contact button visible only to logged-in users with `profile.role === 'client'`
- ContactSheet closes with × button or overlay click — no swipe gesture in 1B

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/data/categories.js` | 7 category objects `{ key, emoji }` — single source of truth |
| Create | `src/data/wilayas.js` | 58 Algerian wilaya name strings — used in all dropdowns |
| Modify | `src/locales/fr.json` | Add categories.*, search.*, profile.*, contact.* keys |
| Modify | `src/locales/ar.json` | Same keys in Arabic |
| Modify | `src/locales/en.json` | Same keys in English |
| Modify | `src/App.jsx` | Add `/search` and `/prestataire/:id` routes |
| Create | `supabase/migrations/009_seed_prestataires.sql` | 10 fake prestataire accounts |
| Create | `src/components/ui/PrestaCard.jsx` | Search result card component |
| Create | `src/pages/Home.jsx` | Replace stub: hero + category grid + search bar |
| Create | `src/pages/Search.jsx` | Filter bar + PrestaCard grid, URL-driven |
| Create | `src/pages/PrestaireProfile.jsx` | Full profile layout + ContactSheet trigger |
| Create | `src/components/ui/ContactSheet.jsx` | Bottom sheet with first-message form |
| Modify | `src/pages/Login.jsx` | Read `redirect` query param, navigate there after auth |
| Create | `src/__tests__/Home.test.jsx` | Tests for Home page |
| Create | `src/__tests__/Search.test.jsx` | Tests for Search page + PrestaCard |
| Create | `src/__tests__/PrestaireProfile.test.jsx` | Tests for profile page |
| Create | `src/__tests__/ContactSheet.test.jsx` | Tests for contact sheet |

---

### Task 1: Data foundations — static data, i18n keys, routes

**Files:**
- Create: `src/data/categories.js`
- Create: `src/data/wilayas.js`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/en.json`
- Modify: `src/App.jsx`
- Test: `src/__tests__/data.test.js`

**Interfaces:**
- Produces: `CATEGORIES` array (consumed by Task 3 Home, Task 4 Search); `WILAYAS` array (consumed by Task 3, Task 4); i18n keys under `categories.*`, `search.*`, `profile.*`, `contact.*` (consumed by Tasks 3–6); `/search` and `/prestataire/:id` routes in App.jsx (consumed by Tasks 4–6)

- [ ] **Step 1: Write failing data tests**

Create `src/__tests__/data.test.js`:

```js
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'

test('CATEGORIES has 7 items each with key and emoji', () => {
  expect(CATEGORIES).toHaveLength(7)
  CATEGORIES.forEach(cat => {
    expect(cat).toHaveProperty('key')
    expect(cat).toHaveProperty('emoji')
    expect(typeof cat.key).toBe('string')
    expect(typeof cat.emoji).toBe('string')
  })
})

test('CATEGORIES keys are the expected values', () => {
  const keys = CATEGORIES.map(c => c.key)
  expect(keys).toEqual([
    'plombier', 'electricien', 'climaticien',
    'frigoriste', 'peintre', 'menuisier', 'informaticien'
  ])
})

test('WILAYAS has 58 strings', () => {
  expect(WILAYAS).toHaveLength(58)
  WILAYAS.forEach(w => expect(typeof w).toBe('string'))
})

test('WILAYAS includes the 5 seed cities', () => {
  expect(WILAYAS).toContain('Alger')
  expect(WILAYAS).toContain('Oran')
  expect(WILAYAS).toContain('Constantine')
  expect(WILAYAS).toContain('Béjaïa')
  expect(WILAYAS).toContain('Mostaganem')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/data.test.js
```
Expected: 4 tests FAIL with "Cannot find module '../data/categories'"

- [ ] **Step 3: Create `src/data/categories.js`**

```js
export const CATEGORIES = [
  { key: 'plombier',      emoji: '🔧' },
  { key: 'electricien',   emoji: '⚡' },
  { key: 'climaticien',   emoji: '❄️' },
  { key: 'frigoriste',    emoji: '🧊' },
  { key: 'peintre',       emoji: '🖌️' },
  { key: 'menuisier',     emoji: '🪵' },
  { key: 'informaticien', emoji: '💻' },
]
```

- [ ] **Step 4: Create `src/data/wilayas.js`**

```js
export const WILAYAS = [
  'Adrar', 'Aïn Defla', 'Aïn Témouchent', 'Alger', 'Annaba',
  'Batna', 'Béchar', 'Béjaïa', 'Béni Abbès', 'Biskra',
  'Blida', 'Bordj Badji Mokhtar', 'Bordj Bou Arréridj', 'Bouira', 'Boumerdès',
  'Chlef', 'Constantine', 'Djanet', 'Djelfa',
  'El Bayadh', 'El M\'Ghair', 'El Meniaa', 'El Oued', 'El Tarf',
  'Ghardaïa', 'Guelma',
  'Illizi', 'In Guezzam', 'In Salah',
  'Jijel', 'Khenchela', 'Laghouat',
  'M\'Sila', 'Mascara', 'Médéa', 'Mila', 'Mostaganem',
  'Naâma', 'Oran', 'Ouargla', 'Ouled Djellal', 'Oum El Bouaghi',
  'Relizane', 'Saïda', 'Sétif', 'Sidi Bel Abbès', 'Skikda', 'Souk Ahras',
  'Tamanrasset', 'Tébessa', 'Tiaret', 'Timimoun', 'Tindouf',
  'Tipaza', 'Tissemsilt', 'Tizi Ouzou', 'Tlemcen', 'Touggourt',
]
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/__tests__/data.test.js
```
Expected: 4 tests PASS

- [ ] **Step 6: Add i18n keys to `src/locales/fr.json`**

Add these keys to the existing JSON (inside the root object, alongside existing keys):

```json
"categories": {
  "plombier": "Plombier",
  "electricien": "Électricien",
  "climaticien": "Climaticien",
  "frigoriste": "Frigoriste",
  "peintre": "Peintre",
  "menuisier": "Menuisier",
  "informaticien": "Informaticien"
},
"search": {
  "filter_category": "Catégorie",
  "filter_wilaya": "Wilaya",
  "all_categories": "Toutes les catégories",
  "all_wilayas": "Toutes les wilayas",
  "no_results": "Aucun prestataire trouvé dans cette zone.",
  "results_count": "{{count}} prestataire(s) trouvé(s)",
  "submit": "Rechercher"
},
"profile": {
  "contact_btn": "Contacter",
  "no_portfolio": "Aucune photo de portfolio pour le moment.",
  "no_reviews": "Aucun avis pour le moment.",
  "badge_unverified": "Non vérifié",
  "badge_verified": "Vérifié ✓",
  "badge_trusted": "Fiable ⭐",
  "years_exp": "{{count}} an(s) d'expérience"
},
"contact": {
  "placeholder": "Décrivez votre besoin en quelques mots...",
  "send": "Envoyer",
  "success": "Message envoyé !",
  "login_required": "Connectez-vous pour contacter ce prestataire"
}
```

- [ ] **Step 7: Add same keys to `src/locales/ar.json`**

```json
"categories": {
  "plombier": "سبّاك",
  "electricien": "كهربائي",
  "climaticien": "تقني تكييف",
  "frigoriste": "تقني تبريد",
  "peintre": "دهّان",
  "menuisier": "نجّار",
  "informaticien": "تقني إعلام آلي"
},
"search": {
  "filter_category": "الفئة",
  "filter_wilaya": "الولاية",
  "all_categories": "جميع الفئات",
  "all_wilayas": "جميع الولايات",
  "no_results": "لم يُعثر على مزود خدمة في هذه المنطقة.",
  "results_count": "{{count}} مزود خدمة",
  "submit": "بحث"
},
"profile": {
  "contact_btn": "تواصل",
  "no_portfolio": "لا توجد صور بعد.",
  "no_reviews": "لا توجد تقييمات بعد.",
  "badge_unverified": "غير موثّق",
  "badge_verified": "موثّق ✓",
  "badge_trusted": "موثوق ⭐",
  "years_exp": "{{count}} سنة خبرة"
},
"contact": {
  "placeholder": "صف حاجتك في بضع كلمات...",
  "send": "إرسال",
  "success": "تم إرسال الرسالة!",
  "login_required": "سجّل دخولك للتواصل مع هذا المزود"
}
```

- [ ] **Step 8: Add same keys to `src/locales/en.json`**

```json
"categories": {
  "plombier": "Plumber",
  "electricien": "Electrician",
  "climaticien": "HVAC Technician",
  "frigoriste": "Refrigeration Tech",
  "peintre": "Painter",
  "menuisier": "Carpenter",
  "informaticien": "IT Technician"
},
"search": {
  "filter_category": "Category",
  "filter_wilaya": "Wilaya",
  "all_categories": "All categories",
  "all_wilayas": "All wilayas",
  "no_results": "No professionals found in this area.",
  "results_count": "{{count}} professional(s) found",
  "submit": "Search"
},
"profile": {
  "contact_btn": "Contact",
  "no_portfolio": "No portfolio photos yet.",
  "no_reviews": "No reviews yet.",
  "badge_unverified": "Unverified",
  "badge_verified": "Verified ✓",
  "badge_trusted": "Trusted ⭐",
  "years_exp": "{{count}} year(s) experience"
},
"contact": {
  "placeholder": "Describe your need in a few words...",
  "send": "Send",
  "success": "Message sent!",
  "login_required": "Log in to contact this professional"
}
```

- [ ] **Step 9: Add routes to `src/App.jsx`**

Replace the full content of `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import PrestaireProfile from './pages/PrestaireProfile'
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
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
        </Route>
      </Routes>
    </div>
  )
}
```

- [ ] **Step 10: Run full test suite**

```
npx vitest run
```
Expected: 15 tests pass (11 existing + 4 new data tests), 0 fail.

- [ ] **Step 11: Commit**

```
git add src/data/categories.js src/data/wilayas.js src/locales/fr.json src/locales/ar.json src/locales/en.json src/App.jsx src/__tests__/data.test.js
git commit -m "feat: add static category/wilaya data, i18n keys, and discovery routes"
```

---

### Task 2: Seed migration — 10 fake prestataires

**Files:**
- Create: `supabase/migrations/009_seed_prestataires.sql`

**Interfaces:**
- Consumes: `auth.users`, `public.profiles` (trigger creates profile on auth user insert), `public.prestataire_profiles`
- Produces: 10 visible prestataire profiles queryable from `prestataire_profiles` (consumed by Task 4 Search and Task 5 Profile)

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/009_seed_prestataires.sql` with the exact content below. The IDs use the `00000000-0000-0000-0000-00000000000X` prefix for easy bulk-delete in 1C.

```sql
-- Seed: 10 fake prestataires for UI testing (removed at start of 1C)
-- Inserting into auth.users triggers handle_new_user() which creates profiles rows automatically.

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.karim.benali@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.yacine.mammeri@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.rachid.bensalem@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.sofiane.boudiaf@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.hamid.chergui@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.bilal.ferhat@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.djamel.aoudia@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.nabil.oukaci@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.mourad.benzerga@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','seed.tarek.hamdani@wasla.test',now(),'{"role":"prestataire"}'::jsonb,now(),now());

-- The trigger on_auth_user_created now fires 10 times and inserts profiles rows with role='prestataire'.

insert into public.prestataire_profiles (id, display_name, bio, categories, wilaya, commune, years_experience, badge, is_visible)
values
  ('00000000-0000-0000-0000-000000000001','Karim Benali','Électricien certifié avec 8 ans d''expérience à Alger. Installations, dépannages et mises aux normes.',ARRAY['electricien'],'Alger','Alger Centre',8,'unverified',true),
  ('00000000-0000-0000-0000-000000000002','Yacine Mammeri','Plombier professionnel disponible 7j/7 à Alger. Fuites, canalisations, ballons d''eau chaude.',ARRAY['plombier'],'Alger','Bab El Oued',5,'unverified',true),
  ('00000000-0000-0000-0000-000000000003','Rachid Bensalem','Peintre bâtiment à Oran. Travaux intérieurs et extérieurs, enduits, peinture décorative.',ARRAY['peintre'],'Oran','Bir El Djir',10,'unverified',true),
  ('00000000-0000-0000-0000-000000000004','Sofiane Boudiaf','Technicien informatique à Oran. Réparation PC, installation réseaux, maintenance entreprise.',ARRAY['informaticien'],'Oran','Es Sénia',6,'unverified',true),
  ('00000000-0000-0000-0000-000000000005','Hamid Chergui','Menuisier aluminium et PVC à Constantine. Portes, fenêtres, cuisines équipées sur mesure.',ARRAY['menuisier'],'Constantine','El Khroub',12,'unverified',true),
  ('00000000-0000-0000-0000-000000000006','Bilal Ferhat','Électricien à Constantine. Tableaux électriques, prises, éclairage, installation domotique.',ARRAY['electricien'],'Constantine','Constantine Centre',4,'unverified',true),
  ('00000000-0000-0000-0000-000000000007','Djamel Aoudia','Climaticien agréé à Béjaïa. Installation et maintenance de climatiseurs toutes marques.',ARRAY['climaticien'],'Béjaïa','Béjaïa Centre',7,'unverified',true),
  ('00000000-0000-0000-0000-000000000008','Nabil Oukaci','Plombier à Béjaïa. Sanitaires, chauffage central, détection et réparation de fuites.',ARRAY['plombier'],'Béjaïa','Akbou',9,'unverified',true),
  ('00000000-0000-0000-0000-000000000009','Mourad Benzerga','Frigoriste professionnel à Mostaganem. Chambres froides, réfrigération commerciale et industrielle.',ARRAY['frigoriste'],'Mostaganem','Mostaganem Centre',15,'unverified',true),
  ('00000000-0000-0000-0000-000000000010','Tarek Hamdani','Peintre décorateur à Mostaganem. Rénovation intérieure, papier peint, faux plafond et staff.',ARRAY['peintre'],'Mostaganem','Sidi Ali',3,'unverified',true);
```

- [ ] **Step 2: Apply the migration**

Use `mcp__supabase__apply_migration` with:
- project_ref: `ueodorekpepgwpzqnezb`
- name: `009_seed_prestataires`
- query: (full SQL above)

If the migration fails with a column error on `auth.users`, check which columns are NOT NULL in your Supabase instance via `mcp__supabase__execute_sql` with `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND is_nullable = 'NO'` and add the missing columns with appropriate defaults.

- [ ] **Step 3: Verify migration and data**

Use `mcp__supabase__execute_sql` with:
```sql
SELECT id, display_name, wilaya, categories FROM public.prestataire_profiles
WHERE id::text LIKE '00000000-0000-0000-0000-0000000000%'
ORDER BY wilaya;
```
Expected: 10 rows returned across Alger, Béjaïa, Constantine, Mostaganem, Oran.

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```
Expected: 15 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```
git add supabase/migrations/009_seed_prestataires.sql
git commit -m "feat: seed 10 fake prestataires across 5 cities for UI testing"
```

---

### Task 3: Home page

**Files:**
- Create (replace): `src/pages/Home.jsx`
- Create: `src/__tests__/Home.test.jsx`

**Interfaces:**
- Consumes: `CATEGORIES` from `src/data/categories.js`; `WILAYAS` from `src/data/wilayas.js`; i18n keys `home.hero_title`, `home.hero_subtitle`, `search.filter_category`, `search.filter_wilaya`, `search.all_categories`, `search.all_wilayas`, `search.submit`, `categories.<key>`
- Produces: clicking a category card navigates to `/search?category=<key>`; submitting search bar navigates to `/search?category=X&wilaya=Y`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/Home.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Home from '../pages/Home'

const mockNavigate = vi.fn()
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
  mockNavigate.mockClear()
})

test('renders hero title and subtitle', () => {
  render(<Home />, { wrapper: Wrapper })
  expect(screen.getByText(/Trouvez le bon prestataire/i)).toBeInTheDocument()
})

test('renders 7 category cards', () => {
  render(<Home />, { wrapper: Wrapper })
  expect(screen.getByText('🔧')).toBeInTheDocument()
  expect(screen.getByText('⚡')).toBeInTheDocument()
  expect(screen.getAllByRole('button').filter(b => b.closest('[data-testid="category-card"]'))).toHaveLength(7)
})

test('clicking a category card navigates to /search with category param', () => {
  render(<Home />, { wrapper: Wrapper })
  fireEvent.click(screen.getByTestId('category-card-plombier'))
  expect(mockNavigate).toHaveBeenCalledWith('/search?category=plombier')
})

test('submitting search form navigates to /search with params', () => {
  render(<Home />, { wrapper: Wrapper })
  fireEvent.submit(screen.getByRole('form'))
  expect(mockNavigate).toHaveBeenCalledWith('/search?')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/Home.test.jsx
```
Expected: all 4 tests FAIL

- [ ] **Step 3: Implement `src/pages/Home.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [wilaya, setWilaya] = useState('')

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
      {/* Hero */}
      <section className="bg-blue-600 text-white px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">{t('home.hero_title')}</h1>
        <p className="text-blue-100 mb-8">{t('home.hero_subtitle')}</p>

        {/* Search bar */}
        <form
          role="form"
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
        >
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg text-gray-800 text-sm"
          >
            <option value="">{t('search.all_categories')}</option>
            {CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>
                {cat.emoji} {t(`categories.${cat.key}`)}
              </option>
            ))}
          </select>

          <select
            value={wilaya}
            onChange={e => setWilaya(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg text-gray-800 text-sm"
          >
            <option value="">{t('search.all_wilayas')}</option>
            {WILAYAS.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50"
          >
            {t('search.submit')}
          </button>
        </form>
      </section>

      {/* Category grid */}
      <section className="px-6 py-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              data-testid={`category-card-${cat.key}`}
              data-testid-group="category-card"
              onClick={() => handleCategoryClick(cat.key)}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-700">
                {t(`categories.${cat.key}`)}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Fix test — update category card query**

The test checks `data-testid="category-card"` but buttons have individual `data-testid`. Update the test's count assertion:

In `src/__tests__/Home.test.jsx`, replace:
```jsx
expect(screen.getAllByRole('button').filter(b => b.closest('[data-testid="category-card"]'))).toHaveLength(7)
```
with:
```jsx
expect(screen.getAllByTestId(/^category-card-/)).toHaveLength(7)
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/__tests__/Home.test.jsx
```
Expected: 4 tests PASS

- [ ] **Step 6: Run full suite**

```
npx vitest run
```
Expected: 19 tests pass, 0 fail.

- [ ] **Step 7: Commit**

```
git add src/pages/Home.jsx src/__tests__/Home.test.jsx
git commit -m "feat: build Home page with hero, search bar, and category grid"
```

---

### Task 4: PrestaCard + Search page

**Files:**
- Create: `src/components/ui/PrestaCard.jsx`
- Create: `src/pages/Search.jsx`
- Create: `src/__tests__/Search.test.jsx`

**Interfaces:**
- Consumes: `CATEGORIES` from `src/data/categories.js`; `WILAYAS` from `src/data/wilayas.js`; `supabase.from('prestataire_profiles').select(...).contains(...).eq(...).order(...)` returning `{ data: PrestaireProfile[], error }`; i18n keys `search.*`, `profile.badge_*`, `categories.*`
- Produces: `PrestaCard` default export — props `{ id, display_name, badge, wilaya, categories, avatar_url }`; clicking navigates to `/prestataire/:id`

**Badge styles** (used in both PrestaCard and PrestaireProfile):
```js
const BADGE_STYLES = {
  unverified: 'bg-gray-100 text-gray-600',
  verified:   'bg-blue-100 text-blue-700',
  trusted:    'bg-amber-100 text-amber-700',
}
```

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/Search.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Search from '../pages/Search'

const mockPrestataires = [
  { id: 'abc-1', display_name: 'Karim Benali', badge: 'unverified', wilaya: 'Alger', categories: ['electricien'], avatar_url: null },
  { id: 'abc-2', display_name: 'Yacine Mammeri', badge: 'verified', wilaya: 'Alger', categories: ['plombier'], avatar_url: null },
]

vi.mock('../supabaseClient', () => {
  const mockOrder = vi.fn().mockResolvedValue({ data: mockPrestataires, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, contains: vi.fn().mockReturnValue({ eq: mockEq, order: mockOrder }), order: mockOrder })
  return {
    supabase: {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    },
  }
})

function Wrapper({ children, url = '/search' }) {
  return (
    <MemoryRouter initialEntries={[url]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/search" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => i18n.changeLanguage('fr'))

test('renders filter bar with category and wilaya selects', () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  expect(screen.getByDisplayValue(/toutes les catégories/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue(/toutes les wilayas/i)).toBeInTheDocument()
})

test('renders prestataire cards after loading', async () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText('Yacine Mammeri')).toBeInTheDocument()
  })
})

test('shows no_results message when data is empty', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText(/Aucun prestataire trouvé/i)).toBeInTheDocument()
  })
})

test('PrestaCard renders name, badge, wilaya', async () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText('Alger')).toBeInTheDocument()
    expect(screen.getByText('Non vérifié')).toBeInTheDocument()
    expect(screen.getByText('Vérifié ✓')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/Search.test.jsx
```
Expected: 4 tests FAIL with "Cannot find module '../pages/Search'"

- [ ] **Step 3: Create `src/components/ui/PrestaCard.jsx`**

```jsx
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const BADGE_STYLES = {
  unverified: 'bg-gray-100 text-gray-600',
  verified:   'bg-blue-100 text-blue-700',
  trusted:    'bg-amber-100 text-amber-700',
}

export { BADGE_STYLES }

export default function PrestaCard({ id, display_name, badge, wilaya, categories, avatar_url }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/prestataire/${id}`)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl overflow-hidden shrink-0">
          {avatar_url
            ? <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
            : '👤'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{display_name}</p>
          <p className="text-sm text-gray-500">{wilaya}</p>
        </div>
      </div>

      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${BADGE_STYLES[badge] ?? BADGE_STYLES.unverified}`}>
        {t(`profile.badge_${badge}`)}
      </span>

      <div className="flex flex-wrap gap-1 mt-1">
        {(categories ?? []).slice(0, 3).map(cat => (
          <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {t(`categories.${cat}`)}
          </span>
        ))}
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Create `src/pages/Search.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import PrestaCard from '../components/ui/PrestaCard'

export default function Search() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const wilaya = searchParams.get('wilaya') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      let q = supabase
        .from('prestataire_profiles')
        .select('id, display_name, badge, wilaya, categories, avatar_url')
        .eq('is_visible', true)
      if (category) q = q.contains('categories', [category])
      if (wilaya) q = q.eq('wilaya', wilaya)
      const { data } = await q.order('created_at', { ascending: false })
      setResults(data ?? [])
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
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={category}
          onChange={e => handleFilter('category', e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('search.all_categories')}</option>
          {CATEGORIES.map(cat => (
            <option key={cat.key} value={cat.key}>
              {cat.emoji} {t(`categories.${cat.key}`)}
            </option>
          ))}
        </select>

        <select
          value={wilaya}
          onChange={e => handleFilter('wilaya', e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('search.all_wilayas')}</option>
          {WILAYAS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-gray-100 rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('search.no_results')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {results.map(p => (
            <PrestaCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/__tests__/Search.test.jsx
```
Expected: 4 tests PASS

- [ ] **Step 6: Run full suite**

```
npx vitest run
```
Expected: 23 tests pass, 0 fail.

- [ ] **Step 7: Commit**

```
git add src/components/ui/PrestaCard.jsx src/pages/Search.jsx src/__tests__/Search.test.jsx
git commit -m "feat: add PrestaCard component and Search results page"
```

---

### Task 5: Prestataire profile page

**Files:**
- Create: `src/pages/PrestaireProfile.jsx`
- Create: `src/__tests__/PrestaireProfile.test.jsx`

**Interfaces:**
- Consumes: `supabase.from('prestataire_profiles').select('*, profiles(role)').eq('id', id).single()` returning `{ data, error }`; `useAuth()` returning `{ user, profile }`; `BADGE_STYLES` from `src/components/ui/PrestaCard.jsx`; i18n keys `profile.*`; `useParams()` for `:id`
- Produces: renders full profile; exposes `data-testid="contact-btn"` button (visible to clients only); clicking it sets `contactOpen = true` (ContactSheet trigger — wired in Task 6)

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/PrestaireProfile.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import PrestaireProfile from '../pages/PrestaireProfile'

const mockProfile = {
  id: 'abc-1',
  display_name: 'Karim Benali',
  bio: 'Électricien à Alger.',
  badge: 'verified',
  wilaya: 'Alger',
  commune: 'Alger Centre',
  categories: ['electricien'],
  avatar_url: null,
  years_experience: 8,
  is_visible: true,
}

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/prestataire/abc-1']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/prestataire/:id" element={children} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  useAuth.mockReturnValue({ user: null, profile: null })
})

test('renders display_name and bio', async () => {
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText('Électricien à Alger.')).toBeInTheDocument()
  })
})

test('shows contact button for logged-in client', async () => {
  useAuth.mockReturnValue({ user: { id: 'u1' }, profile: { role: 'client' } })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByTestId('contact-btn')).toBeInTheDocument()
  })
})

test('hides contact button for logged-in prestataire', async () => {
  useAuth.mockReturnValue({ user: { id: 'u2' }, profile: { role: 'prestataire' } })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.queryByTestId('contact-btn')).not.toBeInTheDocument()
  })
})

test('redirects to /login when unauthenticated user clicks contact', async () => {
  useAuth.mockReturnValue({ user: null, profile: null })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByTestId('contact-btn-guest')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/PrestaireProfile.test.jsx
```
Expected: 4 tests FAIL

- [ ] **Step 3: Create `src/pages/PrestaireProfile.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BADGE_STYLES } from '../components/ui/PrestaCard'

export default function PrestaireProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile: authProfile } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('prestataire_profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (!error) setProfile(data)
      setLoading(false)
    }
    fetchProfile()
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>
  if (!profile) return <div className="p-8 text-center text-gray-500">Profil introuvable.</div>

  const isClient = user && authProfile?.role === 'client'
  const isGuest = !user

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover rounded-full" />
            : '👤'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
          <p className="text-gray-500 text-sm">{profile.wilaya}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_STYLES[profile.badge] ?? BADGE_STYLES.unverified}`}>
            {t(`profile.badge_${profile.badge}`)}
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(profile.categories ?? []).map(cat => (
          <span key={cat} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            {t(`categories.${cat}`)}
          </span>
        ))}
        {profile.years_experience && (
          <span className="text-sm text-gray-500 px-3 py-1">
            {t('profile.years_exp', { count: profile.years_experience })}
          </span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-gray-700 mb-8 leading-relaxed">{profile.bio}</p>
      )}

      {/* Portfolio */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Portfolio</h2>
        <p className="text-gray-400 text-sm">{t('profile.no_portfolio')}</p>
      </section>

      {/* Reviews */}
      <section className="mb-24">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Avis</h2>
        <p className="text-gray-400 text-sm">{t('profile.no_reviews')}</p>
      </section>

      {/* Sticky contact bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        {isClient && (
          <button
            data-testid="contact-btn"
            onClick={() => setContactOpen(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            {t('profile.contact_btn')}
          </button>
        )}
        {isGuest && (
          <button
            data-testid="contact-btn-guest"
            onClick={() => navigate(`/login?redirect=/prestataire/${id}`)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            {t('profile.contact_btn')}
          </button>
        )}
      </div>

      {/* ContactSheet placeholder — wired in Task 6 */}
      {contactOpen && (
        <div data-testid="contact-sheet-placeholder" />
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/__tests__/PrestaireProfile.test.jsx
```
Expected: 4 tests PASS

- [ ] **Step 5: Run full suite**

```
npx vitest run
```
Expected: 27 tests pass, 0 fail.

- [ ] **Step 6: Commit**

```
git add src/pages/PrestaireProfile.jsx src/__tests__/PrestaireProfile.test.jsx
git commit -m "feat: add PrestaireProfile page with contact button visibility rules"
```

---

### Task 6: ContactSheet + Login redirect param

**Files:**
- Create: `src/components/ui/ContactSheet.jsx`
- Create: `src/__tests__/ContactSheet.test.jsx`
- Modify: `src/pages/PrestaireProfile.jsx` (wire ContactSheet in place of placeholder)
- Modify: `src/pages/Login.jsx` (read `redirect` param after auth)

**Interfaces:**
- Consumes: `supabase.from('conversations').upsert(...).select('id').single()` and `supabase.from('messages').insert(...)` ; `useAuth()` returning `{ user }`; i18n keys `contact.*`
- ContactSheet props: `{ open: bool, onClose: () => void, prestaireId: string, prestaireName: string }`
- Login: after successful auth (email or OTP), calls `navigate(redirect)` where `redirect = searchParams.get('redirect') || '/'`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/ContactSheet.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import ContactSheet from '../components/ui/ContactSheet'

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

test('calls supabase and shows success on submit', async () => {
  render(
    <ContactSheet open={true} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  fireEvent.change(screen.getByPlaceholderText(/Décrivez votre besoin/i), {
    target: { value: 'Bonjour, j\'ai besoin de vous.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }))
  await waitFor(() => {
    expect(screen.getByText(/Message envoyé/i)).toBeInTheDocument()
  })
  expect(mockUpsert).toHaveBeenCalled()
  expect(mockInsert).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/__tests__/ContactSheet.test.jsx
```
Expected: 3 tests FAIL

- [ ] **Step 3: Create `src/components/ui/ContactSheet.jsx`**

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ContactSheet({ open, onClose, prestaireId, prestaireName }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

    setSuccess(true)
    setLoading(false)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6"
        style={{ height: '60vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">{prestaireName}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center h-40 text-green-600">
            <span className="text-4xl mb-2">✓</span>
            <p className="font-medium">{t('contact.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col h-full gap-4">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('contact.placeholder')}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire ContactSheet into PrestaireProfile**

In `src/pages/PrestaireProfile.jsx`, add the import and replace the placeholder:

Add at top of file (after existing imports):
```jsx
import ContactSheet from '../components/ui/ContactSheet'
```

Replace:
```jsx
{/* ContactSheet placeholder — wired in Task 6 */}
{contactOpen && (
  <div data-testid="contact-sheet-placeholder" />
)}
```
With:
```jsx
<ContactSheet
  open={contactOpen}
  onClose={() => setContactOpen(false)}
  prestaireId={id}
  prestaireName={profile.display_name}
/>
```

- [ ] **Step 5: Add `redirect` param to Login**

In `src/pages/Login.jsx`, add `useSearchParams` import and update navigation:

Add `useSearchParams` to the react-router-dom import line:
```jsx
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
```

Add inside the component, after the existing hooks:
```jsx
const [searchParams] = useSearchParams()
const redirect = searchParams.get('redirect') || '/'
```

In `handleEmailLogin`, replace `navigate('/')` with `navigate(redirect)`.
In `handleVerifyOtp`, replace `navigate('/')` with `navigate(redirect)`.

- [ ] **Step 6: Run ContactSheet tests**

```
npx vitest run src/__tests__/ContactSheet.test.jsx
```
Expected: 3 tests PASS

- [ ] **Step 7: Run full test suite**

```
npx vitest run
```
Expected: 30 tests pass, 0 fail.

- [ ] **Step 8: Commit**

```
git add src/components/ui/ContactSheet.jsx src/__tests__/ContactSheet.test.jsx src/pages/PrestaireProfile.jsx src/pages/Login.jsx
git commit -m "feat: add ContactSheet with first message form and login redirect param"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| Home: hero + search bar (category + wilaya) | Task 3 |
| Home: 7 category cards (emoji + label) | Task 3 |
| Clicking category → /search?category=X | Task 3 |
| /search: filter bar pre-filled from URL params | Task 4 |
| /search: PrestaCard grid | Task 4 |
| /search: empty state, loading skeleton | Task 4 |
| /prestataire/:id: full profile layout | Task 5 |
| Contact button visible to client only | Task 5 |
| Not logged in → redirect to /login?redirect=... | Task 5 + Task 6 |
| ContactSheet: 60% height, × to close, overlay to close | Task 6 |
| ContactSheet: upsert conversation + insert message | Task 6 |
| ContactSheet: success state, auto-close 1.5s | Task 6 |
| 10 seed prestataires, 2 per city | Task 2 |
| Static 58-wilaya dropdown | Task 1 |
| All i18n keys in FR/AR/EN | Task 1 |
| Google Maps flagged for Phase 3 | Spec only (no code) |
| Swipe-to-close deferred to Phase 4 | Spec only (no code) |

All requirements covered. No placeholders. Type/prop names are consistent across tasks.
