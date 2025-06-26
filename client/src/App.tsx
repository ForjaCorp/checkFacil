import { Routes, Route, Navigate } from 'react-router-dom'

import SplashScreen from '@/components/SplashScreen'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/authContextCore'
import CompleteEventDetailsPage from '@/pages/events/CompleteEventDetailsPage'
import CreateDraftEventPage from '@/pages/events/CreateDraftEventPage'
import GuestManagementPage from '@/pages/guests/GuestManagementPage'
import LoginPage from '@/pages/LoginPage'
import CheckinPage from '@/pages/operations/CheckinPage'
import OrganizerDashboardPage from '@/pages/OrganizerDashboardPage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'
import StaffDashboardPage from '@/pages/StaffDashboardPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { StandardLayout } from '@/router/StandartLayout'

function App() {
  const auth = useAuth()

  if (auth.initialLoading) {
    return <SplashScreen />
  }

  return (
    <>
      <Routes>
        {/* Rotas Imersivas (sem layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/organizer/choosePassword/:token" element={<SetPasswordPage />} />

        {/* Rotas Padrão (com layout) */}
        <Route
          element={
            <ProtectedRoute
              element={<StandardLayout />}
              allowedRoles={['Adm_espaco', 'Adm_festa']}
            />
          }
        >
          <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/events/createEventDraft" element={<CreateDraftEventPage />} />
          <Route path="/staff/event/:eventId/checkin" element={<CheckinPage />} />
          <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
          <Route path="/organizer/event/:eventId/details" element={<CompleteEventDetailsPage />} />
          <Route path="/event/:eventId/guests" element={<GuestManagementPage />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
