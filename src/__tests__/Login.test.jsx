import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Login from '../pages/Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
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

test('renders email and phone tabs', () => {
  render(<Login />, { wrapper: Wrapper })
  expect(screen.getAllByText('Email')[0]).toBeInTheDocument()
  const phoneTab =
    screen.queryByText(/t.l.phone/i) ||
    screen.queryByText('Téléphone') ||
    screen.queryByText('Phone')
  expect(phoneTab).toBeTruthy()
})

test('shows email and password fields by default', () => {
  render(<Login />, { wrapper: Wrapper })
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/mot de passe|password/i)).toBeInTheDocument()
})
