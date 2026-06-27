# Wasla Plan 1E — Profiles & Registration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the registration flow with a profile-setup Step 2 for both roles, expand categories from 8 to 19, add /mon-profil-presta (with category lock, primary category, portfolio photo upload) and /mon-profil-client, add a Navbar profile icon, and show portfolio gallery + profile views on the public prestataire page.

**Architecture:** Six sequential tasks — DB migration first (new columns, storage bucket, views RPC), then categories data+i18n, then registration step 2, then the two profile pages, then the public-facing display updates. Each task is independently testable.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Vitest + RTL, react-i18next (FR/AR/EN + RTL), React Router v6, Supabase JS v2 (auth, RLS, Storage), supabase MCP for migrations.

## Global Constraints

- **NEVER** add `Co-Authored-By: Claude` to any commit message — hard constraint, no exceptions.
- Commit messages: lowercase, conventional: `feat:`, `fix:`, `chore:`.
- All user-visible strings go through `t('key')` — no hardcoded French/English/Arabic.
- 42 existing tests must keep passing; new tests are added on top. Do not delete tests — update when behaviour changes.
- `useAuth()` from `src/context/AuthContext` returns `{ user, profile, loading, signOut }`.
- `SelectField` is at `src/components/ui/SelectField.jsx` — props: `{ value, onChange, placeholder, options: [{value, label}], className }`.
- Supabase project ID: `ueodorekpepgwpzqnezb`.
- Algerian phone format: `+213[5-7][0-9]{8}` (13 chars total, e.g. `+213612345678`).
- Portfolio: max 6 photos per prestataire. Storage bucket name: `portfolio`. Upload path: `{userId}/{Date.now()}-{sanitized-filename}`.
- Category lock: once a prestataire's `prestataire_profiles` row exists with `categories.length > 0`, categories become read-only in /mon-profil-presta.
- Warning for incompatible category combos (no blocking): show `t('profile_setup.warning_incompatible')` if any pair from `INCOMPATIBLE_PAIRS` is selected.
- Vitest hoisting: `vi.mock()` is hoisted before variable initialization — always inline mock data directly in factory functions or use `vi.hoisted()`.

## File Map

| Status | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/014_profiles_v2.sql` | New columns, storage bucket, views RPC |
| Modify | `src/data/categories.js` | 8 → 19 categories, add CATEGORY_CLUSTERS, INCOMPATIBLE_PAIRS |
| Modify | `src/locales/fr.json` | New category keys + step2 + portfolio + client_profile keys |
| Modify | `src/locales/ar.json` | Same keys in Arabic |
| Modify | `src/locales/en.json` | Same keys in English |
| Modify | `src/__tests__/data.test.js` | Update count 8→19, update key list |
| Modify | `src/pages/Register.jsx` | Add step 2 for both roles after successful auth |
| Modify | `src/__tests__/Register.test.jsx` | Add step 2 tests |
| Modify | `src/pages/MonProfil.jsx` | Category lock + primary category + portfolio upload |
| Modify | `src/App.jsx` | Add /mon-profil-presta + /mon-profil redirect + /mon-profil-client |
| Modify | `src/__tests__/MonProfil.test.jsx` | Update for new behaviour |
| Create | `src/pages/MonProfilClient.jsx` | Client profile edit page |
| Create | `src/__tests__/MonProfilClient.test.jsx` | Tests for client profile page |
| Modify | `src/components/layout/Navbar.jsx` | Add 👤 icon for profile |
| Modify | `src/pages/PrestaireProfile.jsx` | Fetch + show portfolio gallery, increment views |
| Modify | `src/pages/Dashboard.jsx` | Show profile views count |
| Modify | `src/__tests__/PrestaireProfile.test.jsx` | Test portfolio gallery render |
| Modify | `src/__tests__/Dashboard.test.jsx` | Test views count render |

---

## Task 1: DB Migration 014 — Extended columns + Storage + Views RPC

**Files:**
- Create: `supabase/migrations/014_profiles_v2.sql`

**Interfaces:**
- Produces: `profiles.first_name`, `profiles.last_name`, `profiles.contact_phone`; `prestataire_profiles.primary_category`, `prestataire_profiles.views`, `prestataire_profiles.phone`; `portfolio` storage bucket; `increment_profile_views(uuid)` RPC.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/014_profiles_v2.sql`:

```sql
-- Add client profile fields to profiles table
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists contact_phone text;

-- Add prestataire-specific columns
alter table public.prestataire_profiles
  add column if not exists primary_category text,
  add column if not exists views integer not null default 0;

-- Add business phone for prestataires (Algeria only, unique)
alter table public.prestataire_profiles
  add column if not exists phone text;

alter table public.prestataire_profiles
  add constraint if not exists prestataire_phone_unique unique (phone);

alter table public.prestataire_profiles
  add constraint if not exists prestataire_phone_algeria
    check (phone is null or phone ~ '^\+213[5-7][0-9]{8}$');

-- RPC to safely increment profile views (security definer bypasses RLS)
create or replace function public.increment_profile_views(presta_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update public.prestataire_profiles
  set views = views + 1
  where id = presta_id and is_visible = true;
end;
$$;
revoke execute on function public.increment_profile_views(uuid) from public;
grant execute on function public.increment_profile_views(uuid) to anon, authenticated;

-- Storage bucket for portfolio photos (public read)
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Portfolio photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "Prestataires can upload their own portfolio photos"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Prestataires can delete their own portfolio photos"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = auth.uid()::text
  );
```

- [ ] **Step 2: Apply the migration via MCP**

Use `mcp__supabase__apply_migration` with:
- `project_id`: `ueodorekpepgwpzqnezb`
- `name`: `014_profiles_v2`
- `query`: the full SQL above

- [ ] **Step 3: Verify via MCP**

Use `mcp__supabase__execute_sql` to verify:
```sql
select column_name from information_schema.columns
where table_name = 'profiles' and column_name in ('first_name','last_name','contact_phone');
```
Expected: 3 rows returned.

```sql
select column_name from information_schema.columns
where table_name = 'prestataire_profiles' and column_name in ('primary_category','views','phone');
```
Expected: 3 rows returned.

```sql
select id from storage.buckets where id = 'portfolio';
```
Expected: 1 row.

- [ ] **Step 4: Commit**

```
git add supabase/migrations/014_profiles_v2.sql
git commit -m "chore: add profiles v2 migration — first_name, last_name, primary_category, views, phone, portfolio storage"
```

---

## Task 2: Expand categories (8 → 19) + i18n + data tests

**Files:**
- Modify: `src/data/categories.js`
- Modify: `src/locales/fr.json`
- Modify: `src/locales/ar.json`
- Modify: `src/locales/en.json`
- Modify: `src/__tests__/data.test.js`

