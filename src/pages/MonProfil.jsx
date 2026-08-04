import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'

const MAX_PHOTOS = 6

function hasIncompatiblePair(selected) {
  return INCOMPATIBLE_PAIRS.some(([a, b]) => selected.includes(a) && selected.includes(b))
}

export default function MonProfil() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const isNewProfileRef = useRef(false)

  const [fetching, setFetching] = useState(true)
  const [categoriesLocked, setCategoriesLocked] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

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
        if (!d.display_name) isNewProfileRef.current = true
        setDisplayName(d.display_name ?? '')
        setBio(d.bio ?? '')
        setWilaya(d.wilaya ?? '')
        setCommune(d.commune ?? '')
        setYearsExp(d.years_experience?.toString() ?? '')
        setPrimaryCategory(d.primary_category ?? '')
        const sec = (d.categories ?? []).filter(k => k !== d.primary_category)
        setSecondaryCategories(sec)
        if (d.categories?.length > 0) setCategoriesLocked(true)
      } else {
        isNewProfileRef.current = true
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
    if (!displayName.trim() || !wilaya || !commune.trim() || !primaryCategory) {
      setError('Les champs marqués * sont obligatoires')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (yearsExp) {
      const exp = parseInt(yearsExp, 10)
      if (isNaN(exp) || exp < 1 || exp > 99) {
        setError("Années d'expérience doit être entre 1 et 99")
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setCategoriesLocked(true)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (isNewProfileRef.current) {
        isNewProfileRef.current = false
        setTimeout(() => { setSuccess(false); navigate('/dashboard') }, 1500)
      } else {
        setTimeout(() => setSuccess(false), 2000)
      }
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

    const { data: refreshed, error: refreshError } = await supabase
      .from('portfolio_photos')
      .select('*')
      .eq('prestataire_id', user.id)
      .order('created_at')
    if (!refreshError) setPhotos(refreshed ?? [])
    setPendingCaption('')
    setUploadingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoDelete(photo) {
    const path = photo.photo_url.split('/storage/v1/object/public/portfolio/')[1]
    try {
      const [storageResult, dbResult] = await Promise.all([
        supabase.storage.from('portfolio').remove([path]),
        supabase.from('portfolio_photos').delete().eq('id', photo.id),
      ])
      if (storageResult.error || dbResult.error) {
        setError(t('errors.generic'))
        return
      }
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch {
      setError(t('errors.generic'))
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  const hasNoCategories = !primaryCategory && !categoriesLocked

  const TABS = [
    { key: 'profile', label: t('profile_setup.tab_profile') },
    { key: 'account', label: t('profile_setup.tab_account') },
    { key: 'portfolio', label: t('profile_setup.tab_portfolio') },
  ]

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">{t('profile_setup.title')}</h1>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <>
          {hasNoCategories && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              ⚠️ {t('profile_setup.visibility_warning')}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {success && <p className="text-secondary text-sm mb-4 font-medium">Changements sauvegardés ✓</p>}

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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="years-exp" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile_setup.years_exp')}
              </label>
              <input
                id="years-exp"
                type="text"
                inputMode="numeric"
                value={yearsExp}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
                  setYearsExp(val)
                }}
                placeholder="ex: 5"
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {categoriesLocked ? (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">{t('profile_setup.categories')}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[primaryCategory, ...secondaryCategories].filter(Boolean).map(key => {
                    const cat = CATEGORIES.find(c => c.key === key)
                    return (
                      <span key={key} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {cat?.emoji} {t(`categories.${key}`)}
                        {key === primaryCategory && <span className="ml-1 text-xs text-primary">{t('profile_setup.primary_label')}</span>}
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
                              isSelected ? 'border-primary bg-blue-50 text-primary cursor-pointer'
                              : isDisabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => toggleSecondary(cat.key)}
                              className="accent-primary shrink-0"
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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <Button type="submit" loading={loading}>
              {loading ? t('profile_setup.saving') : t('profile_setup.save')}
            </Button>
          </form>
        </>
      )}

      {activeTab === 'account' && (
        <Card className="p-5">
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1">{t('account.email_label')}</p>
            <p className="text-sm text-gray-500 bg-surface-muted border border-gray-200 rounded-lg px-3 py-2">{user.email ?? user.phone ?? '—'}</p>
          </div>
          <PasswordChangeForm userEmail={user.email} />
        </Card>
      )}

      {activeTab === 'portfolio' && (
        <section>
          <p className="text-xs text-gray-400 mb-4">{t('portfolio.disclaimer')}</p>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative rounded-card overflow-hidden border border-gray-200">
                  <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-32 object-cover" />
                  {photo.caption && <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-primary rounded-card py-3 text-sm text-primary cursor-pointer hover:bg-blue-50 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
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
      )}
    </main>
  )
}
