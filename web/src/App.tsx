import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Scraper } from './pages/Scraper'
import { Review } from './pages/Review'
import { AIClean } from './pages/AIClean'
import { ImportExport } from './pages/ImportExport'
import { SystemLogs } from './pages/SystemLogs'
import { Settings } from './pages/Settings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/review" element={<Review />} />
        <Route path="/ai-clean" element={<AIClean />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
