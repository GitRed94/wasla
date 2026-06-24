import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Search from '../pages/Search'

vi.mock('../supabaseClient', () => {
  const data = [
    { id: 'abc-1', display_name: 'Karim Benali', badge: 'unverified', wilaya: 'Alger', categories: ['electricien'], avatar_url: null },
    { id: 'abc-2', display_name: 'Yacine Mammeri', badge: 'verified', wilaya: 'Alger', categories: ['plombier'], avatar_url: null },
  ]
  const mockOrder = vi.fn().mockResolvedValue({ data, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, contains: vi.fn().mockReturnValue({ eq: mockEq, order: mockOrder }), order: mockOrder })
  return {
    supabase: {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    },
  }
})

function Wrapper({ children, url = '/search' }) {
  return (
    <MemoryRouter initialEntries={[url]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/search" element={children} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => i18n.changeLanguage('fr'))

test('renders filter bar with category and wilaya selects', () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  expect(screen.getByDisplayValue(/toutes les catégories/i)).toBeInTheDocument()
  expect(screen.getByDisplayValue(/toutes les wilayas/i)).toBeInTheDocument()
})

test('renders prestataire cards after loading', async () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getByText('Yacine Mammeri')).toBeInTheDocument()
  })
})

test('shows no_results message when data is empty', async () => {
  const { supabase } = await import('../supabaseClient')
  supabase.from.mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText(/Aucun prestataire trouvé/i)).toBeInTheDocument()
  })
})

test('PrestaCard renders name, badge, wilaya', async () => {
  render(<Search />, { wrapper: (p) => <Wrapper {...p} /> })
  await waitFor(() => {
    expect(screen.getByText('Karim Benali')).toBeInTheDocument()
    expect(screen.getAllByText('Alger').length).toBeGreaterThan(0)
    expect(screen.getByText('Non vérifié')).toBeInTheDocument()
    expect(screen.getByText('Vérifié ✓')).toBeInTheDocument()
  })
})
