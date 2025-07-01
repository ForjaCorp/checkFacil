import { Routes, Route, Navigate } from 'react-router-dom'

import SplashScreen from '@/components/SplashScreen'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/authContextCore'
import DashboardPage from '@/pages/DashboardPage'
import CompleteEventDetailsPage from '@/pages/events/CompleteEventDetailsPage'
import CreateDraftEventPage from '@/pages/events/CreateDraftEventPage'
import GuestManagementPage from '@/pages/guests/GuestManagementPage'
import LoginPage from '@/pages/LoginPage'
import CheckinPage from '@/pages/operations/CheckinPage'
import ProfilePage from '@/pages/ProfilePage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'
import { AppLayout } from '@/router/AppLayout'
import { ProtectedRoute } from '@/router/ProtectedRoute'

/**
 * Main App component.
 *
 * When the auth context is still loading, shows a SplashScreen.
 * Otherwise, shows a Routes component with a ProtectedRoute as the main route.
 * The ProtectedRoute requires the user to be logged in as either an Adm_espaco or Adm_festa.
 * The route list includes the following routes:
 * - /login: login page
 * - /organizer/choosePassword/:token: set password page
 * - /: redirect to /staff/dashboard
 * - /staff/dashboard: dashboard page
 * - /staff/events/createEventDraft: create event draft page
 * - /staff/event/:eventId/checkin: checkin page
 * - /organizer/dashboard: dashboard page
 * - /organizer/event/:eventId/details: complete event details page
 * - /event/:eventId/guests: guest management page
 * - /profile: profile page
 *
 * Additionally, includes a Toaster component for displaying notifications.
 */
function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/organizer/choosePassword/:token" element={<SetPasswordPage />} />

        <Route
          element={
            <ProtectedRoute element={<AppLayout />} allowedRoles={['Adm_espaco', 'Adm_festa']} />
          }
        >
          <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="/staff/dashboard" element={<DashboardPage />} />
          <Route path="/staff/events/createEventDraft" element={<CreateDraftEventPage />} />
          <Route path="/staff/event/:eventId/details" element={<CompleteEventDetailsPage />} />
          <Route path="/staff/event/:eventId/checkin" element={<CheckinPage />} />
          <Route path="/organizer/dashboard" element={<DashboardPage />} />
          <Route path="/organizer/event/:eventId/details" element={<CompleteEventDetailsPage />} />
          <Route path="/event/:eventId/guests" element={<GuestManagementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
