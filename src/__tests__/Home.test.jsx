import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import Home from '../pages/Home'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
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
  mockNavigate.mockClear()
})

test('renders hero title and subtitle', () => {
  render(<Home />, { wrapper: Wrapper })
  expect(screen.getByText(/Trouvez le bon prestataire/i)).toBeInTheDocument()
})

test('renders 7 category cards', () => {
  render(<Home />, { wrapper: Wrapper })
  expect(screen.getByText('🔧')).toBeInTheDocument()
  expect(screen.getByText('⚡')).toBeInTheDocument()
  expect(screen.getAllByTestId(/^category-card-/)).toHaveLength(7)
})

test('clicking a category card navigates to /search with category param', () => {
  render(<Home />, { wrapper: Wrapper })
  fireEvent.click(screen.getByTestId('category-card-plombier'))
  expect(mockNavigate).toHaveBeenCalledWith('/search?category=plombier')
})

test('submitting search form navigates to /search with params', () => {
  render(<Home />, { wrapper: Wrapper })
  fireEvent.submit(screen.getByRole('form'))
  expect(mockNavigate).toHaveBeenCalledWith('/search?')
})
