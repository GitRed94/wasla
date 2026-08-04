import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from './Card'
import Badge from './Badge'

const BADGE_TONES = {
  unverified: 'gray',
  verified: 'blue',
  trusted: 'amber',
}

export { BADGE_TONES }

export default function PrestaCard({ id, display_name, badge, wilaya, categories, avatar_url }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(`/prestataire/${id}`)} className="w-full text-left active:scale-95 transition-transform">
      <Card className="p-4 border border-gray-200 hover:border-primary hover:shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-gray-400 text-xl overflow-hidden shrink-0">
            {avatar_url
              ? <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
              : '👤'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{display_name}</p>
            <p className="text-sm text-gray-500">{wilaya}</p>
          </div>
        </div>

        <Badge tone={BADGE_TONES[badge] ?? 'gray'} className="mb-2">
          {t(`profile.badge_${badge}`)}
        </Badge>

        <div className="flex flex-wrap gap-1 mt-1">
          {(categories ?? []).slice(0, 3).map(cat => (
            <span key={cat} className="text-xs bg-blue-50 text-primary px-2 py-0.5 rounded-full">
              {t(`categories.${cat}`)}
            </span>
          ))}
        </div>
      </Card>
    </button>
  )
}
