import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, INCOMPATIBLE_PAIRS } from '../data/categories'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const PHONE_REGEX = /^\+213[5-7][0-9]{8}$/

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: 'Une majuscule' },
  { test: v => /[0-9]/.test(v),        label: 'Un chiffre' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial (!@#$%...)' },
]

function passwordValid(v) {
  return PASSWORD_RULES.every(r => r.test(v))
}

function hasIncompatiblePair(selected) {
  return INCOMPATIBLE_PAIRS.some(([a, b]) => selected.includes(a) && selected.includes(b))
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Step 1 state
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('')
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleError, setRoleError] = useState(false)

  // Step 2 — prestataire
  const [displayName, setDisplayName] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [commune, setCommune] = useState('')
  const [primaryCategory, setPrimaryCategory] = useState('')
  const [secondaryCategories, setSecondaryCategories] = useState([])

  // Step 2 — client
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clientWilaya, setClientWilaya] = useState('')
  const [clientPhone, setClientPhone] = useState('')

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
    if (user && step === 1) navigate('/')
  }, [user, step, navigate])

  function classifyError(error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('already registered') || msg.includes('already exists') || error.status === 422) {
      return 'Cet email est déjà utilisé. Connectez-vous plutôt.'
    }
    if (error.status === 429 || msg.includes('rate limit') || msg.includes('security purposes')) {
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    }
    return t('errors.auth_failed')
  }

  function goToStep2(uid) {
    setUserId(uid)
    setStep(2)
    setError('')
  }

  function afterStep2(r) {
    navigate(r === 'prestataire' ? '/mon-profil-presta' : '/')
  }

  async function handleEmailRegister(e) {
    e.preventDefault()
    if (!role) { setRoleError(true); setError(''); return }
    if (!passwordValid(password)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      })
      if (error) {
        setError(classifyError(error))
      } else if (data.user && !data.session) {
        setSuccess('Inscription réussie ! Vérifiez votre email pour activer votre compte, puis connectez-vous.')
      } else {
        goToStep2(data.user.id)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!role) { setRoleError(true); setError(''); return }
    if (!PHONE_REGEX.test(phone)) { setError(t('errors.invalid_phone')); return }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { data: { role } },
      })
      if (error) setError(classifyError(error))
      else setOtpSent(true)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
      if (error) {
        setError(classifyError(error))
      } else {
        const uid = data?.user?.id ?? (await supabase.auth.getUser()).data.user?.id
        goToStep2(uid)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  function toggleSecondary(key) {
    setSecondaryCategories(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= 2) return prev
      return [...prev, key]
    })
  }

  async function handleStep2PrestaSubmit(e) {
    e.preventDefault()
    if (!displayName.trim()) { setError(t('errors.required')); return }
    if (!wilaya) { setError(t('errors.required')); return }
    if (!commune.trim()) { setError(t('errors.required')); return }
    if (!primaryCategory) { setError(t('errors.required')); return }
    setError('')
    setLoading(true)
    try {
      const categories = [primaryCategory, ...secondaryCategories]
      const { error } = await supabase
        .from('prestataire_profiles')
        .upsert({
          id: userId,
          display_name: displayName.trim(),
          wilaya,
          commune: commune.trim(),
          primary_category: primaryCategory,
          categories,
          is_visible: true,
        })
      if (error) { setError(t('errors.generic')); return }
      afterStep2('prestataire')
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2ClientSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) { setError(t('errors.required')); return }
    if (!lastName.trim()) { setError(t('errors.required')); return }
    if (!clientWilaya) { setError(t('errors.required')); return }
    if (clientPhone && !PHONE_REGEX.test(clientPhone)) {
      setError(t('errors.invalid_phone')); return
    }
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          wilaya: clientWilaya,
          contact_phone: clientPhone.trim() || null,
        })
        .eq('id', userId)
      if (error) { setError(t('errors.generic')); return }
      afterStep2('client')
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 render ──────────────────────────────────────────────
  if (step === 2 && role === 'prestataire') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t('register_step2.title_presta')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('register_step2.subtitle_presta')}</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleStep2PrestaSubmit} className="space-y-4">
            <div>
              <label htmlFor="s2-display-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.display_name')} *
              </label>
              <input
                id="s2-display-name"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile_setup.wilaya')} *
              </label>
              <SelectField
                value={wilaya}
                onChange={setWilaya}
                placeholder={t('search.all_wilayas')}
                options={wilayaOptions}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="s2-commune" className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile_setup.commune')} *
              </label>
              <input
                id="s2-commune"
                type="text"
                value={commune}
                onChange={e => setCommune(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.primary_category')} *
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
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register_step2.secondary_categories')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {secondaryCategoryOptions.map(cat => {
                    const isSelected = secondaryCategories.includes(cat.key)
                    const isDisabled = !isSelected && secondaryCategories.length >= 2
                    return (
                      <label
                        key={cat.key}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
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
                {secondaryCategories.length >= 2 && (
                  <p className="text-xs text-gray-400 mt-1">{t('register_step2.max_secondary')}</p>
                )}
              </div>
            )}

            {showWarning && (
              <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ {t('register_step2.warning_incompatible')}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => afterStep2('prestataire')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                {t('register_step2.skip')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('register_step2.saving') : t('register_step2.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (step === 2 && role === 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t('register_step2.title_client')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('register_step2.subtitle_client')}</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleStep2ClientSubmit} className="space-y-4">
            <div>
              <label htmlFor="s2-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.first_name')} *
              </label>
              <input
                id="s2-first-name"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="s2-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.last_name')} *
              </label>
              <input
                id="s2-last-name"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.wilaya')} *
              </label>
              <SelectField
                value={clientWilaya}
                onChange={setClientWilaya}
                placeholder={t('search.all_wilayas')}
                options={wilayaOptions}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_step2.phone_optional')}
              </label>
              <input
                type="tel"
                placeholder="+213612345678"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('register_step2.phone_privacy')}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => afterStep2('client')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                {t('register_step2.skip')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('register_step2.saving') : t('register_step2.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Step 1: Auth form (unchanged layout) ──────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.register_title')}</h1>

        <p className={`text-sm font-medium mb-3 ${roleError ? 'text-red-600' : 'text-gray-700'}`}>
          {t('auth.choose_role')}{roleError && ' — sélectionnez une option'}
        </p>
        <div className={`space-y-2 mb-6 rounded-lg ${roleError ? 'outline outline-2 outline-red-400 p-2' : ''}`}>
          {['client', 'prestataire'].map(r => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => { setRole(r); setRoleError(false) }}
                className="accent-blue-600"
              />
              <span className="text-sm">{t(`auth.role_${r}`)}</span>
            </label>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'email' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.email')}
          </button>
          <button
            onClick={() => setTab('phone')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'phone' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t('auth.phone')}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4 font-medium">{success}</p>}

        {tab === 'email' && (
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map(rule => {
                  const met = rule.test(password)
                  return (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : password.length > 0 ? 'text-red-400' : 'text-gray-400'}`}
                    >
                      <span>{met ? '✓' : '•'}</span>
                      <span>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('register_step2.saving') : t('auth.submit_register')}
            </button>
          </form>
        )}

        {tab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.phone')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+213612345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('register_step2.saving') : t('auth.submit_register')}
            </button>
          </form>
        )}

        {tab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">{t('auth.otp_sent')}</p>
            <div>
              <label htmlFor="reg-otp" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.enter_otp')}
              </label>
              <input
                id="reg-otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {t('auth.verify')}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.already_account')}{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
