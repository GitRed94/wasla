import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ContactSheet({ open, onClose, prestaireId, prestaireName }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(onClose, 1500)
    return () => clearTimeout(timer)
  }, [success, onClose])

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

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6"
        style={{ height: '60vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">{prestaireName}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center h-40 text-green-600">
            <span className="text-4xl mb-2">✓</span>
            <p className="font-medium">{t('contact.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col h-full gap-4">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('contact.placeholder')}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