**Interfaces:**
- Produces: `CATEGORIES` (19 items, each `{key, emoji, cluster}`), `CATEGORY_CLUSTERS` (array of `{key, label}`), `INCOMPATIBLE_PAIRS` (array of `[key, key]` pairs that trigger a warning).
- Consumed by: Register.jsx (step 2), MonProfil.jsx, Search.jsx, Home.jsx, PrestaireProfile.jsx.

- [ ] **Step 1: Write the failing data tests**

Replace `src/__tests__/data.test.js` entirely:

```js
import { CATEGORIES, CATEGORY_CLUSTERS, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'

test('CATEGORIES has 19 items each with key, emoji, and cluster', () => {
  expect(CATEGORIES).toHaveLength(19)
  CATEGORIES.forEach(cat => {
    expect(cat).toHaveProperty('key')
    expect(cat).toHaveProperty('emoji')
    expect(cat).toHaveProperty('cluster')
    expect(typeof cat.key).toBe('string')
    expect(typeof cat.emoji).toBe('string')
    expect(typeof cat.cluster).toBe('string')
  })
})

test('CATEGORIES keys are the expected 19 values', () => {
  const keys = CATEGORIES.map(c => c.key)
  expect(keys).toEqual([
    'plombier', 'electricien', 'climaticien', 'frigoriste',
    'macon', 'carreleur', 'etancheur',
    'peintre', 'platrier', 'menuisier', 'menuisier_alu', 'serrurier', 'vitrier',
    'cameras', 'alarmes',
    'electromenager', 'panneaux_solaires',
    'informaticien', 'reparation_telephone',
  ])
})

test('CATEGORY_CLUSTERS has 8 items each with key and label', () => {
  expect(CATEGORY_CLUSTERS).toHaveLength(8)
  CATEGORY_CLUSTERS.forEach(c => {
    expect(c).toHaveProperty('key')
    expect(c).toHaveProperty('label')
  })
})

test('INCOMPATIBLE_PAIRS is an array of [key, key] pairs', () => {
  expect(Array.isArray(INCOMPATIBLE_PAIRS)).toBe(true)
  expect(INCOMPATIBLE_PAIRS.length).toBeGreaterThan(0)
  INCOMPATIBLE_PAIRS.forEach(pair => {
    expect(pair).toHaveLength(2)
    const keys = CATEGORIES.map(c => c.key)
    expect(keys).toContain(pair[0])
    expect(keys).toContain(pair[1])
  })
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

- [ ] **Step 2: Run tests to confirm they fail**

```
npm run test -- --run src/__tests__/data.test.js
```

Expected: 4 new tests FAIL, 2 existing PASS (WILAYAS tests still pass).

- [ ] **Step 3: Rewrite src/data/categories.js**

```js
export const CATEGORIES = [
  { key: 'plombier',             emoji: '🔧', cluster: 'plomberie' },
  { key: 'electricien',          emoji: '⚡', cluster: 'electricite' },
  { key: 'climaticien',          emoji: '❄️', cluster: 'froid' },
  { key: 'frigoriste',           emoji: '🧊', cluster: 'froid' },
  { key: 'macon',                emoji: '🧱', cluster: 'gros_oeuvre' },
  { key: 'carreleur',            emoji: '🪨', cluster: 'gros_oeuvre' },
  { key: 'etancheur',            emoji: '🏚️', cluster: 'gros_oeuvre' },
  { key: 'peintre',              emoji: '🖌️', cluster: 'finitions' },
  { key: 'platrier',             emoji: '🏗️', cluster: 'finitions' },
  { key: 'menuisier',            emoji: '🪵', cluster: 'finitions' },
  { key: 'menuisier_alu',        emoji: '🪟', cluster: 'finitions' },
  { key: 'serrurier',            emoji: '🔑', cluster: 'finitions' },
  { key: 'vitrier',              emoji: '🔲', cluster: 'finitions' },
  { key: 'cameras',              emoji: '📷', cluster: 'securite' },
  { key: 'alarmes',              emoji: '🚨', cluster: 'securite' },
  { key: 'electromenager',       emoji: '🔌', cluster: 'equipements' },
  { key: 'panneaux_solaires',    emoji: '☀️', cluster: 'equipements' },
  { key: 'informaticien',        emoji: '💻', cluster: 'informatique' },
  { key: 'reparation_telephone', emoji: '📱', cluster: 'informatique' },
]

export const CATEGORY_CLUSTERS = [
  { key: 'plomberie',    label: 'Plomberie' },
  { key: 'electricite',  label: 'Électricité' },
  { key: 'froid',        label: 'Climatisation & Froid' },
  { key: 'gros_oeuvre',  label: 'Gros œuvre' },
  { key: 'finitions',    label: 'Finitions' },
  { key: 'securite',     label: 'Sécurité électronique' },
  { key: 'equipements',  label: 'Équipements' },
  { key: 'informatique', label: 'Informatique' },
]

