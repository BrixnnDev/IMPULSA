import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiSettings,
  FiBell,
  FiMail,
  FiPrinter,
  FiDollarSign,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { MdDocumentScanner } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'

const NAV = {
  pos: [
    {
      title: 'General',
      short: 'GEN',
      items: [
        { to: '/pos', label: 'Panel de ventas', icon: FiHome, end: true },
        { to: '/pos/inventario', label: 'Inventario', icon: FiPackage },
        { to: '/pos/ventas', label: 'Caja / Vender', icon: FiShoppingCart },
      ],
    },
  ],
  digitacion: [
    {
      title: 'Home',
      short: 'HOME',
      items: [{ to: '/digitacion', label: 'Panel de digitación', icon: FiHome, end: true }],
    },
    {
      title: 'Impresión y Scaner',
      short: 'IMP',
      items: [
        { to: '/digitacion/productos', label: 'Escanear / Digitalizar', icon: MdDocumentScanner },
        { to: '/digitacion/movimientos', label: 'Historial Impresora', icon: FiPrinter },
        { to: '/digitacion/historial', label: 'Historial de impresión', icon: FiDollarSign },
      ],
    },
  ],
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function Clock() {
  const now = useClock()
  const fecha = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const hora = now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return (
    <div className="ml-auto hidden flex-col items-end leading-tight md:flex">
      <span className="text-sm font-bold tabular-nums text-white">{hora}</span>
      <span className="text-[11px] capitalize text-slate-400">{fecha}</span>
    </div>
  )
}

export default function DashboardLayout({ profile }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = NAV[profile]
  const flatLinks = links.flatMap((g) => g.items)
  const iconOnly = profile === 'digitacion'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-night-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-night-900 transition-all duration-300 lg:translate-x-0 ${
          iconOnly ? 'w-20' : 'w-72'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-16 items-center justify-end px-3 lg:hidden ${iconOnly ? '' : 'px-6'}`}>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <FiX size={22} />
          </button>
        </div>

        {iconOnly ? (
          <div className="group relative flex justify-center py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/40">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
              {user?.name || 'Usuario'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 pb-3 pt-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/40">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Usuario'}</p>
              <p className="truncate text-[11px] text-slate-400">
                Perfil: {profile === 'pos' ? 'POS · Vendedor' : 'Digitación'}
              </p>
            </div>
          </div>
        )}

        <nav className={`flex-1 space-y-1 p-3 ${iconOnly ? 'overflow-visible' : 'overflow-y-auto p-4'}`}>
          {links.map((group) => (
            <div key={group.title} className={iconOnly ? 'pb-3' : 'pb-2'}>
              <p
                className={`pb-1 font-semibold uppercase tracking-widest text-slate-500 ${
                  iconOnly ? 'text-center text-[9px]' : 'px-2 text-[11px]'
                }`}
              >
                {iconOnly ? group.short : group.title}
              </p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    title={iconOnly ? label : undefined}
                    className={({ isActive }) =>
                      iconOnly
                        ? `group relative flex items-center justify-center rounded-xl px-3 py-3 transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`
                        : `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {iconOnly ? (
                      <>
                        <span className="sr-only">{label}</span>
                        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                          {label}
                        </span>
                      </>
                    ) : (
                      label
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t border-white/5 ${iconOnly ? 'p-3' : 'p-4'}`}>
          <button
            title={iconOnly ? 'Configuración' : undefined}
            className={
              iconOnly
                ? 'group relative mb-1 flex w-full items-center justify-center rounded-xl px-3 py-3 text-slate-400 transition hover:bg-white/5 hover:text-white'
                : 'mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white'
            }
          >
            <FiSettings size={18} className="shrink-0" />
            {iconOnly ? (
              <>
                <span className="sr-only">Configuración</span>
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                  Configuración
                </span>
              </>
            ) : (
              'Configuración'
            )}
          </button>
          <button
            onClick={handleLogout}
            title={iconOnly ? 'Cerrar sesión' : undefined}
            className={
              iconOnly
                ? 'group relative flex w-full items-center justify-center rounded-xl px-3 py-3 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400'
                : 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400'
            }
          >
            <FiLogOut size={18} className="shrink-0" />
            {iconOnly ? (
              <>
                <span className="sr-only">Cerrar sesión</span>
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
                  Cerrar sesión
                </span>
              </>
            ) : (
              'Cerrar sesión'
            )}
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
      <div className={`flex min-h-screen flex-1 flex-col ${iconOnly ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/5 bg-night-900/80 px-6 backdrop-blur">
          <button
            onClick={() => setOpen(true)}
            className="text-slate-300 hover:text-white lg:hidden"
            aria-label="Abrir menú"
          >
            <FiMenu size={22} />
          </button>
          <Link to={flatLinks[0].to} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
              S
            </span>
            <span className="text-sm font-bold tracking-tight text-white">StockFlow</span>
          </Link>

          {/* Fecha y hora */}
          <Clock />

          {/* Notificaciones, correo y WhatsApp */}
          <div className="flex items-center gap-1.5">
            <button
              title="Notificaciones"
              aria-label="Notificaciones"
              className="relative rounded-xl p-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <FiBell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-night-900" />
            </button>
            <button
              title="Correo"
              aria-label="Correo"
              className="rounded-xl p-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <FiMail size={18} />
            </button>
            <button
              title="WhatsApp"
              aria-label="WhatsApp"
              className="rounded-xl p-2.5 text-slate-300 transition hover:bg-green-500/10 hover:text-green-400"
            >
              <FaWhatsapp size={19} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  )
}
