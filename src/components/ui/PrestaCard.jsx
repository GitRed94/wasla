import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const BADGE_STYLES = {
  unverified: 'bg-gray-100 text-gray-600',
  verified:   'bg-blue-100 text-blue-700',
  trusted:    'bg-amber-100 text-amber-700',
}

export { BADGE_STYLES }

export default function PrestaCard({ id, display_name, badge, wilaya, categories, avatar_url }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/prestataire/${id}`)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl overflow-hidden shrink-0">
          {avatar_url
            ? <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
            : '👤'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{display_name}</p>
          <p className="text-sm text-gray-500">{wilaya}</p>
        </div>
      </div>

      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${BADGE_STYLES[badge] ?? BADGE_STYLES.unverified}`}>
        {t(`profile.badge_${badge}`)}
      </span>

      <div className="flex flex-wrap gap-1 mt-1">
        {(categories ?? []).slice(0, 3).map(cat => (
          <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {t(`categories.${cat}`)}
          </span>
        ))}
      </div>
    </button>
  )
}
