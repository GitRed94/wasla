import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import BottomNav from '../components/ui/BottomNav'

let mockAuth = { user: null, profile: null }
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  i18n.changeLanguage('fr')
})

test('guest sees Accueil, Recherche, and Connexion', () => {
  mockAuth = { user: null, profile: null }
  render(<BottomNav />, { wrapper: Wrapper })
  expect(screen.getByRole('link', { name: /accueil/i })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: /rechercher/i })).toHaveAttribute('href', '/search')
  expect(screen.getByRole('link', { name: /connexion/i })).toHaveAttribute('href', '/login')
})

test('prestataire sees dashboard and presta profile links', () => {
  mockAuth = { user: { id: 'u1' }, profile: { role: 'prestataire' } }
  render(<BottomNav />, { wrapper: Wrapper })
  expect(screen.getByRole('link', { name: /tableau de bord/i })).toHaveAttribute('href', '/dashboard')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-presta')
})

test('client sees messages and client profile links', () => {
  mockAuth = { user: { id: 'u2' }, profile: { role: 'client' } }
  render(<BottomNav />, { wrapper: Wrapper })
  expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute('href', '/messages')
  expect(screen.getByRole('link', { name: /mon profil/i })).toHaveAttribute('href', '/mon-profil-client')
})