// Pairs that trigger a warning (no blocking) — "these skills are very different"
export const INCOMPATIBLE_PAIRS = [
  ['informaticien',        'plombier'],
  ['informaticien',        'macon'],
  ['informaticien',        'carreleur'],
  ['informaticien',        'peintre'],
  ['informaticien',        'platrier'],
  ['informaticien',        'menuisier'],
  ['informaticien',        'menuisier_alu'],
  ['informaticien',        'serrurier'],
  ['informaticien',        'vitrier'],
  ['informaticien',        'etancheur'],
  ['informaticien',        'electromenager'],
  ['reparation_telephone', 'plombier'],
  ['reparation_telephone', 'macon'],
  ['reparation_telephone', 'carreleur'],
  ['reparation_telephone', 'peintre'],
  ['reparation_telephone', 'platrier'],
  ['reparation_telephone', 'menuisier'],
  ['reparation_telephone', 'menuisier_alu'],
  ['reparation_telephone', 'serrurier'],
  ['reparation_telephone', 'vitrier'],
  ['reparation_telephone', 'etancheur'],
]
```

- [ ] **Step 4: Add new i18n keys to fr.json**

In `src/locales/fr.json`:

**Replace the `categories` block** (was 8 keys, now 19):
```json
"categories": {
  "plombier": "Plombier",
  "electricien": "Électricien",
  "climaticien": "Climaticien",
  "frigoriste": "Frigoriste",
  "macon": "Maçon",
  "carreleur": "Carreleur",
  "etancheur": "Étancheur",
  "peintre": "Peintre",
  "platrier": "Plâtrier",
  "menuisier": "Menuisier bois",
  "menuisier_alu": "Menuisier aluminium",
  "serrurier": "Serrurier",
  "vitrier": "Vitrier",
  "cameras": "Caméras & Vidéosurveillance",
  "alarmes": "Alarmes & Contrôle d'accès",
  "electromenager": "Réparation électroménager",
  "panneaux_solaires": "Panneaux solaires",
  "informaticien": "Informatique & Réseaux",
  "reparation_telephone": "Réparation téléphone"
}
```

**Add a new top-level `register_step2` block** (after the `auth` block):
```json
"register_step2": {
  "title_presta": "Complétez votre profil prestataire",
  "title_client": "Complétez votre profil",
  "subtitle_presta": "Ces informations vous permettront d'être trouvé par des clients.",
  "subtitle_client": "Quelques informations pour personnaliser votre expérience.",
  "display_name": "Nom affiché",
  "first_name": "Prénom",
  "last_name": "Nom de famille",
  "phone_optional": "Téléphone (optionnel)",
  "phone_hint": "Format : +213XXXXXXXXX (ex: +213612345678)",
  "phone_privacy": "Votre numéro ne sera jamais partagé sans votre accord.",
  "primary_category": "Métier principal",
  "secondary_categories": "Métiers secondaires (optionnel, max 2)",
  "skip": "Terminer plus tard",
  "save": "Enregistrer et continuer",
  "saving": "Enregistrement...",
  "warning_incompatible": "Vous avez sélectionné des métiers très différents. Assurez-vous de proposer réellement ces services.",
  "max_secondary": "Maximum 2 métiers secondaires."
}
```

**Add a new top-level `client_profile` block**:
```json
"client_profile": {
  "title": "Mon profil",
  "first_name": "Prénom",
  "last_name": "Nom",
  "phone": "Téléphone (optionnel)",
  "phone_privacy": "Votre numéro ne sera jamais partagé.",
  "phone_hint": "Format : +213XXXXXXXXX",
  "wilaya": "Wilaya",
  "save": "Enregistrer",
  "saved": "Profil mis à jour !",
  "saving": "Enregistrement..."
}
```

**Add to the `profile_setup` block** (after `min_one_category`):
```json
"primary_category": "Métier principal",
"secondary_categories": "Métiers secondaires (optionnel, max 2)",
"warning_incompatible": "Vous avez sélectionné des métiers très différents. Assurez-vous de proposer réellement ces services.",
"categories_locked": "Vos métiers sont verrouillés. Contactez le support pour les modifier : support@wasla.dz",
"visibility_warning": "Votre profil n'est pas encore visible des clients. Sélectionnez au moins un métier pour apparaître dans les résultats."
```

**Add a new top-level `portfolio` block**:
```json
"portfolio": {
  "title": "Photos de réalisations",
  "upload": "Ajouter une photo",
  "caption_placeholder": "Description de la réalisation...",
  "max_reached": "Maximum 6 photos atteint.",
  "disclaimer": "Photos fournies par le prestataire, non vérifiées par Wasla.",
  "delete": "Supprimer",
  "uploading": "Téléversement..."
}
```

**Add to the `dashboard` block**:
```json
"views_label": "Vues du profil",
"views": "{{count}} vue(s)"
```

- [ ] **Step 5: Add new i18n keys to ar.json**

In `src/locales/ar.json`:

**Replace the `categories` block**:
```json
"categories": {
  "plombier": "سبّاك",
  "electricien": "كهربائي",
  "climaticien": "تقني تكييف",
  "frigoriste": "تقني تبريد",
  "macon": "بنّاء",
  "carreleur": "فنّي بلاط",
  "etancheur": "عازل",
  "peintre": "دهّان",
  "platrier": "جبّاس",
  "menuisier": "نجّار خشب",
  "menuisier_alu": "نجّار ألمنيوم",
  "serrurier": "قفّال",
  "vitrier": "زجّاج",
  "cameras": "كاميرات ومراقبة",
  "alarmes": "إنذار وتحكم في الوصول",
  "electromenager": "إصلاح أجهزة كهرومنزلية",
  "panneaux_solaires": "طاقة شمسية",
  "informaticien": "إعلام آلي وشبكات",
  "reparation_telephone": "إصلاح هواتف"
}
```

**Add `register_step2` block**:
```json
"register_step2": {
  "title_presta": "أكمل ملف العمل",
  "title_client": "أكمل ملفك الشخصي",
  "subtitle_presta": "هذه المعلومات ستتيح للعملاء إيجادك.",
  "subtitle_client": "بعض المعلومات لتخصيص تجربتك.",
  "display_name": "الاسم المعروض",
  "first_name": "الاسم",
  "last_name": "اللقب",
  "phone_optional": "الهاتف (اختياري)",
  "phone_hint": "الصيغة: +213XXXXXXXXX",
  "phone_privacy": "لن يُشارك رقمك دون موافقتك.",
  "primary_category": "المهنة الرئيسية",
  "secondary_categories": "مهن ثانوية (اختياري، 2 كحد أقصى)",
  "skip": "إنهاء لاحقاً",
  "save": "حفظ ومتابعة",
  "saving": "جارٍ الحفظ...",
  "warning_incompatible": "اخترت مهناً مختلفة جداً. تأكد من أنك تقدم هذه الخدمات فعلاً.",
  "max_secondary": "2 مهن ثانوية كحد أقصى."
}
```

**Add `client_profile` block**:
```json
"client_profile": {
  "title": "ملفي الشخصي",
  "first_name": "الاسم",
  "last_name": "اللقب",
  "phone": "الهاتف (اختياري)",
  "phone_privacy": "لن يُشارك رقمك أبداً.",
  "phone_hint": "الصيغة: +213XXXXXXXXX",
  "wilaya": "الولاية",
  "save": "حفظ",
  "saved": "تم تحديث الملف!",
  "saving": "جارٍ الحفظ..."
}
```

**Add to `profile_setup` block**:
```json
"primary_category": "المهنة الرئيسية",
"secondary_categories": "مهن ثانوية (اختياري، 2 كحد أقصى)",
"warning_incompatible": "اخترت مهناً مختلفة جداً. تأكد من أنك تقدم هذه الخدمات فعلاً.",
"categories_locked": "مهنك مقفلة. تواصل مع الدعم لتعديلها: support@wasla.dz",
"visibility_warning": "ملفك غير مرئي للعملاء بعد. اختر مهنة واحدة على الأقل لتظهر في النتائج."
```

**Add `portfolio` block**:
```json
"portfolio": {
  "title": "صور الأعمال",
  "upload": "إضافة صورة",
  "caption_placeholder": "وصف العمل المنجز...",
  "max_reached": "وصلت إلى الحد الأقصى (6 صور).",
  "disclaimer": "صور مقدّمة من المقدِّم، غير موثقة من Wasla.",
  "delete": "حذف",
  "uploading": "جارٍ الرفع..."
}
```

**Add to `dashboard` block**:
```json
"views_label": "مشاهدات الملف",
"views": "{{count}} مشاهدة"
```

- [ ] **Step 6: Add new i18n keys to en.json**

In `src/locales/en.json`:

**Replace the `categories` block**:
```json
"categories": {
  "plombier": "Plumber",
  "electricien": "Electrician",
  "climaticien": "AC Technician",
  "frigoriste": "Refrigeration Technician",
  "macon": "Mason",
  "carreleur": "Tiler",
  "etancheur": "Waterproofer",
  "peintre": "Painter",
  "platrier": "Plasterer",
  "menuisier": "Carpenter",
  "menuisier_alu": "Aluminium Joiner",
  "serrurier": "Locksmith",
  "vitrier": "Glazier",
  "cameras": "CCTV & Surveillance",
  "alarmes": "Alarms & Access Control",
  "electromenager": "Appliance Repair",
  "panneaux_solaires": "Solar Panels",
  "informaticien": "IT & Networks",
  "reparation_telephone": "Phone Repair"
}
```

**Add `register_step2` block**:
```json
"register_step2": {
  "title_presta": "Complete your prestataire profile",
  "title_client": "Complete your profile",
  "subtitle_presta": "This information helps clients find you.",
  "subtitle_client": "A few details to personalise your experience.",
  "display_name": "Display name",
  "first_name": "First name",
  "last_name": "Last name",
  "phone_optional": "Phone (optional)",
  "phone_hint": "Format: +213XXXXXXXXX",
  "phone_privacy": "Your number will never be shared without your consent.",
  "primary_category": "Primary trade",
  "secondary_categories": "Secondary trades (optional, max 2)",
  "skip": "Finish later",
  "save": "Save and continue",
  "saving": "Saving...",
  "warning_incompatible": "You selected very different trades. Make sure you actually offer all these services.",
  "max_secondary": "Maximum 2 secondary trades."
}
```

**Add `client_profile` block**:
```json
"client_profile": {
  "title": "My profile",
  "first_name": "First name",
  "last_name": "Last name",
  "phone": "Phone (optional)",
  "phone_privacy": "Your number will never be shared.",
  "phone_hint": "Format: +213XXXXXXXXX",
  "wilaya": "Wilaya",
  "save": "Save",
  "saved": "Profile updated!",
  "saving": "Saving..."
}
```

**Add to `profile_setup` block**:
```json
"primary_category": "Primary trade",
"secondary_categories": "Secondary trades (optional, max 2)",
"warning_incompatible": "You selected very different trades. Make sure you actually offer all these services.",
"categories_locked": "Your trades are locked. Contact support to change them: support@wasla.dz",
"visibility_warning": "Your profile is not yet visible to clients. Select at least one trade to appear in search results."
```

**Add `portfolio` block**:
```json
"portfolio": {
  "title": "Work photos",
  "upload": "Add a photo",
  "caption_placeholder": "Describe this work...",
  "max_reached": "Maximum 6 photos reached.",
  "disclaimer": "Photos provided by the service provider, not verified by Wasla.",
  "delete": "Delete",
  "uploading": "Uploading..."
}
```

**Add to `dashboard` block**:
```json
"views_label": "Profile views",
"views": "{{count}} view(s)"
```

- [ ] **Step 7: Run data tests to confirm all pass**

```
npm run test -- --run src/__tests__/data.test.js
```

Expected: 6 passed.

- [ ] **Step 8: Run full suite to confirm no regressions**

```
npm run test -- --run
```

Expected: 42+ passed, 0 failed. (Home, Search, PrestaCard, PrestaireProfile tests mock CATEGORIES so they still pass.)

- [ ] **Step 9: Commit**

```
git add src/data/categories.js src/locales/fr.json src/locales/ar.json src/locales/en.json src/__tests__/data.test.js
git commit -m "feat: expand categories to 19 with clusters, add i18n keys for 1E"
```

---

## Task 3: Register Step 2 — Profile onboarding for both roles

**Files:**
- Modify: `src/pages/Register.jsx`
- Modify: `src/__tests__/Register.test.jsx`

**Interfaces:**
- Consumes: `CATEGORIES`, `INCOMPATIBLE_PAIRS` from `src/data/categories.js`; `WILAYAS` from `src/data/wilayas.js`; `SelectField`; `supabase.from('prestataire_profiles').upsert()` and `supabase.from('profiles').update()`.
- After step 2 save (presta): navigates to `/mon-profil-presta`.
- After step 2 save (client): navigates to `/`.
- After skip (either role): same as save — presta → `/mon-profil-presta`, client → `/`.

- [ ] **Step 1: Write failing tests for step 2**

Replace `src/__tests__/Register.test.jsx` entirely:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Register from '../pages/Register'

const mockNavigate = vi.fn()
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') return { upsert: mockUpsert }
      if (table === 'profiles') return { update: mockUpdate }
      return {}
    }),
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

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockNavigate.mockClear()
  mockUpsert.mockClear()
  mockUpdate.mockClear()
})

test('renders role selection', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText(/client/i)[0]).toBeInTheDocument()
  expect(screen.getAllByText(/prestataire/i)[0]).toBeInTheDocument()
})

test('shows email and phone tabs', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText('Email')[0]).toBeInTheDocument()
  expect(screen.getByText('Téléphone')).toBeInTheDocument()
})

test('shows prestataire step 2 after successful email registration', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/prestataire — je propose/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => {
    expect(screen.getByText(/complétez votre profil prestataire/i)).toBeInTheDocument()
  })
})

test('shows client step 2 after successful email registration', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/client — je cherche/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => {
    expect(screen.getByText(/complétez votre profil/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
  })
})

test('skip button in step 2 navigates without saving', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/client — je cherche/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => screen.getByText(/terminer plus tard/i))
  fireEvent.click(screen.getByText(/terminer plus tard/i))
  expect(mockNavigate).toHaveBeenCalledWith('/')
  expect(mockUpdate).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```
