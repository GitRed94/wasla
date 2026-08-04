import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ScrollToTop from './components/ui/ScrollToTop'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import MonProfilClient from './pages/MonProfilClient'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Search from './pages/Search'
import PrestaireProfile from './pages/PrestaireProfile'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function PrestaRedirect({ children }) {
  const { user, profile, prestaProfileComplete } = useAuth()
  if (user && profile?.role === 'prestataire' && prestaProfileComplete === false) {
    return <Navigate to="/mon-profil-presta" replace />
  }
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-16 sm:pb-0">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<PrestaRedirect><Home /></PrestaRedirect>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/prestataire/:id" element={<PrestaireProfile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mon-profil" element={<Navigate to="/mon-profil-presta" replace />} />
          <Route path="/mon-profil-presta" element={<MonProfil />} />
          <Route path="/mon-profil-client" element={<MonProfilClient />} />
          <Route path="/dashboard" element={<PrestaRedirect><Dashboard /></PrestaRedirect>} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
        </Route>
      </Routes>
    </div>
  )
}
