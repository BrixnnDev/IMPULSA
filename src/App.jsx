import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import DashboardLayout from './components/DashboardLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import SelectProfile from './pages/SelectProfile'

import PosInicio from './pages/pos/PosInicio'
import PosInventario from './pages/pos/PosInventario'
import PosVentas from './pages/pos/PosVentas'

import DigitInicio from './pages/digitacion/DigitInicio'
import DigitProductos from './pages/digitacion/DigitProductos'
import DigitMovimientos from './pages/digitacion/DigitMovimientos'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/registro" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/olvide-contrasena" element={<ForgotPassword />} />

        <Route
          path="/seleccionar-perfil"
          element={<ProtectedRoute><SelectProfile /></ProtectedRoute>}
        />

        {/* Dashboard POS: inventario y ventas */}
        <Route element={<ProtectedRoute><DashboardLayout profile="pos" /></ProtectedRoute>}>
          <Route path="/pos" element={<PosInicio />} />
          <Route path="/pos/inventario" element={<PosInventario />} />
          <Route path="/pos/ventas" element={<PosVentas />} />
        </Route>

        {/* Dashboard Digitación */}
        <Route element={<ProtectedRoute><DashboardLayout profile="digitacion" /></ProtectedRoute>}>
          <Route path="/digitacion" element={<DigitInicio />} />
          <Route path="/digitacion/productos" element={<DigitProductos />} />
          <Route path="/digitacion/movimientos" element={<DigitMovimientos />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
