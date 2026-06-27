import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Register from '../pages/Register'

const mockNavigate = vi.fn()
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') return { upsert: mockUpsert }
      if (table === 'profiles') return { update: mockUpdate }
      return {}
    }),
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

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockNavigate.mockClear()
  mockUpsert.mockClear()
  mockUpdate.mockClear()
})

test('renders role selection', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText(/client/i)[0]).toBeInTheDocument()
  expect(screen.getAllByText(/prestataire/i)[0]).toBeInTheDocument()
})

test('shows email and phone tabs', () => {
  render(<Register />, { wrapper: Wrapper })
  expect(screen.getAllByText('Email')[0]).toBeInTheDocument()
  expect(screen.getByText('Téléphone')).toBeInTheDocument()
})

test('shows prestataire step 2 after successful email registration', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/prestataire — je propose/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => {
    expect(screen.getByText(/complétez votre profil prestataire/i)).toBeInTheDocument()
  })
})

test('shows client step 2 after successful email registration', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/client — je cherche/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => {
    expect(screen.getByText(/complétez votre profil/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
  })
})

test('skip button in step 2 navigates without saving', async () => {
  render(<Register />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText(/client — je cherche/i).closest('label'))
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'Test1234!' } })
  fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
  await waitFor(() => screen.getByText(/terminer plus tard/i))
  fireEvent.click(screen.getByText(/terminer plus tard/i))
  expect(mockNavigate).toHaveBeenCalledWith('/')
  expect(mockUpdate).not.toHaveBeenCalled()
})
