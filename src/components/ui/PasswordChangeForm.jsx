import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import Button from './Button'

const PASSWORD_RULES = [
  { test: v => v.length >= 8,          key: 'account.rule_min_length' },
  { test: v => /[A-Z]/.test(v),        key: 'account.rule_uppercase' },
  { test: v => /[0-9]/.test(v),        key: 'account.rule_digit' },
  { test: v => /[^A-Za-z0-9]/.test(v), key: 'account.rule_special_char' },
]

export default function PasswordChangeForm({ userEmail }) {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!PASSWORD_RULES.every(r => r.test(newPassword))) {
      setError(t('account.password_rules_not_met'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('account.password_mismatch'))
      return
    }

    setLoading(true)
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })
      if (reauthError) {
        setError(t('account.current_password_wrong'))
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(t('errors.generic'))
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.current_password')}
        </label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={e => { setCurrentPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.new_password')}
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {newPassword && (
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map(r => (
              <li key={r.key} className={`text-xs flex items-center gap-1 ${r.test(newPassword) ? 'text-secondary' : 'text-gray-400'}`}>
                <span>{r.test(newPassword) ? '✓' : '○'}</span> {t(r.key)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('account.confirm_password')}
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError('') }}
          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-secondary text-sm font-medium">{t('account.password_updated')}</p>}

      <Button
        type="submit"
        variant="secondary"
        loading={loading}
        disabled={!currentPassword || !newPassword || !confirmPassword}
      >
        {loading ? t('account.updating') : t('account.change_password')}
      </Button>
    </form>
  )
}
