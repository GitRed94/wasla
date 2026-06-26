import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ContactSheet({ open, onClose, prestaireId, prestaireName }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setMessage('')
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSend(e) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .upsert(
        { client_id: user.id, prestataire_id: prestaireId },
        { onConflict: 'client_id,prestataire_id' }
      )
      .select('id')
      .single()

    if (convErr) { setError(t('errors.generic')); setLoading(false); return }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.id, sender_id: user.id, content: message.trim() })

    if (msgErr) { setError(t('errors.generic')); setLoading(false); return }

    setLoading(false)
    onClose()
    navigate(`/messages/${conv.id}`)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 flex flex-col"
        style={{ height: '60vh' }}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <p className="font-semibold text-gray-800">{prestaireName}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1 gap-4 min-h-0">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('contact.placeholder')}
            className="flex-1 min-h-0 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-600 text-sm shrink-0">{error}</p>}
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0"
          >
            {t('contact.send')}
          </button>
        </form>
      </div>
    </div>
  )
}
