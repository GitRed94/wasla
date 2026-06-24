import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const PHONE_REGEX = /^\+\d{7,15}$/

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: 'Une majuscule' },
  { test: v => /[0-9]/.test(v),        label: 'Un chiffre' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial (!@#$%...)' },
]

function passwordValid(v) {
  return PASSWORD_RULES.every(r => r.test(v))
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
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

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

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

  async function handleEmailRegister(e) {
    e.preventDefault()
    if (!role) { setError(t('errors.required')); return }
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
        navigate(role === 'prestataire' ? '/mon-profil' : '/')
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!role) { setError(t('errors.required')); return }
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
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
      if (error) setError(classifyError(error))
      else navigate(role === 'prestataire' ? '/mon-profil' : '/')
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.register_title')}</h1>

        <p className="text-sm font-medium text-gray-700 mb-3">{t('auth.choose_role')}</p>
        <div className="space-y-2 mb-6">
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
                onChange={() => setRole(r)}
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
              {loading ? 'Inscription en cours...' : t('auth.submit_register')}
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
              {loading ? 'Envoi en cours...' : t('auth.submit_register')}
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
