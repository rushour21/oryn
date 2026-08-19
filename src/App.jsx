import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/lib/theme'
import { queryClient } from '@/lib/query'
import { AuthBootstrap } from '@/components/auth/AuthBootstrap'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import OAuthCallback from '@/pages/auth/OAuthCallback'
import Embed from '@/pages/Embed'
import Watch from '@/pages/Watch'
import DashboardLayout from '@/layouts/DashboardLayout'
import DashboardHome from '@/pages/dashboard/Home'
import Videos from '@/pages/dashboard/Videos'
import VideoDetail from '@/pages/dashboard/VideoDetail'
import Upload from '@/pages/dashboard/Upload'
import Usage from '@/pages/dashboard/Usage'
import Settings from '@/pages/dashboard/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthBootstrap>
            <Routes>
              <Route path="/" element={<Landing />} />

              {/* Signed-in users get bounced away from these */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/*
                Public on purpose. The token in the URL is itself the credential,
                and these links are routinely opened in a different browser from
                the one that requested them.
              */}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Public embed player (PRD F8) — no login, gated by a viewer token. */}
              <Route path="/embed/:videoId" element={<Embed />} />
              {/* Public watch link (PRD F10) — no account, no embedding site. */}
              <Route path="/w/:code" element={<Watch />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="videos/:id" element={<VideoDetail />} />
                  <Route path="usage" element={<Usage />} />
                  <Route path="settings" element={<Settings />} />

                  {/* Uploading additionally needs a verified email (PRD F1) */}
                  <Route element={<ProtectedRoute requireVerified />}>
                    <Route path="upload" element={<Upload />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthBootstrap>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
