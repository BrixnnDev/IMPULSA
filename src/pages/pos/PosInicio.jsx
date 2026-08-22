import { FiDollarSign, FiTrendingUp, FiPackage, FiAlertTriangle, FiShoppingCart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { productosSeed, ventasSeed, ventasSemana } from '../../data/mockData'

const fmt = (n) => `S/ ${n.toFixed(2)}`

export default function PosInicio() {
  const stockBajo = productosSeed.filter((p) => p.stock <= p.stockMinimo)
  const ventasHoy = ventasSeed.reduce((acc, v) => acc + v.total, 0)
  const maxVenta = Math.max(...ventasSemana)

  const stats = [
    { label: 'Ventas de hoy', value: `${ventasSeed.length}`, sub: fmt(ventasHoy), icon: FiShoppingCart },
    { label: 'Ingresos del día', value: fmt(ventasHoy), sub: '+12% vs ayer', icon: FiDollarSign, up: true },
    { label: 'Productos activos', value: productosSeed.length, sub: '4 categorías', icon: FiPackage },
    { label: 'Stock bajo', value: stockBajo.length, sub: 'Requieren reposición', icon: FiAlertTriangle, warn: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white">Panel de ventas</h2>
        <p className="mt-1 text-sm text-slate-400">Resumen general de tu punto de venta.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, warn }) => (
          <div key={label} className="panel flex items-center gap-4 p-5">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                warn
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40'
                  : 'bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40'
              }`}
            >
              <Icon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-xl font-black text-white">{value}</p>
              <p className={`truncate text-xs ${warn ? 'text-amber-400' : 'text-slate-500'}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Ventas de la semana */}
        <div className="panel p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Ventas de la semana</h3>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              <FiTrendingUp /> +12%
            </span>
          </div>
          <div className="mt-8 flex h-44 items-end justify-between gap-3">
            {ventasSemana.map((v, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                  S/ {v}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 group-hover:bg-blue-400 ${
                    i === ventasSemana.length - 1 ? 'bg-blue-600' : 'bg-blue-600/35'
                  }`}
                  style={{ height: `${(v / maxVenta) * 100}%` }}
                />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Stock bajo</h3>
            <Link to="/pos/inventario" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              Ver inventario →
            </Link>
          </div>
          <ul className="mt-5 space-y-3">
            {stockBajo.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{p.nombre}</p>
                  <p className="text-xs text-slate-400">Mínimo: {p.stockMinimo} und</p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 ring-1 ring-amber-500/40">
                  {p.stock}
                </span>
              </li>
            ))}
            {stockBajo.length === 0 && (
              <li className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
                Todo el stock está en niveles óptimos.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <h3 className="font-bold text-white">Últimas ventas</h3>
          <Link to="/pos/ventas" className="btn-primary !px-4 !py-2 !text-xs">
            Nueva venta
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Boleta</th>
                <th className="px-6 py-3 font-semibold">Productos</th>
                <th className="px-6 py-3 font-semibold">Pago</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ventasSeed.map((v) => (
                <tr key={v.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-semibold text-blue-300">#{v.id}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
                      {v.metodo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">{fmt(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
