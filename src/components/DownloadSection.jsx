import { useState } from 'react'
import { FiSmartphone, FiMonitor, FiDownload, FiArrowRight, FiLock, FiZap, FiX, FiFileText } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { FaGooglePlay, FaApple, FaWindows } from 'react-icons/fa'

const STORES = [
  {
    id: 'google-play',
    name: 'Google Play',
    icon: FaGooglePlay,
    deviceIcon: FiSmartphone,
    tagline: 'Para Android 8.0+',
    badgeColor: 'from-emerald-500 to-emerald-600',
    ringColor: 'ring-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    url: 'https://play.google.com/store/apps/details?id=com.stockflow.app',
    alt: 'Descargar en Google Play',
  },
  {
    id: 'app-store',
    name: 'App Store',
    icon: FaApple,
    deviceIcon: FiSmartphone,
    tagline: 'Para iOS 15+',
    badgeColor: 'from-slate-700 to-slate-900',
    ringColor: 'ring-slate-500/30',
    hoverBorder: 'hover:border-slate-500/50',
    bgColor: 'bg-slate-700/10',
    textColor: 'text-slate-300',
    url: 'https://apps.apple.com/app/stockflow/id1234567890',
    alt: 'Descargar en App Store',
  },
]

export default function DownloadSection() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section id="descarga" className="relative scroll-mt-20 overflow-hidden border-t border-white/5" aria-labelledby="descarga-title">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            <FiDownload className="text-emerald-400" /> Disponible en tus dispositivos
          </span>
          <h2 id="descarga-title" className="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Lleva StockFlow a{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">todas partes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Descarga la app nativa y gestiona tu inventario, ventas y facturación desde el celular,
            tablet o computador. Sincronización en tiempo real entre dispositivos.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORES.map((store) => (
            <a
              key={store.id}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`panel group relative flex flex-col items-center p-7 text-center transition duration-300 hover:-translate-y-1.5 ${store.hoverBorder} ${store.ringColor}`}
              aria-label={store.alt}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(135deg, ${store.badgeColor.split(' to ')[0]}, ${store.badgeColor.split(' to ')[1]})` }} />
              <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl ${store.bgColor} ${store.textColor} ring-1 ring-white/5 transition duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                {(() => { const Icon = store.icon; return <Icon size={28} aria-hidden="true" />; })()}
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-xl font-bold text-white">{store.name}</h3>
                <p className="text-sm text-slate-400">{store.tagline}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 transition group-hover:text-white">
                {(() => { const DeviceIcon = store.deviceIcon; return <DeviceIcon size={16} className={store.textColor} aria-hidden="true" />; })()}
                <span>Descargar</span>
                <FiArrowRight size={14} className={store.textColor} aria-hidden="true" />
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${store.bgColor} ${store.textColor} ring-1 ${store.ringColor}`}>
                  <FiDownload size={10} /> Nativa
                </span>
              </div>
            </a>
          ))}

          {/* Card: Windows + Script */}
          <button
            onClick={() => setModalOpen(true)}
            className="panel group relative flex flex-col items-center p-7 text-center transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:ring-blue-500/30"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 blur-2xl transition duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-white/5 transition duration-300 group-hover:scale-110 group-hover:shadow-xl">
              <FaWindows size={28} aria-hidden="true" />
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold text-white">Windows PC</h3>
              <p className="text-sm text-slate-400">App + Agente de escritorio</p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 transition group-hover:text-white">
              <FiMonitor size={16} className="text-blue-400" aria-hidden="true" />
              <span>Descargar</span>
              <FiArrowRight size={14} className="text-blue-400" aria-hidden="true" />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 ring-1 ring-blue-500/30">
                <FiDownload size={10} /> .exe + .bat
              </span>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            ¿Prefieres usar la versión web?{' '}
            <Link to="/registro" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Regístrate y accede desde el navegador
            </Link>
          </p>
        </div>

        <div className="mt-10">
          <h3 className="text-center text-xl font-bold text-white sm:text-2xl">¿Por qué la app nativa?</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
            {[
              { icon: FiSmartphone, title: 'Sincronización instantánea', desc: 'Tus datos siempre actualizados en todos tus dispositivos' },
              { icon: FiLock, title: 'Seguridad garantizada', desc: 'Cifrado de extremo a extremo y backups automáticos' },
              { icon: FiZap, title: 'Funciona offline', desc: 'Sigue vendiendo aunque pierdas conexión a internet' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="panel p-6 transition hover:border-blue-500/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"><Icon size={20} /></div>
                <h4 className="mt-4 font-bold text-white">{title}</h4>
                <p className="mt-2 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: opciones de descarga Windows */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                <FiDownload size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Descargar para Windows</h3>
                <p className="text-xs text-slate-400">Elige qué necesitas instalar</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <a
                href="/StockFlow.exe"
                download
                className="group flex items-start gap-4 rounded-xl border border-white/10 bg-night-800 p-5 transition hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30 transition group-hover:scale-110">
                  <FiMonitor size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white">App principal (Windows)</h4>
                  <p className="mt-1 text-xs text-slate-400">El programa completo de StockFlow para gestionar inventario, ventas y facturación.</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 ring-1 ring-blue-500/30">
                    <FiDownload size={10} /> Windows 10/11
                  </span>
                </div>
                <FiArrowRight size={18} className="mt-4 shrink-0 text-slate-500 transition group-hover:text-blue-400" />
              </a>

              <a
                href="/agent/instalar.bat"
                download
                className="group flex items-start gap-4 rounded-xl border border-white/10 bg-night-800 p-5 transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 transition group-hover:scale-110">
                  <FiFileText size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white">Agente de PC (script)</h4>
                  <p className="mt-1 text-xs text-slate-400">Script que se instala en cada computador. Envía la info de la PC al panel automáticamente.</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                    <FiDownload size={10} /> .bat · Windows
                  </span>
                </div>
                <FiArrowRight size={18} className="mt-4 shrink-0 text-slate-500 transition group-hover:text-emerald-400" />
              </a>
            </div>

            <div className="border-t border-white/5 px-6 py-4 text-center text-xs text-slate-500">
              ¿Necesitas ayuda?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">Inicia sesión</Link> y contacta soporte.
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
