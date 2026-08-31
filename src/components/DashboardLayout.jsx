import { useEffect, useRef, useState } from 'react'
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
  FiFileText,
  FiFolder,
  FiMonitor,
  FiUsers,
  FiGlobe,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { MdConfirmationNumber } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import useAvatar from '../hooks/useAvatar'
import RocketLogo from './RocketLogo'
import { FiDollarSign, FiPhone, FiSend, FiArrowLeft } from 'react-icons/fi'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const EMAIL_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']

const SEED_NOTIFS = [
  { id: 1, titulo: 'Impresión completada', desc: 'HV-1023 · Carlos Andrés Peña', hora: 'Hace 5 min', unread: true, color: 'bg-blue-600/15 text-blue-400', icon: null },
  { id: 2, titulo: 'Nuevo documento firmado', desc: 'Contrato alquiler local · DOC-0521', hora: 'Hace 20 min', unread: true, color: 'bg-emerald-500/15 text-emerald-400', icon: null },
  { id: 3, titulo: 'Pago recibido', desc: 'Valecito IMP-2041 · Turno 1', hora: 'Hace 1 h', unread: true, color: 'bg-amber-500/15 text-amber-400', icon: null },
  { id: 4, titulo: 'Recordatorio', desc: 'Imprimir HV de Camila Torres — 3 copias', hora: '8:00 a. m.', unread: false, color: 'bg-violet-500/15 text-violet-400', icon: null },
]

const SEED_EMAILS = [
  {
    id: 1,
    de: 'Papelería El Trigal',
    correo: 'admin@papeleriaeltrigal.co',
    asunto: 'Confirmación de pago semanal',
    texto:
      'Hola, te confirmamos que el pago de la semana quedó aplicado. Recuerda que la comisión se divide 50% papelería y 50% digitador, como acordamos. Cualquier novedad nos avisas por WhatsApp.',
    hora: '09:42',
    dia: 'Hoy',
    unread: true,
    color: 'bg-emerald-500',
  },
  {
    id: 2,
    de: 'María Fernanda Rojas',
    correo: 'mafe.rojas@gmail.com',
    asunto: 'Corrección de datos en mi hoja de vida',
    texto:
      'Buenas tardes, necesito actualizar el número de celular y la dirección de mi hoja de vida. ¿Es posible pasarla hoy en la tarde? Quedo pendiente, gracias.',
    hora: '08:15',
    dia: 'Hoy',
    unread: true,
    color: 'bg-blue-500',
  },
  {
    id: 3,
    de: 'IMPULSA',
    correo: 'no-reply@impulsa.app',
    asunto: 'Tu resumen semanal de trabajos',
    texto:
      'Esta semana digitalizaste 14 hojas de vida e imprimiste 9 documentos. ¡Sigue así!',
    hora: 'Ayer',
    dia: '',
    unread: false,
    color: 'bg-violet-500',
  },
  {
    id: 4,
    de: 'Soporte IMPULSA',
    correo: 'soporte@impulsa.app',
    asunto: 'Nueva versión disponible v1.0.1',
    texto: 'Mejoramos la conexión con impresoras y corregimos errores menores en el historial de escáner.',
    hora: 'Lun',
    dia: '',
    unread: false,
    color: 'bg-slate-500',
  },
]

