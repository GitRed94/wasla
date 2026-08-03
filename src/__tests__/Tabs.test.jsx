import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Tabs from '../components/ui/Tabs'

const items = [
  { key: 'profile', label: 'Configurer mon profil' },
  { key: 'account', label: 'Mon Compte' },
  { key: 'portfolio', label: 'Photos de réalisations' },
]

test('renders all tab labels', () => {
  render(<Tabs items={items} active="profile" onChange={vi.fn()} />)
  expect(screen.getByRole('tab', { name: 'Configurer mon profil' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Mon Compte' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Photos de réalisations' })).toBeInTheDocument()
})

test('marks the active tab and calls onChange on click', () => {
  const onChange = vi.fn()
  render(<Tabs items={items} active="profile" onChange={onChange} />)
  expect(screen.getByRole('tab', { name: 'Configurer mon profil' })).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(screen.getByRole('tab', { name: 'Mon Compte' }))
  expect(onChange).toHaveBeenCalledWith('account')
})
