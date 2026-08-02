import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const ALGERIA_PHONE_REGEX = /^\+213[5-7][0-9]{8}$/

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          label: '8 caractères minimum' },
  { test: v => /[A-Z]/.test(v),        label: 'Une majuscule' },
  { test: v => /[0-9]/.test(v),        label: 'Un chiffre' },
  { test: v => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial' },
]

export default function MonProfilClient() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [fetching, setFetching] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const wilayaOptions = WILAYAS.map(w => ({ value: w, label: w }))

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, wilaya, contact_phone')
        .eq('id', user.id)
        .single()
      if (data) {
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setWilaya(data.wilaya ?? '')
        setPhone(data.contact_phone ?? '')
      }
      setFetching(false)
    }
    fetchProfile()
  }, [user.id])

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (!PASSWORD_RULES.every(r => r.test(newPassword))) {
      setPasswordError('Le mot de passe ne respecte pas les règles ci-dessous')
      return
    }
    setPasswordError('')
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      setPasswordError(t('errors.generic'))
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Les champs marqués * sont obligatoires')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (phone && !ALGERIA_PHONE_REGEX.test(phone)) {
      setError(t('errors.invalid_phone'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError('')
    setLoading(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        wilaya: wilaya || null,
        contact_phone: phone.trim() || null,
      })
      .eq('id', user.id)
    setLoading(false)
    if (updateError) {
      setError(t('errors.generic'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('client_profile.title')}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4 font-medium">Changements sauvegardés ✓</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.first_name')} *
          </label>
          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.last_name')} *
          </label>
          <input
            id="last-name"
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.wilaya')}
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
          <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">
            {t('client_profile.phone')}
          </label>
          <input
            id="client-phone"
            type="tel"
            placeholder="+213612345678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">{t('client_profile.phone_privacy')}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('client_profile.saving') : t('client_profile.save')}
        </button>
      </form>

      {/* Account section */}
      <section className="mt-10 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Compte</h2>

        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-1">Adresse email</p>
          <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{user.email ?? user.phone ?? '—'}</p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label htmlFor="new-password-client" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              id="new-password-client"
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordError('') }}
              placeholder="Nouveau mot de passe"
              className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {newPassword && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map(r => (
                  <li key={r.label} className={`text-xs flex items-center gap-1 ${r.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{r.test(newPassword) ? '✓' : '○'}</span> {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
          {passwordSuccess && <p className="text-green-600 text-sm font-medium">Mot de passe mis à jour ✓</p>}
          <button
            type="submit"
            disabled={changingPassword || !newPassword}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            {changingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </section>
    </main>
  )
}
