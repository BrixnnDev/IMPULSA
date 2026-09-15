import { Link } from 'react-router-dom'
import { FiLayers, FiPenTool, FiFileText } from 'react-icons/fi'

const CARDS = [
  {
    to: '/digitacion/disenos',
    label: 'Diseños formatos',
    icon: FiPenTool,
    desc: 'Administra y visualiza todos los diseños',
    color: 'bg-violet-600/15 text-violet-400 ring-violet-500/30',
    hover: 'hover:border-violet-500/40 hover:bg-violet-600/5',
  },
  {
    to: '/digitacion/cotizacion',
    label: 'Cotización',
    icon: FiFileText,
    desc: 'Genera cotizaciones y descarga en PDF',
    color: 'bg-sky-600/15 text-sky-400 ring-sky-500/30',
    hover: 'hover:border-sky-500/40 hover:bg-sky-600/5',
  },
]

export default function DigitFormatos() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiLayers size={20} />
          </span>
          Formatos
        </h2>
        <p className="mt-1 text-sm text-slate-400">Accede a las herramientas de formatos disponibles.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className={`group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-night-900 p-8 text-center transition duration-300 hover:-translate-y-1 ${card.hover}`}
          >
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-110 ${card.color}`}>
              <card.icon size={28} />
            </span>
            <div>
              <p className="text-lg font-black text-white">{card.label}</p>
              <p className="mt-1.5 text-sm text-slate-400">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}