npm run test -- --run src/__tests__/Register.test.jsx
```

Expected: tests 3, 4, 5 FAIL.

- [ ] **Step 3: Rewrite Register.jsx with step 2**

Replace `src/pages/Register.jsx` entirely:

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const PHONE_REGEX = /^\+213[5-7][0-9]{8}$/
const ALGERIA_PHONE_REGEX = /^\+213[5-7][0-9]{8}$/

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: 'Une majuscule' },
  { test: v => /[0-9]/.test(v),        label: 'Un chiffre' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial (!@#$%...)' },
]

function passwordValid(v) {
  return PASSWORD_RULES.every(r => r.test(v))
}

function hasIncompatiblePair(selected) {
  return INCOMPATIBLE_PAIRS.some(([a, b]) => selected.includes(a) && selected.includes(b))
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Step 1 state
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('')
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleError, setRoleError] = useState(false)

  // Step 2 — prestataire
  const [displayName, setDisplayName] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [commune, setCommune] = useState('')
  const [primaryCategory, setPrimaryCategory] = useState('')
  const [secondaryCategories, setSecondaryCategories] = useState([])

  // Step 2 — client
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clientWilaya, setClientWilaya] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))
  const categoryOptions = CATEGORIES.map(c => ({
    value: c.key,
    label: `${c.emoji} ${t(`categories.${c.key}`)}`,
  }))
  const secondaryCategoryOptions = CATEGORIES.filter(c => c.key !== primaryCategory)

  const allSelected = primaryCategory
    ? [primaryCategory, ...secondaryCategories]
    : secondaryCategories
  const showWarning = allSelected.length > 1 && hasIncompatiblePair(allSelected)

  useEffect(() => {
    if (user && step === 1) navigate('/')
  }, [user, step, navigate])

  function classifyError(error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('already registered') || msg.includes('already exists') || error.status === 422) {
      return 'Cet email est déjà utilisé. Connectez-vous plutôt.'
    }
    if (error.status === 429 || msg.includes('rate limit') || msg.includes('security purposes')) {
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    }
    return t('errors.auth_failed')
  }

  function goToStep2(uid) {
    setUserId(uid)
    setStep(2)
    setError('')
  }

  function afterStep2(r) {
    navigate(r === 'prestataire' ? '/mon-profil-presta' : '/')
  }

  async function handleEmailRegister(e) {
    e.preventDefault()
    if (!role) { setRoleError(true); setError(''); return }
    if (!passwordValid(password)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      })
      if (error) {
        setError(classifyError(error))
      } else if (data.user && !data.session) {
        setSuccess('Inscription réussie ! Vérifiez votre email pour activer votre compte, puis connectez-vous.')
      } else {
        goToStep2(data.user.id)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!role) { setRoleError(true); setError(''); return }
    if (!PHONE_REGEX.test(phone)) { setError(t('errors.invalid_phone')); return }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { data: { role } },
      })
      if (error) setError(classifyError(error))
      else setOtpSent(true)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
      if (error) {
        setError(classifyError(error))
      } else {
        const uid = data?.user?.id ?? (await supabase.auth.getUser()).data.user?.id
        goToStep2(uid)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  function toggleSecondary(key) {
    setSecondaryCategories(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 2) return prev
      return [...prev, key]
    })
  }

  async function handleStep2PrestaSubmit(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError(t('errors.required')); return }
    if (!wilaya) { setError(t('errors.required')); return }
    if (!commune.trim()) { setError(t('errors.required')); return }
    if (!primaryCategory) { setError(t('errors.required')); return }
    setError('')
    setLoading(true)
    const categories = [primaryCategory, ...secondaryCategories]
    const { error } = await supabase
      .from('prestataire_profiles')
      .upsert({
        id: userId,
        display_name: displayName.trim(),
        wilaya,
        commune: commune.trim(),
        primary_category: primaryCategory,
        categories,
        is_visible: true,
      })
    setLoading(false)
    if (error) { setError(t('errors.generic')); return }
    afterStep2('prestataire')
  }

  async function handleStep2ClientSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) { setError(t('errors.required')); return }
    if (!lastName.trim()) { setError(t('errors.required')); return }
    if (!clientWilaya) { setError(t('errors.required')); return }
    if (clientPhone && !ALGERIA_PHONE_REGEX.test(clientPhone)) {
      setError(t('errors.invalid_phone')); return
    }
    setError('')
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        wilaya: clientWilaya,
        contact_phone: clientPhone.trim() || null,
      })
      .eq('id', userId)
    setLoading(false)
    if (error) { setError(t('errors.generic')); return }
    afterStep2('client')
  }

  // ── Step 2 render ──────────────────────────────────────────────
  if (step === 2 && role === 'prestataire') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t('register_step2.title_presta')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('register_step2.subtitle_presta')}</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleStep2PrestaSubmit} className="space-y-4">
            <div>
              <label htmlFor="s2-display-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.display_name')} *
              </label>
              <input
                id="s2-display-name"
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
              <label htmlFor="s2-commune" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile_setup.commune')} *
              </label>
              <input
                id="s2-commune"
                type="text"
                value={commune}
                onChange={e => setCommune(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.primary_category')} *
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
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register_step2.secondary_categories')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {secondaryCategoryOptions.map(cat => {
                    const isSelected = secondaryCategories.includes(cat.key)
                    const isDisabled = !isSelected && secondaryCategories.length >= 2
                    return (
                      <label
                        key={cat.key}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleSecondary(cat.key)}
                          className="accent-blue-600 shrink-0"
                        />
                        <span>{cat.emoji} {t(`categories.${cat.key}`)}</span>
                      </label>
                    )
                  })}
                </div>
                {secondaryCategories.length >= 2 && (
                  <p className="text-xs text-gray-400 mt-1">{t('register_step2.max_secondary')}</p>
                )}
              </div>
            )}

            {showWarning && (
              <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ {t('register_step2.warning_incompatible')}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => afterStep2('prestataire')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                {t('register_step2.skip')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('register_step2.saving') : t('register_step2.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (step === 2 && role === 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t('register_step2.title_client')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('register_step2.subtitle_client')}</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleStep2ClientSubmit} className="space-y-4">
            <div>
              <label htmlFor="s2-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.first_name')} *
              </label>
              <input
                id="s2-first-name"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="s2-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.last_name')} *
              </label>
              <input
                id="s2-last-name"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.wilaya')} *
              </label>
              <SelectField
                value={clientWilaya}
                onChange={setClientWilaya}
                placeholder={t('search.all_wilayas')}
                options={wilayaOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.phone_optional')}
              </label>
              <input
                type="tel"
                placeholder="+213612345678"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('register_step2.phone_privacy')}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => afterStep2('client')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                {t('register_step2.skip')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('register_step2.saving') : t('register_step2.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Step 1: Auth form (unchanged layout) ──────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.register_title')}</h1>

        <p className={`text-sm font-medium mb-3 ${roleError ? 'text-red-600' : 'text-gray-700'}`}>
          {t('auth.choose_role')}{roleError && ' — sélectionnez une option'}
        </p>
        <div className={`space-y-2 mb-6 rounded-lg ${roleError ? 'outline outline-2 outline-red-400 p-2' : ''}`}>
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
                onChange={() => { setRole(r); setRoleError(false) }}
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
        {success && <p className="text-green-600 text-sm mb-4 font-medium">{success}</p>}

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map(rule => {
                  const met = rule.test(password)
                  return (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : password.length > 0 ? 'text-red-400' : 'text-gray-400'}`}
                    >
                      <span>{met ? '✓' : '•'}</span>
                      <span>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('register_step2.saving') : t('auth.submit_register')}
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
              {loading ? t('register_step2.saving') : t('auth.submit_register')}
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

