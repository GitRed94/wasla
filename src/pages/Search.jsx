import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import PrestaCard from '../components/ui/PrestaCard'
import SelectField from '../components/ui/SelectField'

export default function Search() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const wilaya = searchParams.get('wilaya') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat.key, label: `${cat.emoji} ${t(`categories.${cat.key}`)}` }))
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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        ← Retour
      </button>

      {/* Filter bar */}
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

      {/* Error banner */}
      {fetchError && (
        <p className="text-center text-red-500 py-4 text-sm">{fetchError}</p>
      )}

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
