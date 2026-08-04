import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../data/wilayas'
import SelectField from '../components/ui/SelectField'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'
import SignOutButton from '../components/ui/SignOutButton'

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

  const [activeTab, setActiveTab] = useState('profile')

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

  const TABS = [
    { key: 'profile', label: t('profile_setup.tab_profile') },
    { key: 'account', label: t('profile_setup.tab_account') },
  ]

  return (
    <main className="max-w-sm mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">{t('client_profile.title')}</h1>

      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {success && <p className="text-secondary text-sm mb-4 font-medium">Changements sauvegardés ✓</p>}

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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('client_profile.wilaya')}
              </label>
              <SelectField value={wilaya} onChange={setWilaya} placeholder={t('search.all_wilayas')} options={wilayaOptions} className="w-full" />
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
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">{t('client_profile.phone_privacy')}</p>
            </div>

            <Button type="submit" loading={loading}>
              {loading ? t('client_profile.saving') : t('client_profile.save')}
            </Button>
          </form>
        </>
      )}

      {activeTab === 'account' && (
        <>
          <Card className="p-5">
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1">{t('account.email_label')}</p>
              <p className="text-sm text-gray-500 bg-surface-muted border border-gray-200 rounded-lg px-3 py-2">{user.email ?? user.phone ?? '—'}</p>
            </div>
            {user.email
              ? <PasswordChangeForm userEmail={user.email} />
              : <p className="text-sm text-gray-500">{t('account.no_email')}</p>
            }
          </Card>

          <Card className="p-5 mt-5">
            <SignOutButton />
          </Card>
        </>
      )}
    </main>
  )
}
