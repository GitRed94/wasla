import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'ar', 'en'],
    detection: {
      order: ['navigator'],
      caches: [],
    },
    interpolation: { escapeValue: false },
  })

i18n.on('initialized', () => {
  const lang = i18n.language?.split('-')[0]
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lang || 'fr')
})

export default i18n
