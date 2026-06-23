import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/auth/ProtectedRoute'

test('renders children when authenticated', () => {
  useAuth.mockReturnValue({ user: { id: 'abc' }, loading: false })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('redirects to /login when not authenticated', () => {
  useAuth.mockReturnValue({ user: null, loading: false })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Login Page')).toBeInTheDocument()
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
})

test('renders nothing while auth is loading', () => {
  useAuth.mockReturnValue({ user: null, loading: true })
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
})
