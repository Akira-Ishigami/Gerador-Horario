import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { DataProvider } from "@/context/DataContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          {/* overflow-x-clip contém qualquer elemento decorativo que escape da
              viewport (círculos orbitando, grids de fundo) sem quebrar
              position: sticky como overflow no html/body fazia. */}
          <div className="overflow-x-clip">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
