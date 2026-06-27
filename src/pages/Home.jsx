import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [wilaya, setWilaya] = useState('')

  const categoryOptions = CATEGORIES.map(cat => ({ value: cat.key, label: `${cat.emoji} ${t(`categories.${cat.key}`)}` }))
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
          {CATEGORIES.slice(0, 8).map(cat => (
            <button
              key={cat.key}
              data-testid={`category-card-${cat.key}`}
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
