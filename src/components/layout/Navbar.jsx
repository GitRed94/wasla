import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) setSigningOut(false)
  }, [user])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
      <Link to="/" className="text-lg sm:text-xl font-bold text-blue-600 shrink-0">
        {t('app_name')}
      </Link>

      <div className="flex items-center gap-2 min-w-0">
        <Link to="/search" className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1">
          <span>🔍</span>
          <span className="hidden sm:inline text-sm">{t('nav.search')}</span>
        </Link>

        {user ? (
          <>
            <Link
              to={profile?.role === 'prestataire' ? '/mon-profil-presta' : '/mon-profil-client'}
              className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1"
            >
              <span>👤</span>
              <span className="hidden sm:inline text-sm">{t('nav.my_profile')}</span>
            </Link>
            <Link
              to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
              className="text-gray-700 hover:text-blue-600 shrink-0 flex items-center gap-1"
            >
              <span>{profile?.role === 'prestataire' ? '📋' : '💬'}</span>
              <span className="hidden sm:inline text-sm">
                {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-gray-700 hover:text-red-600 shrink-0 disabled:opacity-50 flex items-center gap-1"
            >
              {signingOut ? (
                <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>🚪</span>
              )}
              <span className="hidden sm:inline text-sm">{t('nav.logout')}</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600 shrink-0">
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 shrink-0"
            >
              {t('nav.register')}
            </Link>
          </>
        )}

        <LanguageSwitcher />
      </div>
    </nav>
  )
}
