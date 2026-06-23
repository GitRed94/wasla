import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MonProfil from './pages/MonProfil'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import PrestaireProfile from './pages/PrestaireProfile'
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/prestataire/:id" element={<PrestaireProfile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mon-profil" element={<MonProfil />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </div>
  )
}
