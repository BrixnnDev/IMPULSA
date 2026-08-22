import { useMemo, useState } from 'react'
import { FiSearch, FiPlus, FiMinus, FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi'
import { productosSeed } from '../../data/mockData'

const fmt = (n) => `S/ ${n.toFixed(2)}`
const emptyForm = {
  codigo: '',
  nombre: '',
  categoria: 'Abarrotes',
  precioCompra: '',
  precioVenta: '',
  stock: '',
  stockMinimo: '',
  proveedor: '',
}

export default function PosInventario() {
  const [productos, setProductos] = useState(productosSeed)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return productos
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q),
    )
  }, [productos, query])

  const adjustStock = (id, delta) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
    )
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = (e) => {
    e.preventDefault()
    const nuevo = {
      id: Date.now(),
      codigo: form.codigo || `PRD-${String(productos.length + 1).padStart(3, '0')}`,
      nombre: form.nombre,
      categoria: form.categoria,
      precioCompra: Number(form.precioCompra) || 0,
      precioVenta: Number(form.precioVenta) || 0,
      stock: Number(form.stock) || 0,
      stockMinimo: Number(form.stockMinimo) || 5,
      proveedor: form.proveedor || '—',
    }
    setProductos((prev) => [nuevo, ...prev])
    setForm(emptyForm)
    setModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Inventario</h2>
          <p className="mt-1 text-sm text-slate-400">
            {filtered.length} de {productos.length} productos
          </p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <FiPlus /> Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, código o categoría…"
          className="input-field !pl-11"
        />
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Código</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold text-right">P. Venta</th>
                <th className="px-6 py-4 font-semibold text-center">Stock</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold text-center">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => {
                const bajo = p.stock <= p.stockMinimo
                return (
                  <tr key={p.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-mono text-xs text-blue-300">{p.codigo}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{p.nombre}</p>
                      <p className="text-xs text-slate-500">{p.proveedor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs text-blue-300 ring-1 ring-blue-500/25">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">{fmt(p.precioVenta)}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex h-8 w-12 items-center justify-center rounded-lg font-bold ${
                          bajo ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {bajo ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                          <FiAlertTriangle /> Repón
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <FiCheckCircle /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjustStock(p.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-red-500/20 hover:text-red-400"
                          aria-label={`Restar una unidad a ${p.nombre}`}
                        >
                          <FiMinus size={14} />
                        </button>
                        <button
                          onClick={() => adjustStock(p.id, +1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:bg-emerald-500/20 hover:text-emerald-400"
                          aria-label={`Sumar una unidad a ${p.nombre}`}
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos para “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nuevo producto */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Nuevo producto</h3>
              <button
                onClick={() => setModal(false)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Cerrar"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-form">Código</label>
                <input name="codigo" value={form.codigo} onChange={handleChange} placeholder="Automático" className="input-field" />
              </div>
              <div>
                <label className="label-form">Nombre *</label>
                <input name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Ej. Leche Evaporada" className="input-field" />
              </div>
              <div>
                <label className="label-form">Categoría</label>
                <select name="categoria" value={form.categoria} onChange={handleChange} className="input-field">
                  {['Abarrotes', 'Bebidas', 'Limpieza', 'Panadería', 'Snacks', 'Otros'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-form">Proveedor</label>
                <input name="proveedor" value={form.proveedor} onChange={handleChange} placeholder="Opcional" className="input-field" />
              </div>
              <div>
                <label className="label-form">Precio compra (S/)</label>
                <input name="precioCompra" type="number" step="0.10" min="0" value={form.precioCompra} onChange={handleChange} placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className="label-form">Precio venta (S/) *</label>
                <input name="precioVenta" type="number" step="0.10" min="0" required value={form.precioVenta} onChange={handleChange} placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className="label-form">Stock inicial *</label>
                <input name="stock" type="number" min="0" required value={form.stock} onChange={handleChange} placeholder="0" className="input-field" />
              </div>
              <div>
                <label className="label-form">Stock mínimo</label>
                <input name="stockMinimo" type="number" min="0" value={form.stockMinimo} onChange={handleChange} placeholder="5" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary w-full">
                  Guardar producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
