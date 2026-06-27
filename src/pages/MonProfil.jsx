import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const MAX_PHOTOS = 6

function hasIncompatiblePair(selected) {
  return INCOMPATIBLE_PAIRS.some(([a, b]) => selected.includes(a) && selected.includes(b))
}

export default function MonProfil() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [fetching, setFetching] = useState(true)
  const [categoriesLocked, setCategoriesLocked] = useState(false)

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
        setDisplayName(d.display_name ?? '')
        setBio(d.bio ?? '')
        setWilaya(d.wilaya ?? '')
        setCommune(d.commune ?? '')
        setYearsExp(d.years_experience?.toString() ?? '')
        setPrimaryCategory(d.primary_category ?? '')
        const sec = (d.categories ?? []).filter(k => k !== d.primary_category)
        setSecondaryCategories(sec)
        if (d.categories?.length > 0) setCategoriesLocked(true)
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
    if (!displayName.trim()) { setError(t('errors.required')); return }
    if (!wilaya) { setError(t('errors.required')); return }
    if (!commune.trim()) { setError(t('errors.required')); return }
    if (!primaryCategory) { setError(t('profile_setup.min_one_category')); return }
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
    } else {
      setCategoriesLocked(true)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); navigate('/dashboard') }, 1500)
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

    const { data: refreshed } = await supabase
      .from('portfolio_photos')
      .select('*')
      .eq('prestataire_id', user.id)
      .order('created_at')
    setPhotos(refreshed ?? [])
    setPendingCaption('')
    setUploadingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoDelete(photo) {
    const path = photo.photo_url.split('/storage/v1/object/public/portfolio/')[1]
    await Promise.all([
      supabase.storage.from('portfolio').remove([path]),
      supabase.from('portfolio_photos').delete().eq('id', photo.id),
    ])
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  const hasNoCategories = !primaryCategory && !categoriesLocked

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile_setup.title')}</h1>

      {hasNoCategories && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          ⚠️ {t('profile_setup.visibility_warning')}
        </div>
      )}

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

        {/* Categories */}
        {categoriesLocked ? (
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">{t('profile_setup.categories')}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {[primaryCategory, ...secondaryCategories].filter(Boolean).map(key => {
                const cat = CATEGORIES.find(c => c.key === key)
                return (
                  <span key={key} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {cat?.emoji} {t(`categories.${key}`)}
                    {key === primaryCategory && <span className="ml-1 text-xs text-blue-600">(principal)</span>}
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
                          isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                          : isDisabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleSecondary(cat.key)}
                          className="accent-blue-600 shrink-0"
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

      {/* Portfolio photos section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{t('portfolio.title')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('portfolio.disclaimer')}</p>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map(photo => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={photo.photo_url}
                  alt={photo.caption ?? ''}
                  className="w-full h-32 object-cover"
                />
                {photo.caption && (
                  <p className="text-xs text-gray-600 px-2 py-1 truncate">{photo.caption}</p>
                )}
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-blue-300 rounded-xl py-3 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
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
    </main>
  )
}
