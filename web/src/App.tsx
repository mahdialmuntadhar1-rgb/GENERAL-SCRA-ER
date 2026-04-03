import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Scraper } from './pages/Scraper'
import { Review } from './pages/Review'
import { Staging } from './pages/Staging'
import { ImportExport } from './pages/ImportExport'
import { SystemLogs } from './pages/SystemLogs'
import { Settings } from './pages/Settings'

// 404 Not Found Page
function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="inline-block px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
          ← Back to Home
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/review" element={<Review />} />
        <Route path="/staging" element={<Staging />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/settings" element={<Settings />} />
        {/* 404 fallback - MUST be last */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