- [ ] **Step 4: Run Register tests to confirm all 5 pass**

```
npm run test -- --run src/__tests__/Register.test.jsx
```

Expected: 5 passed.

- [ ] **Step 5: Run full suite**

```
npm run test -- --run
```

Expected: 45+ passed, 0 failed.

- [ ] **Step 6: Commit**

```
git add src/pages/Register.jsx src/__tests__/Register.test.jsx
git commit -m "feat: add registration step 2 — profile onboarding for both roles"
```

---

## Task 4: /mon-profil-presta — route + category lock + portfolio upload

**Files:**
- Modify: `src/pages/MonProfil.jsx`
- Modify: `src/App.jsx`
- Modify: `src/__tests__/MonProfil.test.jsx`

**Interfaces:**
- Route `/mon-profil-presta` → `MonProfil` component (same file, just new route).
- Route `/mon-profil` → `<Navigate to="/mon-profil-presta" replace />`.
- Category lock: if existing profile row has `categories.length > 0`, show read-only chips + lock message.
- Primary category: `SelectField` for `primary_category`, secondaries as checkboxes (max 2, capped).
- Portfolio: list from `portfolio_photos` table; upload via `supabase.storage.from('portfolio').upload()`; delete via storage + DB delete.

- [ ] **Step 1: Write failing tests**

