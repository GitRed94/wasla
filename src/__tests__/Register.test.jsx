import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Register from '../pages/Register'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

test('renders role selection', () => {
  i18n.changeLanguage('fr')
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText(/client/i)[0]).toBeInTheDocument()
  expect(screen.getAllByText(/prestataire/i)[0]).toBeInTheDocument()
})

test('shows email and phone tabs', () => {
  i18n.changeLanguage('fr')
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText('Email')[0]).toBeInTheDocument()
  expect(screen.getByText('Téléphone')).toBeInTheDocument()
})
