import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id,
          client_id,
          created_at,
          messages ( id, content, created_at, sender_id )
        `)
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false })
      setConversations(data ?? [])
      setLoading(false)
    }
    fetchConversations()
  }, [user.id])

  function getLastMsg(msgs) {
    if (!msgs?.length) return null
    return [...msgs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  }

  if (loading) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.title')}</h1>
      <p className="text-sm text-gray-500 mb-5">{t('dashboard.requests')}</p>

      {conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-16">{t('dashboard.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map(conv => {
            const lastMsg = getLastMsg(conv.messages)
            return (
              <li key={conv.id}>
                <button
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-lg">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{t('dashboard.client_label')}</p>
                    {lastMsg && (
                      <p className="text-sm text-gray-500 truncate">{lastMsg.content}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(lastMsg.created_at)}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
