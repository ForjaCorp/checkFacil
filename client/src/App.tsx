import { Routes, Route, Link, useNavigate } from 'react-router-dom'

import SplashScreen from '@/components/SplashScreen'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/authContextCore'
import CreateDraftEventPage from '@/pages/events/CreateDraftEventPage'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import OrganizerDashboardPage from '@/pages/OrganizerDashboardPage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'
import StaffDashboardPage from '@/pages/StaffDashboardPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'

import CompleteEventDetailsPage from './pages/events/CompleteEventDetailsPage'
import GuestManagementPage from './pages/guests/GuestManagementPage'

function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-bold text-destructive">Acesso Não Autorizado</h1>
      <p className="mt-4 text-muted-foreground">
        Você não tem permissão para acessar a página solicitada.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Voltar para a Página Inicial</Link>
      </Button>
    </div>
  )
}

function App() {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  if (auth.initialLoading) {
    return <SplashScreen />
  }

  const dashboardPath =
    auth.user?.userType === 'Adm_espaco'
      ? '/staff/dashboard'
      : auth.user?.userType === 'Adm_festa'
        ? '/organizer/dashboard'
        : '/'

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to={auth.isAuthenticated ? dashboardPath : '/'}
            className="text-xl font-bold hover:opacity-80"
          >
            Check Fácil
          </Link>
          {auth.isAuthenticated ? (
            <nav>
              <ul className="flex items-center space-x-2 md:space-x-4">
                <li>
                  <Button
                    asChild
                    variant="link"
                    className="text-primary-foreground p-0 h-auto text-sm md:text-base"
                  >
                    <Link to={dashboardPath}>Painel</Link>
                  </Button>
                </li>
                <li>
                  <Button onClick={handleLogout} variant="secondary" size="sm">
                    Sair
                  </Button>
                </li>
              </ul>
            </nav>
          ) : (
            // NAV PARA USUÁRIOS DESLOGADOS (NÃO MUDA)
            <nav>
              <ul className="flex items-center space-x-2 md:space-x-4">
                <li>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto w-full flex flex-col flex-grow">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/organizer/choosePassword/:token" element={<SetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Rotas Protegidas do Staff */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute element={<StaffDashboardPage />} allowedRoles={['Adm_espaco']} />
            }
          />
          <Route
            path="/staff/events/createEventDraft"
            element={
              <ProtectedRoute element={<CreateDraftEventPage />} allowedRoles={['Adm_espaco']} />
            }
          />
          {/* 2. ADICIONE A ROTA DE DETALHES PARA O STAFF */}
          <Route
            path="/staff/event/:eventId/details"
            element={
              <ProtectedRoute
                element={<CompleteEventDetailsPage />}
                allowedRoles={['Adm_espaco']}
              />
            }
          />

          {/* Rotas Protegidas do Contratante */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute element={<OrganizerDashboardPage />} allowedRoles={['Adm_festa']} />
            }
          />
          {/* 3. ADICIONE A ROTA DE DETALHES PARA O CONTRATANTE */}
          <Route
            path="/organizer/event/:eventId/details"
            element={
              <ProtectedRoute
                element={<CompleteEventDetailsPage />}
                allowedRoles={['Adm_festa', 'Adm_espaco']}
              />
            }
          />
          <Route
            path="/event/:eventId/guests"
            element={
              <ProtectedRoute
                element={<GuestManagementPage />}
                allowedRoles={['Adm_festa', 'Adm_espaco']}
              />
            }
          />
        </Routes>
      </main>
      <footer className="p-4 bg-muted text-muted-foreground text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Check Fácil. Todos os direitos reservados.</p>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  )
}
export default App
