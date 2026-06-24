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

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

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
            {t('profile_setup.wilaya')}
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
          {loading ? t('profile_setup.saving') : t('profile_setup.save')}
        </button>
      </form>
    </main>
  )
}
