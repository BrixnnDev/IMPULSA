import { useState } from 'react'
import { FiUploadCloud, FiCheckCircle, FiPlus, FiX } from 'react-icons/fi'
import { productosSeed } from '../../data/mockData'

const emptyForm = {
  nombre: '',
  categoria: 'Abarrotes',
  unidad: 'Unidad',
  precioCompra: '',
  precioVenta: '',
  stockInicial: '',
  stockMinimo: '',
  proveedor: '',
}

export default function DigitProductos() {
  const [productos, setProductos] = useState(productosSeed)
  const [form, setForm] = useState(emptyForm)
  const [ok, setOk] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevo = {
      id: Date.now(),
      codigo: `PRD-${String(productos.length + 1).padStart(3, '0')}`,
      nombre: form.nombre,
      categoria: form.categoria,
      unidad: form.unidad,
      precioCompra: Number(form.precioCompra) || 0,
      precioVenta: Number(form.precioVenta) || 0,
      stock: Number(form.stockInicial) || 0,
      stockMinimo: Number(form.stockMinimo) || 5,
      proveedor: form.proveedor || '—',
    }
    setProductos((prev) => [...prev, nuevo])
    setForm(emptyForm)
    setOk(`Producto “${nuevo.nombre}” digitalizado con código ${nuevo.codigo}.`)
    setTimeout(() => setOk(''), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Registrar productos</h2>
        <p className="mt-1 text-sm text-slate-400">Digitaliza nuevos productos al catálogo del sistema.</p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} /> {ok}
          <button onClick={() => setOk('')} className="ml-auto text-emerald-300/70 hover:text-emerald-200">
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        {/* Formulario de digitación */}
        <form onSubmit={handleSubmit} className="panel h-fit space-y-4 p-6 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
              <FiUploadCloud size={18} />
            </span>
            <h3 className="font-bold text-white">Nuevo registro</h3>
          </div>

          <div>
            <label className="label-form">Nombre del producto *</label>
            <input name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Ej. Leche Evaporada 400 g" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Categoría</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} className="input-field">
                {['Abarrotes', 'Bebidas', 'Limpieza', 'Panadería', 'Snacks', 'Otros'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Unidad</label>
              <select name="unidad" value={form.unidad} onChange={handleChange} className="input-field">
                {['Unidad', 'Kilogramo', 'Litro', 'Paquete', 'Caja'].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Precio compra *</label>
              <input name="precioCompra" type="number" step="0.10" min="0" required value={form.precioCompra} onChange={handleChange} placeholder="0.00" className="input-field" />
            </div>
            <div>
              <label className="label-form">Precio venta *</label>
              <input name="precioVenta" type="number" step="0.10" min="0" required value={form.precioVenta} onChange={handleChange} placeholder="0.00" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Stock inicial *</label>
              <input name="stockInicial" type="number" min="0" required value={form.stockInicial} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="label-form">Stock mínimo</label>
              <input name="stockMinimo" type="number" min="0" value={form.stockMinimo} onChange={handleChange} placeholder="5" className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-form">Proveedor</label>
            <input name="proveedor" value={form.proveedor} onChange={handleChange} placeholder="Opcional" className="input-field" />
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            <FiPlus /> Digitalizar producto
          </button>
        </form>

        {/* Catálogo digitalizado */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Catálogo digitalizado ({productos.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {[...productos].reverse().map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {p.codigo}
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-white">{p.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {p.categoria} · {p.unidad} · Prov.: {p.proveedor}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-slate-500">Compra: S/ {Number(p.precioCompra).toFixed(2)}</p>
                  <p className="font-bold text-white">Venta: S/ {Number(p.precioVenta).toFixed(2)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    p.stock <= p.stockMinimo ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  Stock: {p.stock}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
