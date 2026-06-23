import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

function Wrapper({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

test('renders FR, AR, EN buttons', () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  expect(screen.getByText('FR')).toBeInTheDocument()
  expect(screen.getByText('AR')).toBeInTheDocument()
  expect(screen.getByText('EN')).toBeInTheDocument()
})

test('changes language to Arabic and sets dir=rtl', async () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText('AR'))
  expect(i18n.language).toBe('ar')
  expect(document.documentElement.getAttribute('dir')).toBe('rtl')
})

test('changes language to French and removes rtl', async () => {
  render(<LanguageSwitcher />, { wrapper: Wrapper })
  fireEvent.click(screen.getByText('FR'))
  expect(i18n.language).toBe('fr')
  expect(document.documentElement.getAttribute('dir')).toBe('ltr')
})
