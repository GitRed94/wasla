import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import ContactSheet from '../components/ui/ContactSheet'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'conv-1' }, error: null }),
  }),
})

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'conversations') return { upsert: mockUpsert }
      if (table === 'messages') return { insert: mockInsert }
      return {}
    }),
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
  mockInsert.mockClear()
  mockUpsert.mockClear()
})

test('renders textarea and send button when open', () => {
  render(
    <ContactSheet open={true} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  expect(screen.getByPlaceholderText(/Décrivez votre besoin/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument()
})

test('does not render when closed', () => {
  render(
    <ContactSheet open={false} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  expect(screen.queryByPlaceholderText(/Décrivez votre besoin/i)).not.toBeInTheDocument()
})

test('calls supabase and shows success on submit', async () => {
  render(
    <ContactSheet open={true} onClose={vi.fn()} prestaireId="p-1" prestaireName="Karim" />,
    { wrapper: Wrapper }
  )
  fireEvent.change(screen.getByPlaceholderText(/Décrivez votre besoin/i), {
    target: { value: 'Bonjour, j\'ai besoin de vous.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }))
  await waitFor(() => {
    expect(screen.getByText(/Message envoyé/i)).toBeInTheDocument()
  })
  expect(mockUpsert).toHaveBeenCalled()
  expect(mockInsert).toHaveBeenCalled()
})
