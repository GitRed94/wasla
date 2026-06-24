import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfil from '../pages/MonProfil'

const mockUpsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: mockUpsert,
        }
      }
      return {}
    }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' }, profile: { role: 'prestataire' } }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockUpsert.mockClear()
})

test('shows setup form when no profile exists', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/Nom affiché/i)).toBeInTheDocument()
  })
})

test('shows category checkboxes', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Plombier/i)).toBeInTheDocument()
    expect(screen.getByText(/Électricien/i)).toBeInTheDocument()
  })
})

test('submit calls supabase upsert', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/Nom affiché/i))

  fireEvent.change(screen.getByLabelText(/Nom affiché/i), { target: { value: 'Karim Pro' } })

  // Open the wilaya SelectField and pick the first real option
  fireEvent.click(screen.getByText(/toutes les wilayas/i).closest('button'))
  await waitFor(() => screen.getAllByRole('option'))
  const options = screen.getAllByRole('option')
  fireEvent.click(options[1]) // index 0 is the "clear" placeholder, index 1 is first real wilaya

  fireEvent.change(screen.getByLabelText(/Commune/i), { target: { value: 'Alger Centre' } })

  // Select at least one category checkbox
  const checkboxes = screen.getAllByRole('checkbox')
  fireEvent.click(checkboxes[0])

  fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
  await waitFor(() => {
    expect(mockUpsert).toHaveBeenCalled()
  })
})
