import { Link } from 'react-router-dom'
import RocketLogo from './RocketLogo'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-night-900">
      <div className="flex flex-col items-center gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span className="flex items-center gap-1.5">
            <RocketLogo size={16} /> © 2026 IMPULSA · Digitación & Gestión de Inventario
          </span>
          <span className="text-slate-600">·</span>
          <a
            href="https://brixnndev.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-blue-400"
          >
            <RocketLogo size={14} /> Creado por BRIXNNDEV
          </a>
        </div>
      </div>
    </footer>
  )
}
