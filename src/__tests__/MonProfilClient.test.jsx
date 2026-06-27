import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfilClient from '../pages/MonProfilClient'

const mockNavigate = vi.fn()
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
      update: mockUpdate,
    })),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
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
  mockUpdate.mockClear()
  mockEq.mockClear()
  mockSingle.mockResolvedValue({ data: null, error: null })
})

test('renders first name, last name and phone fields', async () => {
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom de famille/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument()
  })
})

test('pre-fills fields when profile data exists', async () => {
  mockSingle.mockResolvedValue({
    data: { first_name: 'Karim', last_name: 'Benali', wilaya: 'Alger', contact_phone: '+213612345678' },
    error: null,
  })
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('Karim')
    expect(screen.getByLabelText(/nom de famille/i)).toHaveValue('Benali')
  })
})

test('submit calls profiles update with correct fields', async () => {
  render(<MonProfilClient />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/prénom/i))
  fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'Amina' } })
  fireEvent.change(screen.getByLabelText(/nom de famille/i), { target: { value: 'Boudiaf' } })
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Amina', last_name: 'Boudiaf' })
    )
  })
})
