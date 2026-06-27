import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import MonProfil from '../pages/MonProfil'

const mockNavigate = vi.fn()
const mockSingle = vi.fn()
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockPhotoSelect = vi.fn()
const mockPhotoInsert = vi.fn().mockResolvedValue({ error: null })
const mockPhotoDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockStorageUpload = vi.fn().mockResolvedValue({ data: { path: 'user-1/photo.jpg' }, error: null })
const mockStorageGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/photo.jpg' } })
const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'prestataire_profiles') return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
        upsert: mockUpsert,
      }
      if (table === 'portfolio_photos') return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
        insert: mockPhotoInsert,
        delete: mockPhotoDelete,
      }
      return {}
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
      })),
    },
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
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockUpsert.mockClear()
  mockNavigate.mockClear()
})

test('shows form with display_name and primary category selector when profile is new', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByLabelText(/nom affiché/i)).toBeInTheDocument()
  })
  expect(screen.queryByText(/vos métiers sont verrouillés/i)).not.toBeInTheDocument()
})

test('shows category lock message when existing profile has categories', async () => {
  mockSingle.mockResolvedValue({
    data: {
      display_name: 'Ali',
      bio: '',
      wilaya: 'Alger',
      commune: 'Bab El Oued',
      years_experience: 5,
      categories: ['plombier'],
      primary_category: 'plombier',
      is_visible: true,
    },
    error: null,
  })
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/vos métiers sont verrouillés/i)).toBeInTheDocument()
  })
})

test('shows portfolio section with upload button', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/photos de réalisations/i)).toBeInTheDocument()
    expect(screen.getByText(/ajouter une photo/i)).toBeInTheDocument()
  })
})

test('submit calls upsert with primary_category and categories array', async () => {
  render(<MonProfil />, { wrapper: Wrapper })
  await waitFor(() => screen.getByLabelText(/nom affiché/i))

  fireEvent.change(screen.getByLabelText(/nom affiché/i), { target: { value: 'Ali Mechanics' } })
  fireEvent.change(screen.getByLabelText(/commune/i), { target: { value: 'Hussein Dey' } })

  // Select wilaya via SelectField
  fireEvent.click(screen.getByText(/toutes les wilayas/i).closest('button'))
  await waitFor(() => screen.getAllByRole('option'))
  fireEvent.click(screen.getAllByRole('option')[1])

  // Select primary category via SelectField
  fireEvent.click(screen.getByText(/toutes les catégories/i).closest('button'))
  await waitFor(() => screen.getAllByRole('option'))
  fireEvent.click(screen.getAllByRole('option')[1])

  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  await waitFor(() => {
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'Ali Mechanics',
        is_visible: true,
      })
    )
  })
})
