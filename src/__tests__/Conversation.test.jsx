import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Conversation from '../pages/Conversation'

const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'conv-1', client_id: 'u-1', prestataire_id: 'p-1', prestataire_profiles: { display_name: 'Karim Benali' } },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'messages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'm-1', content: 'Bonjour Karim', sender_id: 'u-1', created_at: '2026-06-24T10:00:00Z' },
                  { id: 'm-2', content: 'Bonjour, comment puis-je vous aider ?', sender_id: 'p-1', created_at: '2026-06-24T10:01:00Z' },
                ],
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        }
      }
      return {}
    }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/messages/conv-1']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/messages/:id" element={children} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => { i18n.changeLanguage('fr'); mockInsert.mockClear() })

test('renders messages from both parties', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => {
    expect(screen.getByText('Bonjour Karim')).toBeInTheDocument()
    expect(screen.getByText('Bonjour, comment puis-je vous aider ?')).toBeInTheDocument()
  })
})

test('send button and textarea are present', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Bonjour Karim'))
  expect(screen.getByPlaceholderText(/Écrire un message/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument()
})

test('sending a message calls supabase insert', async () => {
  render(<Conversation />, { wrapper: Wrapper })
  await waitFor(() => screen.getByText('Bonjour Karim'))
  fireEvent.change(screen.getByPlaceholderText(/Écrire un message/i), {
    target: { value: 'Je reviens demain.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }))
  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Je reviens demain.', sender_id: 'u-1', conversation_id: 'conv-1' })
    )
  })
})
