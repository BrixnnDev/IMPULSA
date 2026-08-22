import { useMemo, useState } from 'react'
import { FiPlus, FiMinus, FiTrash2, FiCreditCard, FiSearch, FiCheckCircle, FiShoppingCart } from 'react-icons/fi'
import { productosSeed, ventasSeed } from '../../data/mockData'

const fmt = (n) => `S/ ${n.toFixed(2)}`

export default function PosVentas() {
  const [productos] = useState(productosSeed)
  const [ventas, setVentas] = useState(ventasSeed)
  const [cart, setCart] = useState([])
  const [query, setQuery] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [exito, setExito] = useState(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
  }, [productos, query])

  const totalVenta = cart.reduce((acc, i) => acc + i.precioVenta * i.cantidad, 0)

  const addToCart = (p) => {
    setExito(null)
    setCart((prev) => {
      const found = prev.find((i) => i.id === p.id)
      if (found) {
        return prev.map((i) => (i.id === p.id ? { ...i, cantidad: Math.min(i.cantidad + 1, p.stock) } : i))
      }
      return [...prev, { ...p, cantidad: 1 }]
    })
  }

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    )
  }

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id))

  const cobrar = () => {
    if (cart.length === 0) return
    const venta = {
      id: `V-${1025 + ventas.length - ventasSeed.length}`,
      fecha: new Date().toISOString(),
      items: cart.map(({ nombre, cantidad, precioVenta }) => ({ nombre, cantidad, precioVenta })),
      total: totalVenta,
      metodo,
    }
    setVentas((prev) => [venta, ...prev])
    setExito(venta)
    setCart([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Caja · Vender</h2>
        <p className="mt-1 text-sm text-slate-400">Selecciona productos y cobra la venta.</p>
      </div>

      {exito && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} />
          Venta <strong>#{exito.id}</strong> registrada por {fmt(exito.total)} ({exito.metodo}).
          <button onClick={() => setExito(null)} className="ml-auto text-emerald-300/70 hover:text-emerald-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Catálogo */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto…"
              className="input-field !pl-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
                className="panel group flex flex-col p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30 transition group-hover:bg-blue-600 group-hover:text-white">
                  <FiShoppingCart size={16} />
                </span>
                <p className="mt-3 line-clamp-2 min-h-[40px] text-sm font-semibold leading-tight text-white">{p.nombre}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="font-black text-blue-400">{fmt(p.precioVenta)}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-white/10">
                    {p.stock} und
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Historial de la sesión */}
          <div className="panel mt-8 overflow-hidden">
            <h3 className="border-b border-white/5 px-6 py-4 font-bold text-white">Ventas recientes</h3>
            <ul className="divide-y divide-white/5">
              {ventas.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center gap-4 px-6 py-4 text-sm">
                  <span className="font-semibold text-blue-300">#{v.id}</span>
                  <span className="truncate text-slate-400">
                    {v.items.reduce((a, i) => a + i.cantidad, 0)} productos · {v.metodo}
                  </span>
                  <span className="ml-auto shrink-0 font-bold text-white">{fmt(v.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Carrito */}
        <aside className="panel flex h-fit flex-col lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
            <FiShoppingCart className="text-blue-400" />
            <h3 className="font-bold text-white">Carrito</h3>
            <span className="ml-auto rounded-full bg-blue-600/15 px-3 py-1 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40">
              {cart.reduce((a, i) => a + i.cantidad, 0)}
            </span>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto p-5">
            {cart.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                El carrito está vacío.
                <br />Toca un producto para agregarlo.
              </p>
            )}
            {cart.map((i) => (
              <div key={i.id} className="rounded-xl border border-white/5 bg-night-800 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight text-white">{i.nombre}</p>
                  <button
                    onClick={() => removeItem(i.id)}
                    className="shrink-0 text-slate-500 transition hover:text-red-400"
                    aria-label={`Quitar ${i.nombre}`}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(i.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
                      aria-label="Restar"
                    >
                      <FiMinus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">{i.cantidad}</span>
                    <button
                      onClick={() => changeQty(i.id, +1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
                      aria-label="Sumar"
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>
                  <span className="text-sm font-black text-blue-400">{fmt(i.precioVenta * i.cantidad)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-white/5 p-5">
            <div>
              <label className="label-form">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'Yape / Plin', 'Tarjeta'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodo(m)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                      metodo === m
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between rounded-xl bg-night-800 px-4 py-3.5 ring-1 ring-white/5">
              <span className="text-sm font-semibold text-slate-400">Total</span>
              <span className="text-2xl font-black text-white">{fmt(totalVenta)}</span>
            </div>

            <button onClick={cobrar} disabled={cart.length === 0} className="btn-primary glow-blue w-full py-4 text-base">
              <FiCreditCard size={18} /> Cobrar venta
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
