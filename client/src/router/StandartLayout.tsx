import { Link, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/authContextCore'

export function StandardLayout() {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  const dashboardPath =
    auth.user?.userType === 'Adm_espaco' ? '/staff/dashboard' : '/organizer/dashboard'

  return (
    <div className="flex flex-col h-full">
      <header className="py-4 bg-primary text-primary-foreground shadow-md shrink-0 px-4 sm:px-0">
        <div className="container mx-auto flex justify-between items-center">
          <Link to={dashboardPath} className="text-xl font-bold hover:opacity-80">
            Check Fácil
          </Link>
          <nav>
            <ul className="flex items-center space-x-2 md:space-x-4">
              <li>
                <Button asChild variant="link" className="text-primary-foreground p-0 h-auto">
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
        </div>
      </header>

      <main className="flex-grow container mx-auto w-full px-4 sm:px-0">
        <Outlet />
      </main>

      <footer className="p-4 bg-muted text-muted-foreground text-center text-sm shrink-0">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} Check Fácil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
