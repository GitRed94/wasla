import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'

export default function SignOutButton() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) setSigningOut(false)
  }, [user])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

  return (
    <Button variant="secondary" onClick={handleSignOut} disabled={signingOut} loading={signingOut}>
      {t('nav.logout')}
    </Button>
  )
}
