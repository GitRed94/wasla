import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BADGE_TONES } from '../components/ui/PrestaCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ContactSheet from '../components/ui/ContactSheet'

export default function PrestaireProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile: authProfile } = useAuth()

  const [profile, setProfile] = useState(null)
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)

  const handleContactClose = useCallback(() => setContactOpen(false), [])

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

  if (loading) return <div className="p-8 text-center text-gray-400">{t('profile.loading')}</div>
  if (!profile) return <div className="p-8 text-center text-gray-500">{t('profile.not_found')}</div>

  const isClient = user && authProfile?.role === 'client'
  const isGuest = !user

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-muted flex items-center justify-center text-3xl sm:text-4xl shrink-0">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover rounded-full" />
            : '👤'}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text truncate">{profile.display_name}</h1>
          <p className="text-gray-500 text-sm">{profile.wilaya}</p>
          <Badge tone={BADGE_TONES[profile.badge] ?? 'gray'} className="mt-1">
            {t(`profile.badge_${profile.badge}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(profile.categories ?? []).map(cat => (
          <span key={cat} className="text-sm bg-blue-50 text-primary px-3 py-1 rounded-full">
            {t(`categories.${cat}`)}
          </span>
        ))}
        {profile.years_experience && (
          <span className="text-sm text-gray-500 px-3 py-1">
            {t('profile.years_exp', { count: profile.years_experience })}
          </span>
        )}
      </div>

      {profile.bio && <p className="text-gray-700 mb-8 leading-relaxed">{profile.bio}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">Portfolio</h2>
        {portfolioPhotos.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('profile.no_portfolio')}</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{t('portfolio.disclaimer')}</p>
            <div className="grid grid-cols-2 gap-3">
              {portfolioPhotos.map(photo => (
                <div key={photo.id} className="rounded-card overflow-hidden border border-gray-200">
                  <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-32 object-cover" />
                  {photo.caption && <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mb-24">
        <h2 className="text-lg font-semibold text-text mb-3">Avis</h2>
        <p className="text-gray-400 text-sm">{t('profile.no_reviews')}</p>
      </section>

      {(isClient || isGuest) && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-surface border-t border-gray-200 px-4 py-3">
          {isClient && (
            <Button data-testid="contact-btn" onClick={() => setContactOpen(true)}>
              {t('profile.contact_btn')}
            </Button>
          )}
          {isGuest && (
            <Button data-testid="contact-btn-guest" onClick={() => navigate(`/login?redirect=/prestataire/${id}`)}>
              {t('profile.contact_btn')}
            </Button>
          )}
        </div>
      )}

      <ContactSheet open={contactOpen} onClose={handleContactClose} prestaireId={id} prestaireName={profile.display_name} />
    </main>
  )
}
