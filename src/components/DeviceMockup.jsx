import { FiShoppingCart, FiBarChart2, FiSmartphone, FiMonitor } from 'react-icons/fi'

export default function DeviceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="animate-orb pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[110px]" />

      {/* Laptop */}
      <div className="relative pr-12 pb-12 pt-4 sm:pr-20 sm:pb-16">
        <div className="panel overflow-hidden ring-1 ring-blue-500/25 shadow-2xl shadow-black/50">
          {/* Barra del navegador */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-night-800 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-3 hidden h-5 flex-1 items-center rounded-md bg-night-700 px-3 text-[10px] text-slate-500 sm:flex">
              stockflow.app/pos
            </span>
          </div>
          {/* Pantalla dashboard */}
          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-28 shrink-0 space-y-3 border-r border-white/5 bg-night-900 p-4 sm:block">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
                S
              </span>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-2.5 rounded-full ${i === 0 ? 'w-full bg-blue-500/60' : 'w-4/5 bg-white/10'}`} />
              ))}
            </div>
            {/* Contenido */}
            <div className="flex-1 space-y-3.5 p-5">
              <div className="grid grid-cols-3 gap-2.5">
                {['S/ 1,240', '+86', 'S/ 58'].map((v, i) => (
                  <div key={i} className="rounded-lg bg-night-800 p-2.5 ring-1 ring-white/5">
                    <div className="mb-1.5 h-1.5 w-3/4 rounded-full bg-white/10" />
                    <p className={`text-xs font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-300'}`}>{v}</p>
                  </div>
                ))}
              </div>
              {/* Gráfico */}
              <div className="flex h-28 items-end gap-2 rounded-lg bg-night-800 p-3 ring-1 ring-white/5">
                {[35, 55, 40, 70, 52, 88, 64].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-sm ${i === 5 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-600/40'}`}
                  />
                ))}
              </div>
              {/* Filas */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="h-6 w-6 shrink-0 rounded-md bg-blue-600/20 ring-1 ring-blue-500/30" />
                  <span className="h-2 flex-1 rounded-full bg-white/10" />
                  <span className="h-2 w-10 rounded-full bg-emerald-400/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Base del laptop */}
        <div className="relative -mx-6 mt-0 h-3 rounded-b-2xl bg-gradient-to-b from-slate-600/60 to-slate-800 shadow-xl sm:-mx-8">
          <div className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-lg bg-slate-900" />
        </div>

        {/* Celular */}
        <div className="absolute bottom-0 right-0 w-40 rotate-3 rounded-[1.9rem] border-[6px] border-slate-800 bg-night-900 shadow-2xl shadow-black/60 ring-1 ring-blue-500/30 sm:w-48">
          <div className="relative overflow-hidden rounded-[1.4rem]">
            <div className="mx-auto mt-2 h-2 w-12 rounded-full bg-slate-700" />
            <div className="space-y-2.5 p-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wider text-blue-200">Ventas hoy</p>
                <p className="text-base font-black text-white">S/ 1,240</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                  <div className="mb-1 h-1 w-3/4 rounded-full bg-white/10" />
                  <p className="text-[10px] font-bold text-emerald-400">+86</p>
                </div>
                <div className="rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                  <div className="mb-1 h-1 w-3/4 rounded-full bg-white/10" />
                  <p className="text-[10px] font-bold text-blue-400">S/ 58</p>
                </div>
              </div>
              <div className="flex h-16 items-end gap-1.5 rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                {[45, 70, 38, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-sm ${i === 3 ? 'bg-cyan-400' : 'bg-blue-600/50'}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-around rounded-lg bg-night-800 py-2 ring-1 ring-white/5">
                <FiShoppingCart size={14} className="text-blue-400" />
                <FiBarChart2 size={14} className="text-slate-500" />
                <FiSmartphone size={14} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chips decorativos */}
      <span className="absolute -left-2 top-10 hidden items-center gap-1.5 rounded-full border border-white/10 bg-night-800/90 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur md:inline-flex">
        <FiMonitor className="text-blue-400" /> Web · POS
      </span>
      <span className="absolute right-2 top-2 hidden items-center gap-1.5 rounded-full border border-white/10 bg-night-800/90 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur md:inline-flex">
        <FiSmartphone className="text-cyan-400" /> Móvil · Ventas
      </span>
    </div>
  )
}