Replace `src/__tests__/MonProfil.test.jsx` entirely:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfil from '../pages/MonProfil'

const mockNavigate = vi.fn()
const mockSingle = vi.fn()
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockPhotoSelect = vi.fn()
const mockPhotoInsert = vi.fn().mockResolvedValue({ error: null })
const mockPhotoDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockStorageUpload = vi.fn().mockResolvedValue({ data: { path: 'user-1/photo.jpg' }, error: null })
const mockStorageGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/photo.jpg' } })
const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
        upsert: mockUpsert,
      }
      if (table === 'portfolio_photos') return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
        insert: mockPhotoInsert,
        delete: mockPhotoDelete,
      }
      return {}
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
      })),
    },
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
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockUpsert.mockClear()
  mockNavigate.mockClear()
})

test('shows form with display_name and primary category selector when profile is new', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/nom affiché/i)).toBeInTheDocument()
  })
  expect(screen.queryByText(/vos métiers sont verrouillés/i)).not.toBeInTheDocument()
})

test('shows category lock message when existing profile has categories', async () => {
  mockSingle.mockResolvedValue({
    data: {
      display_name: 'Ali',
      bio: '',
      wilaya: 'Alger',
      commune: 'Bab El Oued',
      years_experience: 5,
      categories: ['plombier'],
      primary_category: 'plombier',
      is_visible: true,
    },
    error: null,
  })
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/vos métiers sont verrouillés/i)).toBeInTheDocument()
  })
})

test('shows portfolio section with upload button', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/photos de réalisations/i)).toBeInTheDocument()
    expect(screen.getByText(/ajouter une photo/i)).toBeInTheDocument()
  })
})

