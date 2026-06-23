import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
      <p className="text-gray-500 mt-2">Tableau de bord — bientôt disponible.</p>
    </main>
  )
}
