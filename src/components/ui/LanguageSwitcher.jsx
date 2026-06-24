import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', code)
  }

  return (
    <div className="flex gap-0.5 shrink-0">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`px-1.5 py-1 text-xs rounded font-medium transition-colors ${
            i18n.language === code
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
