import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import SplashScreen from '@/components/SplashScreen'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/authContextCore'
import { AppLayout } from '@/router/AppLayout'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { PublicLayout } from '@/router/PublicLayout'

// Suas páginas
const FlowSelectionPage = lazy(() => import('@/pages/guest/FlowSelectionPage'))
const ConfirmAdultPage = lazy(() => import('@/pages/guest/ConfirmAdultPage'))
const ConfirmChildrenFlowPage = lazy(() => import('@/pages/guest/ConfirmChildrenFlowPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SetPasswordPage = lazy(() => import('@/pages/SetPasswordPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage')) // ✅ NOVO
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CreateDraftEventPage = lazy(() => import('@/pages/events/CreateDraftEventPage'))
const CompleteEventDetailsPage = lazy(() => import('@/pages/events/CompleteEventDetailsPage'))
const GuestManagementPage = lazy(() => import('@/pages/guests/GuestManagementPage'))
const CheckinPage = lazy(() => import('@/pages/operations/CheckinPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const PlaylistManagementPage = lazy(() => import('@/pages/staff/PlaylistManagementPage'))

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <>
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* ✅ NOVO */}
          <Route path="/organizer/choosePassword/:token" element={<SetPasswordPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/guest/:eventId/flow-selection" element={<FlowSelectionPage />} />
            <Route path="/guest/:eventId/confirm-adult" element={<ConfirmAdultPage />} />
            <Route
              path="/guest/:eventId/confirm-responsible"
              element={<ConfirmChildrenFlowPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                element={<AppLayout />}
                allowedRoles={['Adm_espaco', 'Adm_festa']}
              />
            }
          >
            <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/staff/dashboard" element={<DashboardPage />} />
            <Route path="/staff/events/createEventDraft" element={<CreateDraftEventPage />} />
            <Route path="/staff/event/:eventId/details" element={<CompleteEventDetailsPage />} />
            <Route path="/staff/event/:eventId/checkin" element={<CheckinPage />} />
            <Route path="/staff/playlists" element={<PlaylistManagementPage />} />
            <Route path="/organizer/dashboard" element={<DashboardPage />} />
            <Route
              path="/organizer/event/:eventId/details"
              element={<CompleteEventDetailsPage />}
            />
            <Route path="/event/:eventId/guests" element={<GuestManagementPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
