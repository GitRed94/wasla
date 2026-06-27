import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'

const ALGERIA_PHONE_REGEX = /^\+213[5-7][0-9]{8}$/

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) { setError(t('errors.required')); return }
    if (!lastName.trim()) { setError(t('errors.required')); return }
    if (phone && !ALGERIA_PHONE_REGEX.test(phone)) {
      setError(t('errors.invalid_phone')); return
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
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">{t('profile_setup.loading')}</div>

  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('client_profile.title')}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4 font-medium">{t('client_profile.saved')}</p>}

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
            required
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
            required
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
    </main>
  )
}
