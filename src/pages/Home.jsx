import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t('home.hero_title')}</h1>
      <p className="text-gray-600 mt-2">{t('home.hero_subtitle')}</p>
    </main>
  )
}
