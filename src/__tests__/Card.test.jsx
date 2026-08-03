import { render, screen } from '@testing-library/react'
import Card from '../components/ui/Card'

test('renders children inside a rounded card', () => {
  render(<Card>Contenu</Card>)
  const el = screen.getByText('Contenu')
  expect(el.className).toMatch(/rounded-card/)
})

test('merges extra className', () => {
  render(<Card className="mb-4">X</Card>)
  expect(screen.getByText('X').className).toMatch(/mb-4/)
})
