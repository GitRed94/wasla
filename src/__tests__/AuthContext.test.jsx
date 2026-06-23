import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { vi } from 'vitest'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

function TestConsumer() {
  const { user, loading } = useAuth()
  if (loading) return <div>loading</div>
  return <div>{user ? user.id : 'no-user'}</div>
}

test('provides null user when not authenticated', async () => {
  render(<AuthProvider><TestConsumer /></AuthProvider>)
  await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument())
})
