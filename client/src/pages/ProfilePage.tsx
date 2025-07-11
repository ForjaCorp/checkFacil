import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/authContextCore'
import { usePageHeader } from '@/hooks/usePageHeader'

/**
 * Profile page component.
 *
 * This component is used to render the user's profile page.
 * It shows the user's avatar, name, and email.
 * It also provides a button to log out the user.
 *
 * @returns The profile page component.
 */
export default function ProfilePage() {
  const { setTitle } = usePageHeader()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setTitle('Meu Perfil')
    return () => setTitle(null)
  }, [setTitle])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return null
  }

  const userInitials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)

  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Meu Perfil" description="Suas informações de conta." />

      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src="/placeholder-for-user-avatar.jpg" />
            <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>

        <CardContent className="mt-4">
          <Separator />
          <div className="pt-6">
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
