import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BottomNav from '../components/ui/BottomNav'

let mockAuth = { user: null, profile: null }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'nav.home': 'Accueil',
        'nav.search': 'Rechercher',
        'nav.login': 'Connexion',
        'nav.dashboard': 'Tableau de bord',
        'nav.messages': 'Messages',
        'nav.my_profile': 'Mon profil',
      }
      return translations[key] || key
    },
  }),
}))

function renderNav() {
  return render(<BottomNav />, { wrapper: MemoryRouter })
}

test('guest sees Accueil, Recherche, and Connexion', () => {
  mockAuth = { user: null, profile: null }
  renderNav()
  expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: /rechercher/i })).toHaveAttribute('href', '/search')
  expect(screen.getByRole('link', { name: /connexion/i })).toHaveAttribute('href', '/login')
})

test('prestataire sees dashboard and presta profile links', () => {
  mockAuth = { user: { id: 'u1' }, profile: { role: 'prestataire' } }
  renderNav()
  expect(screen.getByRole('link', { name: /tableau de bord/i })).toHaveAttribute('href', '/dashboard')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-presta')
})

test('client sees messages and client profile links', () => {
  mockAuth = { user: { id: 'u2' }, profile: { role: 'client' } }
  renderNav()
  expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute('href', '/messages')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-client')
})
