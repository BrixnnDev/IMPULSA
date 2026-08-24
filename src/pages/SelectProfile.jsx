import { Link, useNavigate } from 'react-router-dom'
import { FiLogOut, FiArrowRight, FiClipboard } from 'react-icons/fi'
import { MdPointOfSale, MdOutlineInventory2 } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'

const profiles = [
  {
    key: 'digitacion',
    title: 'Digitación',
    subtitle: 'Hojas de vida',
    icon: MdOutlineInventory2,
    desc: 'Digitaliza, imprime, guarda y modifica hojas de vida. Cada trabajo realizado se paga.',
    bullets: ['Digitalizar hojas de vida', 'Imprimir y modificar', 'Pago por trabajo'],
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
    <div className="relative flex h-dvh min-h-[560px] flex-col items-center justify-center overflow-hidden bg-night-950 px-4">
      {/* Fondo decorativo: cuadrados y triángulos flotantes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-grid mask-hero absolute inset-0 opacity-40" />

        <div className="animate-float absolute left-[7%] top-[20%] h-12 w-12 rotate-12 rounded-lg border-2 border-blue-500/25" />
        <div className="animate-float-alt absolute right-[9%] top-[13%] h-16 w-16 -rotate-6 rounded-lg border-2 border-cyan-400/15" />
        <div className="animate-float absolute bottom-[16%] left-[12%] h-8 w-8 rotate-45 rounded-md bg-blue-600/15" />
        <div className="animate-orb absolute bottom-[22%] right-[12%] h-10 w-10 rotate-12 rounded-lg bg-blue-500/10 ring-1 ring-blue-400/20" />
        <div className="animate-float-alt absolute left-[46%] top-[9%] h-6 w-6 rotate-45 rounded-sm bg-blue-400/20" />
        <div className="animate-float absolute bottom-[8%] left-[27%] h-14 w-14 rotate-3 rounded-xl border border-blue-400/15" />
        <div className="animate-float-alt absolute right-[24%] bottom-[10%] h-9 w-9 rotate-6 rounded-md bg-indigo-500/15 ring-1 ring-indigo-400/20" />
        <div className="animate-float absolute right-[7%] top-[52%] h-7 w-7 rotate-12 rounded-md bg-cyan-400/15" />

        <div className="shape-tri animate-float-alt absolute right-[19%] top-[36%] h-12 w-12 bg-blue-500/15" />
        <div className="shape-tri animate-float absolute left-[15%] top-[50%] h-9 w-9 bg-cyan-400/10" />
        <div className="shape-tri animate-float absolute bottom-[30%] left-[38%] h-14 w-14 rotate-180 bg-blue-600/10" />
        <div className="shape-tri animate-float-alt absolute bottom-[42%] right-[32%] h-8 w-8 -rotate-90 bg-indigo-400/15" />
        <div className="shape-tri animate-float absolute left-[5%] top-[70%] h-16 w-16 rotate-[25deg] bg-blue-500/10" />
      </div>

      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[140px]" />

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

      <div className="relative w-full max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
          <FiClipboard /> Elige tu perfil
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-4xl">
          ¡Hola, {user?.name?.split(' ')[0] || 'usuario'}! ¿Cómo trabajarás hoy?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
          Selecciona un perfil para entrar a su dashboard. Podrás cambiarlo cuando quieras.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-5 md:mt-9 md:grid-cols-2">
          {profiles.map(({ key, title, subtitle, icon: Icon, desc, bullets, accent, highlight }) => (
            <button
              key={key}
              onClick={() => choose(key)}
              className={`panel group relative overflow-hidden p-6 text-left transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 ${
                highlight ? 'ring-1 ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/20' : ''
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-60`} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-3xl text-white shadow-lg shadow-blue-600/40 transition group-hover:scale-110">
                    <Icon />
                  </span>
                  {highlight && (
                    <span className="rounded-full bg-blue-600/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/40">
                      Más usado
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-blue-400">{subtitle}</p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>

                <ul className="mt-3 space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {b}
                    </li>
                  ))}
                </ul>

                <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-300 ring-1 ring-blue-500/30 transition group-hover:bg-blue-600 group-hover:text-white">
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
