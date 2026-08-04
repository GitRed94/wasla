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
