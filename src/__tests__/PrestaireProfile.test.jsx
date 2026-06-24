import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import PrestaireProfile from '../pages/PrestaireProfile'

const mockProfile = {
  id: 'abc-1',
  display_name: 'Karim Benali',
  bio: 'Électricien à Alger.',
  badge: 'verified',
  wilaya: 'Alger',
  commune: 'Alger Centre',
  categories: ['electricien'],
  avatar_url: null,
  years_experience: 8,
  is_visible: true,
}

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'abc-1',
              display_name: 'Karim Benali',
              bio: 'Électricien à Alger.',
              badge: 'verified',
              wilaya: 'Alger',
              commune: 'Alger Centre',
              categories: ['electricien'],
              avatar_url: null,
              years_experience: 8,
              is_visible: true,
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/prestataire/abc-1']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/prestataire/:id" element={children} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  useAuth.mockReturnValue({ user: null, profile: null })
})

test('renders display_name and bio', async () => {
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText('Électricien à Alger.')).toBeInTheDocument()
  })
})

test('shows contact button for logged-in client', async () => {
  useAuth.mockReturnValue({ user: { id: 'u1' }, profile: { role: 'client' } })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByTestId('contact-btn')).toBeInTheDocument()
  })
})

test('hides contact button for logged-in prestataire', async () => {
  useAuth.mockReturnValue({ user: { id: 'u2' }, profile: { role: 'prestataire' } })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.queryByTestId('contact-btn')).not.toBeInTheDocument()
  })
})

test('redirects to /login when unauthenticated user clicks contact', async () => {
  useAuth.mockReturnValue({ user: null, profile: null })
  render(<PrestaireProfile />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByTestId('contact-btn-guest')).toBeInTheDocument()
  })
})
