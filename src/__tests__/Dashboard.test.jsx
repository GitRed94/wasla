import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Dashboard from '../pages/Dashboard'

vi.mock('../supabaseClient', () => {
  const mockOrder = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'conv-1',
        client_id: 'c-1',
        created_at: '2026-06-24T09:00:00Z',
        messages: [
          { id: 'm-1', content: 'Bonjour, robinet cassé.', created_at: '2026-06-24T09:05:00Z', sender_id: 'c-1' },
        ],
      },
    ],
    error: null,
  })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  return { supabase: { from: vi.fn().mockReturnValue({ select: mockSelect }) } }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'p-1' } }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/dashboard" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockNavigate.mockClear() })

test('shows conversation requests with last message preview', async () => {
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/robinet cassé/i)).toBeInTheDocument()
  })
})

test('shows empty state when no requests', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText(/Aucune demande/i)).toBeInTheDocument()
  })
})

test('clicking a request navigates to /messages/:id', async () => {
  render(<Dashboard />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText(/robinet cassé/i))
  fireEvent.click(screen.getByText(/robinet cassé/i))
  expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1')
})
