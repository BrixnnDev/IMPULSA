import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiClipboard,
  FiRepeat,
} from 'react-icons/fi'
import { MdOutlineInventory2 } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'

const NAV = {
  pos: [
    { to: '/pos', label: 'Panel de ventas', icon: FiHome, end: true },
    { to: '/pos/inventario', label: 'Inventario', icon: FiPackage },
    { to: '/pos/ventas', label: 'Caja / Vender', icon: FiShoppingCart },
  ],
  digitacion: [
    { to: '/digitacion', label: 'Panel de digitación', icon: FiHome, end: true },
    { to: '/digitacion/productos', label: 'Registrar productos', icon: MdOutlineInventory2 },
    { to: '/digitacion/movimientos', label: 'Movimientos', icon: FiRepeat },
  ],
}

const TITLES = {
  pos: 'Punto de Venta',
  digitacion: 'Centro de Digitación',
}

export default function DashboardLayout({ profile }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV[profile]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-night-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-night-900 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
            S
          </span>
          <div>
            <p className="text-sm font-bold text-white">StockFlow</p>
            <p className="text-[11px] text-slate-400">{TITLES[profile]}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <FiX size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <FiLogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Contenido */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-night-900/80 px-6 backdrop-blur">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-300 hover:text-white lg:hidden"
            aria-label="Abrir menú"
          >
            <FiMenu size={22} />
          </button>
          <h1 className="text-sm font-semibold text-slate-200">{TITLES[profile]}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:flex">
              <FiClipboard size={14} className="text-blue-400" />
              Perfil: {profile === 'pos' ? 'POS · Vendedor' : 'Digitación'}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/40">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  )
}