test('submit calls upsert with primary_category and categories array', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/nom affiché/i))

  fireEvent.change(screen.getByLabelText(/nom affiché/i), { target: { value: 'Ali Mechanics' } })
  fireEvent.change(screen.getByLabelText(/commune/i), { target: { value: 'Hussein Dey' } })

  // Select wilaya via SelectField
  fireEvent.click(screen.getByText(/toutes les wilayas/i).closest('button'))
  await waitFor(() => screen.getAllByRole('option'))
  fireEvent.click(screen.getAllByRole('option')[1])

  // Select primary category via SelectField
  fireEvent.click(screen.getByText(/toutes les catégories/i).closest('button'))
  await waitFor(() => screen.getAllByRole('option'))
  fireEvent.click(screen.getAllByRole('option')[1])

  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  await waitFor(() => {
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'Ali Mechanics',
        is_visible: true,
      })
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: several tests FAIL (component doesn't have portfolio section yet).

- [ ] **Step 3: Rewrite MonProfil.jsx**

Replace `src/pages/MonProfil.jsx` entirely:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const MAX_PHOTOS = 6

function hasIncompatiblePair(selected) {
  return INCOMPATIBLE_PAIRS.some(([a, b]) => selected.includes(a) && selected.includes(b))
}

export default function MonProfil() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [fetching, setFetching] = useState(true)
  const [categoriesLocked, setCategoriesLocked] = useState(false)

  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [commune, setCommune] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [primaryCategory, setPrimaryCategory] = useState('')
  const [secondaryCategories, setSecondaryCategories] = useState([])

  // Portfolio
  const [photos, setPhotos] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pendingCaption, setPendingCaption] = useState('')

  // Submit
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))
  const categoryOptions = CATEGORIES.map(c => ({
    value: c.key,
    label: `${c.emoji} ${t(`categories.${c.key}`)}`,
  }))
  const secondaryCategoryOptions = CATEGORIES.filter(c => c.key !== primaryCategory)

  const allSelected = primaryCategory
    ? [primaryCategory, ...secondaryCategories]
    : secondaryCategories
  const showWarning = allSelected.length > 1 && hasIncompatiblePair(allSelected)

  useEffect(() => {
    async function fetchData() {
      const [profileResult, photosResult] = await Promise.all([
        supabase.from('prestataire_profiles').select('*').eq('id', user.id).single(),
        supabase.from('portfolio_photos').select('*').eq('prestataire_id', user.id).order('created_at'),
      ])

      if (profileResult.data) {
        const d = profileResult.data
        setDisplayName(d.display_name ?? '')
        setBio(d.bio ?? '')
        setWilaya(d.wilaya ?? '')
        setCommune(d.commune ?? '')
        setYearsExp(d.years_experience?.toString() ?? '')
        setPrimaryCategory(d.primary_category ?? '')
        const sec = (d.categories ?? []).filter(k => k !== d.primary_category)
        setSecondaryCategories(sec)
        if (d.categories?.length > 0) setCategoriesLocked(true)
      }

      setPhotos(photosResult.data ?? [])
      setFetching(false)
    }
    fetchData()
  }, [user.id])

  function toggleSecondary(key) {
    setSecondaryCategories(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 2) return prev
      return [...prev, key]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError(t('errors.required')); return }
    if (!wilaya) { setError(t('errors.required')); return }
    if (!commune.trim()) { setError(t('errors.required')); return }
    if (!primaryCategory) { setError(t('profile_setup.min_one_category')); return }
    setError('')
    setLoading(true)
    const categories = [primaryCategory, ...secondaryCategories]
    const { error: upsertError } = await supabase
      .from('prestataire_profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        wilaya,
        commune: commune.trim(),
        years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
        primary_category: primaryCategory,
        categories,
        is_visible: true,
      })
    setLoading(false)
    if (upsertError) {
      setError(t('errors.generic'))
    } else {
      setCategoriesLocked(true)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); navigate('/dashboard') }, 1500)
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= MAX_PHOTOS) return
    setUploadingPhoto(true)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${Date.now()}-${safeName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(path, file, { upsert: false })

    if (uploadError) { setError(t('errors.generic')); setUploadingPhoto(false); return }

    const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(uploadData.path)

    const { error: insertError } = await supabase.from('portfolio_photos').insert({
      prestataire_id: user.id,
      photo_url: urlData.publicUrl,
      caption: pendingCaption.trim() || null,
    })

    if (insertError) { setError(t('errors.generic')); setUploadingPhoto(false); return }

    const { data: refreshed } = await supabase
      .from('portfolio_photos')
      .select('*')
      .eq('prestataire_id', user.id)
      .order('created_at')
    setPhotos(refreshed ?? [])
    setPendingCaption('')
    setUploadingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoDelete(photo) {
    const path = photo.photo_url.split('/storage/v1/object/public/portfolio/')[1]
    await Promise.all([
      supabase.storage.from('portfolio').remove([path]),
      supabase.from('portfolio_photos').delete().eq('id', photo.id),
    ])
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  const hasNoCategories = !primaryCategory && !categoriesLocked

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile_setup.title')}</h1>

      {hasNoCategories && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          ⚠️ {t('profile_setup.visibility_warning')}
        </div>
      )}

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

        {/* Categories */}
        {categoriesLocked ? (
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">{t('profile_setup.categories')}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {[primaryCategory, ...secondaryCategories].filter(Boolean).map(key => {
                const cat = CATEGORIES.find(c => c.key === key)
                return (
                  <span key={key} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {cat?.emoji} {t(`categories.${key}`)}
                    {key === primaryCategory && <span className="ml-1 text-xs text-blue-600">(principal)</span>}
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
                          isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                          : isDisabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleSecondary(cat.key)}
                          className="accent-blue-600 shrink-0"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('profile_setup.saving') : t('profile_setup.save')}
        </button>
      </form>

      {/* Portfolio photos section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{t('portfolio.title')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('portfolio.disclaimer')}</p>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map(photo => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={photo.photo_url}
                  alt={photo.caption ?? ''}
                  className="w-full h-32 object-cover"
                />
                {photo.caption && (
                  <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>
                )}
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-blue-300 rounded-xl py-3 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
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
    </main>
  )
}
```

- [ ] **Step 4: Update App.jsx — add /mon-profil-presta route and /mon-profil redirect**

In `src/App.jsx`, add `Navigate` to imports and update the protected routes block:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import MonProfilClient from './pages/MonProfilClient'
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
          <Route path="/mon-profil" element={<Navigate to="/mon-profil-presta" replace />} />
          <Route path="/mon-profil-presta" element={<MonProfil />} />
          <Route path="/mon-profil-client" element={<MonProfilClient />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
        </Route>
      </Routes>
    </div>
  )
}
```

- [ ] **Step 5: Run MonProfil tests to confirm all pass**

```
npm run test -- --run src/__tests__/MonProfil.test.jsx
```

Expected: 4 passed.

- [ ] **Step 6: Run full suite**

```
npm run test -- --run
```

Expected: 48+ passed, 0 failed.

- [ ] **Step 7: Commit**

```
git add src/pages/MonProfil.jsx src/App.jsx src/__tests__/MonProfil.test.jsx
git commit -m "feat: /mon-profil-presta with category lock, primary category, and portfolio upload"
```

---

## Task 5: /mon-profil-client + Navbar profile icon

**Files:**
- Create: `src/pages/MonProfilClient.jsx`
- Create: `src/__tests__/MonProfilClient.test.jsx`
- Modify: `src/components/layout/Navbar.jsx`

**Interfaces:**
- `MonProfilClient` fetches `profiles` row for `user.id`, updates `first_name`, `last_name`, `wilaya`, `contact_phone`.
- Navbar: add `<Link to="/mon-profil-presta">` or `<Link to="/mon-profil-client">` with 👤 icon, always visible (emoji) + text hidden on mobile — same pattern as 💬 and 📋 links.

- [ ] **Step 1: Write failing tests for MonProfilClient**

Create `src/__tests__/MonProfilClient.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfilClient from '../pages/MonProfilClient'

const mockNavigate = vi.fn()
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
      update: mockUpdate,
    })),
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
  mockNavigate.mockClear()
  mockUpdate.mockClear()
  mockEq.mockClear()
  mockSingle.mockResolvedValue({ data: null, error: null })
})

test('renders first name, last name and phone fields', async () => {
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom de famille/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument()
  })
})

test('pre-fills fields when profile data exists', async () => {
  mockSingle.mockResolvedValue({
    data: { first_name: 'Karim', last_name: 'Benali', wilaya: 'Alger', contact_phone: '+213612345678' },
    error: null,
  })
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('Karim')
    expect(screen.getByLabelText(/nom de famille/i)).toHaveValue('Benali')
  })
})

test('submit calls profiles update with correct fields', async () => {
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/prénom/i))
  fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Amina' } })
  fireEvent.change(screen.getByLabelText(/nom de famille/i), { target: { value: 'Boudiaf' } })
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Amina', last_name: 'Boudiaf' })
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm run test -- --run src/__tests__/MonProfilClient.test.jsx
```

Expected: 3 tests FAIL (file doesn't exist yet).

- [ ] **Step 3: Create MonProfilClient.jsx**

Create `src/pages/MonProfilClient.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const ALGERIA_PHONE_REGEX = /^\+213[5-7][0-9]{8}$/

export default function MonProfilClient() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [fetching, setFetching] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, wilaya, contact_phone')
        .eq('id', user.id)
        .single()
      if (data) {
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setWilaya(data.wilaya ?? '')
        setPhone(data.contact_phone ?? '')
      }
      setFetching(false)
    }
    fetchProfile()
  }, [user.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) { setError(t('errors.required')); return }
    if (!lastName.trim()) { setError(t('errors.required')); return }
    if (phone && !ALGERIA_PHONE_REGEX.test(phone)) {
      setError(t('errors.invalid_phone')); return
    }
    setError('')
    setLoading(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        wilaya: wilaya || null,
        contact_phone: phone.trim() || null,
      })
      .eq('id', user.id)
    setLoading(false)
    if (updateError) {
      setError(t('errors.generic'))
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('client_profile.title')}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4 font-medium">{t('client_profile.saved')}</p>}

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
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.wilaya')}
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
          <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.phone')}
          </label>
          <input
            id="client-phone"
            type="tel"
            placeholder="+213612345678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">{t('client_profile.phone_privacy')}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('client_profile.saving') : t('client_profile.save')}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Add 👤 profile icon to Navbar.jsx**

In `src/components/layout/Navbar.jsx`, inside the `{user ? ( <> ... </> ) : ...}` block, add the profile link just before the existing messages/dashboard link:

Current authenticated block:
```jsx
{user ? (
  <>
    <Link
      to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
      ...
    >
```

Replace the entire authenticated block with:
```jsx
{user ? (
  <>
    <Link
      to={profile?.role === 'prestataire' ? '/mon-profil-presta' : '/mon-profil-client'}
      className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1"
    >
      <span>👤</span>
      <span className="hidden sm:inline text-sm">{t('nav.my_profile')}</span>
    </Link>
    <Link
      to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
      className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1"
    >
      <span>{profile?.role === 'prestataire' ? '📋' : '💬'}</span>
      <span className="hidden sm:inline text-sm">
        {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
      </span>
    </Link>
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-700 hover:text-red-600 shrink-0"
    >
      {t('nav.logout')}
    </button>
  </>
```

The `nav.my_profile` key already exists in all 3 locale files as `"Mon profil"` / `"ملفي"` / `"My profile"` — verify it's there; if missing in ar.json or en.json add `"my_profile": "ملفي"` / `"my_profile": "My profile"` to the `nav` block.

- [ ] **Step 5: Run MonProfilClient tests to confirm all 3 pass**

```
npm run test -- --run src/__tests__/MonProfilClient.test.jsx
```

Expected: 3 passed.

- [ ] **Step 6: Run full suite**

```
npm run test -- --run
```

Expected: 51+ passed, 0 failed.

- [ ] **Step 7: Commit**

```
git add src/pages/MonProfilClient.jsx src/__tests__/MonProfilClient.test.jsx src/components/layout/Navbar.jsx
git commit -m "feat: /mon-profil-client page and navbar profile icon for both roles"
```

---

## Task 6: Portfolio gallery + profile views + Dashboard stats

**Files:**
- Modify: `src/pages/PrestaireProfile.jsx`
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/__tests__/PrestaireProfile.test.jsx`
- Modify: `src/__tests__/Dashboard.test.jsx`

**Interfaces:**
- `PrestaireProfile` calls `supabase.rpc('increment_profile_views', { presta_id: id })` on mount. Fetches `portfolio_photos` and renders a 2-column image grid with captions + disclaimer.
- `Dashboard` fetches `prestataire_profiles` for `views` column and shows it as a stat.

- [ ] **Step 1: Read existing test files**

Before editing, read:
- `src/__tests__/PrestaireProfile.test.jsx`
- `src/__tests__/Dashboard.test.jsx`

to understand their current mocks and add to them without breaking existing tests.

- [ ] **Step 2: Update PrestaireProfile.test.jsx**

Add these mocks and tests to the existing file. The existing mock for `supabaseClient` uses `supabase.from(...)`. Add `rpc` to the supabase mock and a `portfolio_photos` table case.

Locate the `vi.mock('../supabaseClient', ...)` factory and extend it so `supabase.rpc` is mocked:

```js
// Add to the mock factory:
rpc: vi.fn().mockResolvedValue({ error: null }),
```

And add a `portfolio_photos` table case to the `from` mock:

```js
if (table === 'portfolio_photos') return {
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 'p1', photo_url: 'https://example.com/img1.jpg', caption: 'Travail cuisine' },
        ],
        error: null,
      }),
    }),
  }),
}
```

Add one new test at the end of the file:

```jsx
test('shows portfolio photo with caption', async () => {
  i18n.changeLanguage('fr')
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByAltText(/travail cuisine/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run existing PrestaireProfile tests to confirm they still pass before changes**

```
npm run test -- --run src/__tests__/PrestaireProfile.test.jsx
```

Expected: all existing tests pass (new one FAILS — photo not fetched yet).

- [ ] **Step 4: Update PrestaireProfile.jsx**

In `src/pages/PrestaireProfile.jsx`, make these changes:

**Add portfolio photos state:**
```jsx
const [portfolioPhotos, setPortfolioPhotos] = useState([])
```

**In the `fetchProfile` useEffect**, convert to `Promise.all` that also fetches photos and calls the views RPC:

```jsx
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
```

**Replace the Portfolio section** (currently shows `t('profile.no_portfolio')`):

```jsx
{/* Portfolio */}
<section className="mb-8">
  <h2 className="text-lg font-semibold text-gray-800 mb-3">Portfolio</h2>
  {portfolioPhotos.length === 0 ? (
    <p className="text-gray-400 text-sm">{t('profile.no_portfolio')}</p>
  ) : (
    <>
      <p className="text-xs text-gray-400 mb-3">{t('portfolio.disclaimer')}</p>
      <div className="grid grid-cols-2 gap-3">
        {portfolioPhotos.map(photo => (
          <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-200">
            <img
              src={photo.photo_url}
              alt={photo.caption ?? ''}
              className="w-full h-32 object-cover"
            />
            {photo.caption && (
              <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>
            )}
          </div>
        ))}
      </div>
    </>
  )}
</section>
```

- [ ] **Step 5: Update Dashboard.test.jsx**

Add `views` to the existing prestataire_profiles mock and add a test:

In the `vi.mock('../supabaseClient', ...)` factory, add a `prestataire_profiles` case:

```js
if (table === 'prestataire_profiles') return {
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { views: 42 }, error: null }),
    }),
  }),
}
```

Add one new test at the end of the file:

```jsx
test('shows profile views count', async () => {
  i18n.changeLanguage('fr')
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Update Dashboard.jsx**

In `src/pages/Dashboard.jsx`, add views fetch and display:

**Add views state:**
```jsx
const [views, setViews] = useState(null)
```

**Add views fetch** (alongside the existing conversations fetch, in the same `useEffect`):

```jsx
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
}, [user.id])
```

**Add views stat** in the JSX, below the `<p>` subtitle line and above the conversations list:

```jsx
{views !== null && (
  <div className="flex items-center gap-2 mb-5 bg-blue-50 rounded-xl px-4 py-3">
    <span className="text-2xl">👁</span>
    <div>
      <p className="text-sm font-medium text-blue-800">{t('dashboard.views_label')}</p>
      <p className="text-lg font-bold text-blue-900">{t('dashboard.views', { count: views })}</p>
    </div>
  </div>
)}
```

- [ ] **Step 7: Run all updated tests**

```
npm run test -- --run src/__tests__/PrestaireProfile.test.jsx src/__tests__/Dashboard.test.jsx
```

Expected: all pass including the 2 new tests.

- [ ] **Step 8: Run full suite**

```
npm run test -- --run
```

Expected: 55+ passed, 0 failed.

- [ ] **Step 9: Commit**

```
git add src/pages/PrestaireProfile.jsx src/pages/Dashboard.jsx src/__tests__/PrestaireProfile.test.jsx src/__tests__/Dashboard.test.jsx
git commit -m "feat: portfolio gallery on prestataire page, profile views counter on dashboard"
```

- [ ] **Step 10: Push**

```
git push
```

---

## Future-phase notes (do not implement in 1E)

- **Keyword → category suggestions on /search**: user types "mon frigo ne marche plus" → suggest "Frigoriste". Needs NLP/embedding or a simple keyword map. Phase 2.
- **AI reverse image search** for portfolio photos: flag/ban accounts uploading stock images. Phase 2.
- **Bio reminder email**: 7 days after registration if bio is empty. Requires custom SMTP (already on launch checklist).
- **Client wilaya field on Step 2**: currently not collected (only first_name, last_name, phone). Add `clientWilaya` if desired — the `profiles.wilaya` column already exists. Deferred.
