import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import DashboardLayout from './components/DashboardLayout'

import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ForgotPassword from './pages/ForgotPassword'
import SelectProfile from './pages/SelectProfile'

import PosInicio from './pages/pos/PosInicio'
import PosInventario from './pages/pos/PosInventario'
import PosVentas from './pages/pos/PosVentas'

import DigitInicio from './pages/digitacion/DigitInicio'
import DigitProductos from './pages/digitacion/DigitProductos'
import DigitMovimientos from './pages/digitacion/DigitMovimientos'
import DigitHistorial from './pages/digitacion/DigitHistorial'
import DigitEscaneos from './pages/digitacion/DigitEscaneos'
import DigitDisenos from './pages/digitacion/DigitDisenos'
import DigitImagenes from './pages/digitacion/DigitImagenes'
import DigitDocumentos from './pages/digitacion/DigitDocumentos'
import DigitAjustes from './pages/digitacion/DigitAjustes'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<GuestRoute><AuthPage initialMode="login" /></GuestRoute>} />
        <Route path="/registro" element={<GuestRoute><AuthPage initialMode="register" /></GuestRoute>} />
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
          <Route path="/digitacion/historial" element={<DigitHistorial />} />
          <Route path="/digitacion/escaneos" element={<DigitEscaneos />} />
          <Route path="/digitacion/disenos" element={<DigitDisenos />} />
          <Route path="/digitacion/imagenes" element={<DigitImagenes />} />
          <Route path="/digitacion/documentos" element={<DigitDocumentos />} />
          <Route path="/digitacion/ajustes" element={<DigitAjustes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
