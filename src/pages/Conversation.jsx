import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Conversation() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [{ data: convData }, { data: msgs }] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, client_id, prestataire_id, prestataire_profiles!prestataire_id(display_name)')
          .eq('id', id)
          .single(),
        supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true }),
      ])
      if (!convData) { navigate('/messages'); return }
      setConv(convData)
      setMessages(msgs ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id, navigate])

  useEffect(() => {
    const channel = supabase
      .channel(`conv:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, content })
    setSending(false)
  }

  function otherPartyName() {
    if (!conv) return ''
    if (user.id === conv.client_id) return conv.prestataire_profiles?.display_name ?? '—'
    return t('dashboard.client_label')
  }

  if (loading) return <div className="p-8 text-center text-gray-400">{t('messages.loading')}</div>

  return (
    <main className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-surface shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-sm shrink-0">👤</div>
        <span className="font-medium text-text truncate">{otherPartyName()}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-gray-200 text-text rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-surface shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('messages.type_message')}
          className="flex-1 min-w-0 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dark disabled:opacity-50 shrink-0"
        >
          {t('messages.send')}
        </button>
      </form>
    </main>
  )
}
