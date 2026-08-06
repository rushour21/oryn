import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ThemeProvider } from '@/lib/theme'
import Landing from '@/pages/Landing'
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="videos" element={<Videos />} />
            <Route path="videos/:id" element={<VideoDetail />} />
            <Route path="upload" element={<Upload />} />
            <Route path="usage" element={<Usage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
