import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Messages from '../pages/Messages'

const mockData = [
  {
    id: 'conv-1',
    prestataire_id: 'p-1',
    created_at: '2026-06-24T09:00:00Z',
    prestataire_profiles: { display_name: 'Karim Benali', avatar_url: null },
    messages: [
      { id: 'm-1', content: 'Bonjour, j\'ai besoin de vous.', created_at: '2026-06-24T09:05:00Z', sender_id: 'u-1' },
    ],
  },
]

vi.mock('../supabaseClient', () => {
  const data = [
    {
      id: 'conv-1',
      prestataire_id: 'p-1',
      created_at: '2026-06-24T09:00:00Z',
      prestataire_profiles: { display_name: 'Karim Benali', avatar_url: null },
      messages: [
        { id: 'm-1', content: "Bonjour, j'ai besoin de vous.", created_at: '2026-06-24T09:05:00Z', sender_id: 'u-1' },
      ],
    },
  ]
  const mockOrder = vi.fn().mockResolvedValue({ data, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { supabase: { from: vi.fn().mockReturnValue({ select: mockSelect }) } }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/messages']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/messages" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockNavigate.mockClear() })

test('shows conversation list with prestataire name and last message', async () => {
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText(/Bonjour, j'ai besoin de vous/i)).toBeInTheDocument()
  })
})

test('shows empty state when no conversations', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Aucune conversation/i)).toBeInTheDocument()
  })
})

test('clicking a conversation navigates to /messages/:id', async () => {
  render(<Messages />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Karim Benali'))
  fireEvent.click(screen.getByText('Karim Benali'))
  expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1')
})
