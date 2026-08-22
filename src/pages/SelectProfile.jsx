import { Link, useNavigate } from 'react-router-dom'
import { FiLogOut, FiArrowRight, FiClipboard } from 'react-icons/fi'
import { MdPointOfSale, MdOutlineInventory2 } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'

const profiles = [
  {
    key: 'digitacion',
    title: 'Digitación',
    subtitle: 'Centro de datos',
    icon: MdOutlineInventory2,
    desc: 'Registra productos nuevos, controla entradas y salidas del almacén y mantén el catálogo actualizado.',
    bullets: ['Registrar productos', 'Entradas y salidas', 'Validar movimientos'],
    accent: 'from-cyan-500/20 to-blue-600/10',
  },
  {
    key: 'pos',
    title: 'POS · Vender',
    subtitle: 'Punto de venta',
    icon: MdPointOfSale,
    desc: 'Cobra en mostrador, revisa tu inventario al instante y consulta las ventas del día.',
    bullets: ['Caja rápida', 'Inventario en vivo', 'Ventas del día'],
    accent: 'from-blue-600/25 to-indigo-500/10',
    highlight: true,
  },
]

export default function SelectProfile() {
  const { user, setProfile, logout } = useAuth()
  const navigate = useNavigate()

  const choose = (key) => {
    setProfile(key)
    navigate(key === 'pos' ? '/pos' : '/digitacion')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-night-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[140px]" />

      <div className="absolute left-6 top-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
            S
          </span>
          <span className="font-bold tracking-tight text-white">StockFlow</span>
        </Link>
      </div>

      <button
        onClick={() => {
          logout()
          navigate('/')
        }}
        className="btn-ghost absolute right-6 top-6 !px-3 !py-2 text-xs"
      >
        <FiLogOut size={14} /> Salir
      </button>

      <div className="relative mt-10 w-full max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
          <FiClipboard /> Elige tu perfil
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
          ¡Hola, {user?.name?.split(' ')[0] || 'usuario'}! ¿Cómo trabajarás hoy?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Selecciona un perfil para entrar a su dashboard. Podrás cambiarlo cuando quieras.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {profiles.map(({ key, title, subtitle, icon: Icon, desc, bullets, accent, highlight }) => (
            <button
              key={key}
              onClick={() => choose(key)}
              className={`panel group relative overflow-hidden p-8 text-left transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 ${
                highlight ? 'ring-1 ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/20' : ''
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-60`} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl text-white shadow-lg shadow-blue-600/40 transition group-hover:scale-110">
                    <Icon />
                  </span>
                  {highlight && (
                    <span className="rounded-full bg-blue-600/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/40">
                      Más usado
                    </span>
                  )}
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-blue-400">{subtitle}</p>
                <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
                <p className="mt-3 min-h-[48px] text-sm leading-relaxed text-slate-400">{desc}</p>

                <ul className="mt-5 space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {b}
                    </li>
                  ))}
                </ul>

                <span className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-300 ring-1 ring-blue-500/30 transition group-hover:bg-blue-600 group-hover:text-white">
                  Entrar al dashboard <FiArrowRight className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
