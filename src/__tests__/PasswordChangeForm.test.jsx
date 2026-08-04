import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import i18n from '../i18n'
import PasswordChangeForm from '../components/ui/PasswordChangeForm'

const mockSignIn = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignIn(...args),
      updateUser: (...args) => mockUpdateUser(...args),
    },
  },
}))

function Wrapper({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

beforeEach(() => {
  i18n.changeLanguage('fr')
  mockSignIn.mockReset()
  mockUpdateUser.mockReset()
})

function fillAndSubmit({ current = 'OldPass1!', next = 'NewPass1!', confirm = 'NewPass1!' } = {}) {
  fireEvent.change(screen.getByLabelText(/mot de passe actuel/i), { target: { value: current } })
  fireEvent.change(screen.getByLabelText(/^nouveau mot de passe$/i), { target: { value: next } })
  fireEvent.change(screen.getByLabelText(/confirmer le nouveau mot de passe/i), { target: { value: confirm } })
  fireEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }))
}

test('rejects mismatched confirm password without calling supabase', async () => {
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit({ confirm: 'Different1!' })
  await waitFor(() => {
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument()
  })
  expect(mockSignIn).not.toHaveBeenCalled()
})

test('rejects wrong current password and never calls updateUser', async () => {
  mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit()
  await waitFor(() => {
    expect(screen.getByText(/mot de passe actuel incorrect/i)).toBeInTheDocument()
  })
  expect(mockUpdateUser).not.toHaveBeenCalled()
})

test('re-authenticates then updates password on success', async () => {
  mockSignIn.mockResolvedValue({ error: null })
  mockUpdateUser.mockResolvedValue({ error: null })
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit()
  await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'OldPass1!' })
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass1!' })
    expect(screen.getByText(/mis à jour/i)).toBeInTheDocument()
  })
})

test('shows a generic error and stops loading when signInWithPassword rejects', async () => {
  mockSignIn.mockRejectedValue(new Error('network down'))
  render(<PasswordChangeForm userEmail="a@b.com" />, { wrapper: Wrapper })
  fillAndSubmit()
  await waitFor(() => {
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument()
  })
  expect(mockUpdateUser).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /changer le mot de passe/i })).not.toBeDisabled()
})
