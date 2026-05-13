import { useAuth, AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import GamePage from './pages/GamePage'

function AppContent() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Cargando...</div>
  return user ? <GamePage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}