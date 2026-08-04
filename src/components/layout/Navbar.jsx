import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import BottomNav from '../ui/BottomNav'

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
    <>
      <nav className="hidden sm:flex bg-surface border-b border-gray-200 px-4 py-3 items-center justify-between gap-2">
        <Link to="/" className="text-lg sm:text-xl font-bold text-primary shrink-0">
          {t('app_name')}
        </Link>

        <div className="flex items-center gap-4 shrink-0">
          <Link to="/search" className="text-gray-700 hover:text-primary flex items-center gap-1 text-sm">
            <Search size={16} /> {t('nav.search')}
          </Link>

          {user ? (
            <>
              <Link
                to={profile?.role === 'prestataire' ? '/mon-profil-presta' : '/mon-profil-client'}
                className="text-gray-700 hover:text-primary text-sm"
              >
                {t('nav.my_profile')}
              </Link>
              <Link
                to={profile?.role === 'prestataire' ? '/dashboard' : '/messages'}
                className="text-gray-700 hover:text-primary text-sm"
              >
                {profile?.role === 'prestataire' ? t('nav.dashboard') : t('nav.messages')}
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                title={t('nav.logout')}
                className="text-gray-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                {signingOut
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <LogOut size={16} />
                }
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-primary">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark">
                {t('nav.register')}
              </Link>
            </>
          )}

          <LanguageSwitcher />
        </div>
      </nav>

      <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-gray-200">
        <Link to="/" className="text-lg font-bold text-primary">{t('app_name')}</Link>
        <LanguageSwitcher />
      </div>

      <BottomNav />
    </>
  )
}
