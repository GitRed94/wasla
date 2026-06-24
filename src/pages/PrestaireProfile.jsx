import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BADGE_STYLES } from '../components/ui/PrestaCard'
import ContactSheet from '../components/ui/ContactSheet'

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

      <ContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        prestaireId={id}
        prestaireName={profile.display_name}
      />
    </main>
  )
}