const SEED_CHATS = [
  {
    id: 1,
    nombre: 'Jefe — Papelería El Trigal',
    hora: '09:15',
    mensajes: [
      { de: 'ellos', t: 'Buenos días, ¿ya está lista la impresión del contrato?' },
      { de: 'yo', t: 'Buenos días, sí, sale en 10 minutos.' },
      { de: 'ellos', t: 'Perfecto, gracias. La comisión ya quedó registrada.' },
    ],
  },
  {
    id: 2,
    nombre: 'María Fernanda Rojas',
    hora: '08:40',
    mensajes: [
      { de: 'ellos', t: 'Hola, ¿a qué horas puedo pasar por mi hoja de vida impresa?' },
      { de: 'yo', t: 'Después de las 2 p. m., ya está lista.' },
    ],
  },
  {
    id: 3,
    nombre: 'Grupo Digitación 📄',
    hora: 'Ayer',
    mensajes: [
      { de: 'ellos', t: 'Recuerden respaldar los documentos del día antes de cerrar.' },
      { de: 'yo', t: 'Listo, yo ya respaldé los míos.' },
    ],
  },
]


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
      items: [
        { to: '/digitacion', label: 'Inicio', icon: FiHome, end: true },
        { to: '/digitacion/historial', label: 'Ticket', icon: MdConfirmationNumber },
      ],
    },
    {
      title: 'Documentos',
      items: [{ to: '/digitacion/documentos', label: 'Documentos', icon: FiFolder }],
    },
    {
      title: 'Impresión',
      items: [
        { to: '/digitacion/escaneos', label: 'Historial de escáner', icon: FiFileText },
        { to: '/digitacion/movimientos', label: 'Historial de impresión', icon: FiPrinter },
      ],
    },
    {
      title: 'Web',
      items: [{ to: '/digitacion/accesos-web', label: 'Accesos Web', icon: FiGlobe }],
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
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [avatar] = useAvatar()
  const { user, logout, isAdmin } = useAuth()

  const [notifs, setNotifs] = useState(SEED_NOTIFS)
  const [notifOpen, setNotifOpen] = useState(false)
  const [emails, setEmails] = useState(SEED_EMAILS)
  const [correoOpen, setCorreoOpen] = useState(false)
  const [emailAbierto, setEmailAbierto] = useState(null)
  const [chats, setChats] = useState(SEED_CHATS)
  const [whatsOpen, setWhatsOpen] = useState(false)
  const [chatActivo, setChatActivo] = useState(null)
  const [nuevoMsg, setNuevoMsg] = useState('')
  const [live, setLive] = useState(false)
  const [correoQ, setCorreoQ] = useState('')
  const [compOpen, setCompOpen] = useState(false)
  const [comp, setComp] = useState({ to: '', asunto: '', texto: '' })
  const [enviadoOk, setEnviadoOk] = useState('')
  const socketRef = useRef(null)

  // Conexion en tiempo real con el servidor local (WhatsApp Cloud API + Gmail)
  useEffect(() => {
    const s = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 })
    socketRef.current = s
    s.on('connect', () => setLive(true))
    s.on('disconnect', () => setLive(false))
    s.on('whatsapp:message', (m) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.wa_id === m.wa_id || c.nombre === m.name)
        if (idx === -1) {
          return [
            { id: `wa-${m.wa_id}`, wa_id: m.wa_id, nombre: m.name || m.wa_id, hora: 'Ahora', mensajes: [{ de: 'ellos', t: m.text }] },
            ...prev,
          ]
        }
        const copy = [...prev]
        copy[idx] = { ...copy[idx], hora: 'Ahora', mensajes: [...copy[idx].mensajes, { de: 'ellos', t: m.text }] }
        return copy
      })
    })
    s.on('gmail:list', (list) => {
      if (!Array.isArray(list)) return
      setEmails(
        list.map((g, i) => ({
          id: g.id,
          de: g.fromName || g.fromAddr || 'Remitente',
          correo: g.fromAddr || '',
          asunto: g.subject || '(sin asunto)',
          texto: g.snippet || '',
          hora: g.dateShort ? String(g.dateShort).slice(0, 12) : '',
          dia: '',
          unread: false,
          color: EMAIL_COLORS[i % EMAIL_COLORS.length],
        })),
      )
    })
    return () => s.close()
  }, [])

  const noLeidas = notifs.filter((n) => n.unread).length

  const toggleNotif = () => {
    setCorreoOpen(false)
    setWhatsOpen(false)
    setNotifOpen((v) => !v)
  }

  const abrirPanel = (cual) => {
    setNotifOpen(false)
    setEmailAbierto(null)
    setChatActivo(null)
    if (cual === 'correo') setCorreoOpen((v) => !v)
    else if (cual === 'whats') setWhatsOpen((v) => !v)
  }

  const abrirEmail = (id) => {
    setEmailAbierto(id)
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, unread: false } : e)))
  }

  const enviarMsg = () => {
    const t = nuevoMsg.trim()
    if (!t || !chatActivo) return
    const chat = chats.find((c) => c.id === chatActivo)
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatActivo ? { ...c, hora: 'Ahora', mensajes: [...c.mensajes, { de: 'yo', t }] } : c,
      ),
    )
    setNuevoMsg('')
    // Envio real por la Cloud API si el chat tiene numero y el servidor esta vivo
    if (chat?.wa_id && socketRef.current?.connected) {
      fetch(`${API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: chat.wa_id, text: t }),
      }).catch(() => {})
    }
  }

  const enviarCorreo = async (e) => {
    e.preventDefault()
    if (!comp.to.trim() || !comp.asunto.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/gmail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comp),
      })
      if (res.ok) {
        setCompOpen(false)
        setComp({ to: '', asunto: '', texto: '' })
        setEnviadoOk('Correo enviado ✓')
        setTimeout(() => setEnviadoOk(''), 3000)
      } else {
        setEnviadoOk('Error al enviar (¿Gmail conectado?)')
        setTimeout(() => setEnviadoOk(''), 3000)
      }
    } catch {
      setEnviadoOk('Sin conexión con el servidor')
      setTimeout(() => setEnviadoOk(''), 3000)
    }
  }
  const navigate = useNavigate()
  const links = [...NAV[profile]]
  if (isAdmin && profile === 'digitacion') {
    links.push({
      title: 'Admin',
      items: [
        { to: '/digitacion/registros', label: 'Registros', icon: FiUsers },
        { to: '/digitacion/admin-pcs', label: 'Administrar PCs', icon: FiMonitor },
      ],
    })
  }
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
            <button onClick={() => setPerfilOpen(true)} aria-label="Ver perfil" className="block">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover ring-1 ring-blue-500/40" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/40">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </button>
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-night-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover:opacity-100">
              {user?.name || 'Usuario'}
            </span>
          </div>
        ) : (
          <button onClick={() => setPerfilOpen(true)} className="flex items-center gap-3 px-5 pb-3 pt-4 text-left">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-blue-500/40" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/40">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Usuario'}</p>
              <p className="truncate text-[11px] text-slate-400">
                Perfil: {profile === 'pos' ? 'POS · Vendedor' : 'Digitación'}
              </p>
            </div>
          </button>
        )}

        <nav className={`flex-1 space-y-1 p-3 ${iconOnly ? 'overflow-visible' : 'overflow-y-auto p-4'}`}>
          {links.map((group, gi) => (
            <div
              key={group.title}
              className={iconOnly ? `${gi > 0 ? 'border-t border-white/5 pt-3 ' : ''}pb-3` : 'pb-2'}
            >
              {!iconOnly && (
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  {group.title}
                </p>
              )}
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
            onClick={() => navigate(`/${profile}/ajustes`)}
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <RocketLogo size={20} />
            </span>
            <span className="text-sm font-bold tracking-tight text-white">IMPULSA</span>
          </Link>

          {/* Fecha y hora */}
          <Clock />

          {/* Notificaciones, correo y WhatsApp */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={toggleNotif}
              title="Notificaciones"
              aria-label="Notificaciones"
              className={`relative rounded-xl p-2.5 transition hover:bg-white/5 ${
                notifOpen ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <FiBell size={18} />
              {noLeidas > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-night-900">
                  {noLeidas}
                </span>
              )}
            </button>
            <button
              onClick={() => abrirPanel('correo')}
              title="Correo"
              aria-label="Correo"
              className="rounded-xl p-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <FiMail size={18} />
            </button>
            <button
              onClick={() => abrirPanel('whats')}
              title="WhatsApp"
              aria-label="WhatsApp"
              className="rounded-xl p-2.5 text-slate-300 transition hover:bg-green-500/10 hover:text-green-400"
            >
              <FaWhatsapp size={19} />
            </button>

            {/* Dropdown de notificaciones */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <p className="text-sm font-bold text-white">Notificaciones</p>
                    <button
                      onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Marcar leídas
                    </button>
                  </div>
                  <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto">
                    {notifs.map((n) => (
                      <li key={n.id} className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.color}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs ${n.unread ? 'font-bold text-white' : 'font-semibold text-slate-400'}`}>
                            {n.titulo}
                          </p>
                          <p className="truncate text-xs text-slate-500">{n.desc}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-slate-500">{n.hora}</p>
                          {n.unread && <span className="ml-auto mt-1 block h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet context={{ profile }} />
        </main>
      </div>

      {/* Flotante: perfil y ganancias */}
      {perfilOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPerfilOpen(false)}
        >
          <div
            className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-500/40" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-2xl font-bold text-blue-300 ring-2 ring-blue-500/40">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{user?.name || 'Usuario'}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || '—'}</p>
                <span className="mt-1.5 inline-block rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                  {profile === 'pos' ? 'POS · Vendedor' : 'Digitación'}
                </span>
              </div>
              <button
                onClick={() => setPerfilOpen(false)}
                aria-label="Cerrar"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Información</p>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                  <FiMail size={14} className="shrink-0 text-blue-400" />
                  <dt className="text-slate-400">Correo</dt>
                  <dd className="ml-auto truncate font-semibold text-white">{user?.email || '—'}</dd>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                  <FiPhone size={14} className="shrink-0 text-emerald-400" />
                  <dt className="text-slate-400">Celular</dt>
                  <dd className="ml-auto truncate font-semibold text-white">{user?.telefono || 'No registrado'}</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FiDollarSign size={13} className="text-emerald-400" /> Mis ganancias · COP
              </p>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                  <dt className="text-slate-400">Hoy</dt>
                  <dd className="font-black text-emerald-400">$ 0</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                  <dt className="text-slate-400">Esta semana</dt>
                  <dd className="font-black text-emerald-400">$ 0</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-night-800 px-4 py-2.5 ring-1 ring-white/5">
                  <dt className="text-slate-400">Pagos pendientes</dt>
                  <dd className="font-black text-amber-400">$ 0</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setPerfilOpen(false)
                  navigate(`/${profile}/ajustes`)
                }}
                className="btn-primary w-full !py-2.5 !text-xs"
              >
                Editar perfil y foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flotante: correo (estilo Gmail) */}
      {correoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setCorreoOpen(false)}
        >
          <div
            className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              {emailAbierto || compOpen ? (
                <button
                  onClick={() => (compOpen ? setCompOpen(false) : setEmailAbierto(null))}
                  aria-label="Volver"
                  className="rounded-xl p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <FiArrowLeft size={18} />
                </button>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
                  <FiMail size={17} />
                </span>
              )}
              <div>
                <h3 className="font-bold text-white">
                  {compOpen ? 'Redactar' : emailAbierto ? 'Mensaje' : 'Bandeja de entrada'}
                </h3>
                <p className="text-xs text-slate-400">{emails.filter((e) => e.unread).length} sin leer</p>
              </div>
              {enviadoOk && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  {enviadoOk}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!emailAbierto && !compOpen && (
                  <>
                    <span
                      className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 sm:inline-flex ${
                        live
                          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {live ? 'En vivo' : 'Demo'}
                    </span>
                    <button
                      onClick={() => {
                        setCompOpen(true)
                        setEmailAbierto(null)
                      }}
                      className="rounded-xl bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500 hover:text-white"
                    >
                      Redactar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCorreoOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {compOpen ? (
              <form onSubmit={enviarCorreo} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <div>
                  <label className="label-form">Para *</label>
                  <input
                    value={comp.to}
                    onChange={(e) => setComp({ ...comp, to: e.target.value })}
                    placeholder="destinatario@correo.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-form">Asunto *</label>
                  <input
                    value={comp.asunto}
                    onChange={(e) => setComp({ ...comp, asunto: e.target.value })}
                    placeholder="Asunto del correo"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-form">Mensaje</label>
                  <textarea
                    value={comp.texto}
                    onChange={(e) => setComp({ ...comp, texto: e.target.value })}
                    rows={7}
                    placeholder="Escribe tu mensaje…"
                    className="input-field resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs">
                    <FiSend /> Enviar correo
                  </button>
                </div>
              </form>
            ) : !emailAbierto ? (
              <>
                <div className="border-b border-white/5 px-5 py-3">
                  <input
                    value={correoQ}
                    onChange={(e) => setCorreoQ(e.target.value)}
                    placeholder="Buscar en el correo…"
                    className="input-field !py-2 !text-xs"
                  />
                </div>
                <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
                  {emails
                    .filter((m) =>
                      `${m.de} ${m.asunto} ${m.texto}`.toLowerCase().includes(correoQ.trim().toLowerCase()),
                    )
                    .map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => abrirEmail(m.id)}
                          className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-white/[0.03] ${
                            m.unread ? 'bg-blue-600/[0.06]' : ''
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${m.color}`}>
                            {m.de.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className={`truncate text-sm ${m.unread ? 'font-bold text-white' : 'font-semibold text-slate-300'}`}>
                                {m.de}
                              </p>
                              <span className="ml-auto shrink-0 text-[11px] text-slate-500">{m.hora}</span>
                            </div>
                            <p className={`truncate text-xs ${m.unread ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                              {m.asunto}
                            </p>
                            <p className="truncate text-xs text-slate-500">{m.texto}</p>
                          </div>
                          {m.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                        </button>
                      </li>
                    ))}
                </ul>
              </>
            ) : (() => {
              const m = emails.find((e) => e.id === emailAbierto)
              return (
                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  <h4 className="text-lg font-bold text-white">{m.asunto}</h4>
                  <div className="mt-4 flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${m.color}`}>
                      {m.de.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{m.de}</p>
                      <p className="text-xs text-slate-500">{m.correo}</p>
                    </div>
                    <span className="ml-auto text-xs text-slate-500">{m.hora}</span>
                  </div>
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-300">{m.texto}</p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Flotante: WhatsApp (mensajería) */}
      {whatsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWhatsOpen(false)}
        >
          <div
            className="flex h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lista de chats */}
            <div className={`w-full flex-col border-r border-white/10 sm:flex sm:w-72 ${chatActivo ? 'hidden' : 'flex'}`}>
              <div className="flex items-center gap-3 border-b border-white/10 bg-[#075E54] px-4 py-3.5">
                <FaWhatsapp size={20} className="text-white" />
                <h3 className="font-bold text-white">WhatsApp</h3>
                <span
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                    live
                      ? 'bg-white/10 text-emerald-300 ring-emerald-400/40'
                      : 'bg-black/20 text-amber-200 ring-amber-400/40'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  {live ? 'En vivo' : 'Demo'}
                </span>
                <button
                  onClick={() => setWhatsOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
                {chats.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setChatActivo(c.id)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/25 text-sm font-bold text-emerald-300">
                        {c.nombre.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate text-sm font-semibold text-white">{c.nombre}</p>
                          <span className="ml-auto shrink-0 text-[10px] text-slate-500">{c.hora}</span>
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {c.mensajes[c.mensajes.length - 1]?.t}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conversación */}
            <div className={`flex min-h-0 flex-1 flex-col ${chatActivo ? 'flex' : 'hidden sm:flex'}`}>
              {chatActivo ? (
                <>
                  <div className="flex items-center gap-3 border-b border-white/10 bg-[#128C7E] px-4 py-3">
                    <button
                      onClick={() => setChatActivo(null)}
                      aria-label="Volver"
                      className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 sm:hidden"
                    >
                      <FiArrowLeft size={18} />
                    </button>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                      {(chats.find((c) => c.id === chatActivo)?.nombre || '?').charAt(0).toUpperCase()}
                    </span>
                    <p className="truncate text-sm font-bold text-white">
                      {chats.find((c) => c.id === chatActivo)?.nombre}
                    </p>
                    <button
                      onClick={() => setWhatsOpen(false)}
                      aria-label="Cerrar"
                      className="ml-auto hidden rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 sm:block"
                    >
                      <FiX size={16} />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-night-900 p-4">
                    {chats
                      .find((c) => c.id === chatActivo)
                      ?.mensajes.map((msg, i) => (
                        <div key={i} className={`flex ${msg.de === 'yo' ? 'justify-end' : 'justify-start'}`}>
                          <span
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                              msg.de === 'yo'
                                ? 'rounded-br-md bg-[#005C4B] text-white'
                                : 'rounded-bl-md bg-night-800 text-slate-200'
                            }`}
                          >
                            {msg.t}
                          </span>
                        </div>
                      ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      enviarMsg()
                    }}
                    className="flex items-center gap-2 border-t border-white/10 p-3"
                  >
                    <input
                      value={nuevoMsg}
                      onChange={(e) => setNuevoMsg(e.target.value)}
                      placeholder="Escribe un mensaje…"
                      className="input-field !py-2.5"
                    />
                    <button type="submit" aria-label="Enviar" className="btn-primary !rounded-xl !p-3">
                      <FiSend size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center sm:flex">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/15 ring-1 ring-emerald-500/30">
                    <FaWhatsapp size={30} className="text-emerald-400" />
                  </span>
                  <p className="text-sm font-bold text-white">WhatsApp Web</p>
                  <p className="max-w-[220px] text-xs text-slate-500">
                    Selecciona un chat de la lista para empezar a conversar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
