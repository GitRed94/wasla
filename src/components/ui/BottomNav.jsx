import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search, ClipboardList, MessageCircle, User, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const location = useLocation()
  const isPresta = profile?.role === 'prestataire'

  const items = [
    { key: 'home', to: '/', icon: Home, label: t('nav.home') },
    { key: 'search', to: '/search', icon: Search, label: t('nav.search') },
    user
      ? isPresta
        ? { key: 'dashboard', to: '/dashboard', icon: ClipboardList, label: t('nav.dashboard') }
        : { key: 'messages', to: '/messages', icon: MessageCircle, label: t('nav.messages') }
      : { key: 'login', to: '/login', icon: LogIn, label: t('nav.login') },
    user
      ? { key: 'profile', to: isPresta ? '/mon-profil-presta' : '/mon-profil-client', icon: User, label: t('nav.my_profile') }
      : null,
  ].filter(Boolean)

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 flex justify-around z-40">
      {items.map(item => {
        const Icon = item.icon
        const active = location.pathname === item.to
        return (
          <Link
            key={item.key}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${active ? 'text-primary' : 'text-gray-500'}`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
