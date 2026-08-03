import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Button from '../components/ui/Button'

test('renders children and handles click', () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Envoyer</Button>)
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('secondary variant applies outline styling', () => {
  render(<Button variant="secondary">Annuler</Button>)
  expect(screen.getByRole('button', { name: 'Annuler' }).className).toMatch(/border-primary/)
})

test('loading disables the button and shows a spinner', () => {
  render(<Button loading>Enregistrer</Button>)
  const btn = screen.getByRole('button')
  expect(btn).toBeDisabled()
  expect(btn.querySelector('svg')).toBeInTheDocument()
})

test('forwards extra props like data-testid to the underlying button', () => {
  render(<Button data-testid="contact-btn">Contacter</Button>)
  expect(screen.getByTestId('contact-btn')).toBeInTheDocument()
})
