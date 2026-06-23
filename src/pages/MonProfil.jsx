import { useTranslation } from 'react-i18next'

export default function MonProfil() {
  const { t } = useTranslation()
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t('nav.my_profile')}</h1>
      <p className="text-gray-500 mt-2">Votre profil prestataire — bientôt disponible.</p>
    </main>
  )
}
