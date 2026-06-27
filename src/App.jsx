import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
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

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/prestataire/:id" element={<PrestaireProfile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mon-profil" element={<Navigate to="/mon-profil-presta" replace />} />
          <Route path="/mon-profil-presta" element={<MonProfil />} />
          <Route path="/mon-profil-client" element={<MonProfilClient />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
        </Route>
      </Routes>
    </div>
  )
}
