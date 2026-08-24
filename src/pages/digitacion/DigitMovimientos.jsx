import { useState } from 'react'
import { FiArrowDownCircle, FiArrowUpCircle, FiSliders, FiCheckCircle, FiX, FiPrinter } from 'react-icons/fi'
import { productosSeed, movimientosSeed } from '../../data/mockData'

const TIPOS = [
  { key: 'Entrada', icon: FiArrowDownCircle, desc: 'Ingreso de mercadería' },
  { key: 'Salida', icon: FiArrowUpCircle, desc: 'Salida por venta o merma' },
  { key: 'Ajuste', icon: FiSliders, desc: 'Corrección de inventario' },
]

const MOTIVOS = {
  Entrada: ['Compra a proveedor', 'Reposición semanal', 'Devolución de cliente'],
  Salida: ['Merma / dañados', 'Consumo interno', 'Transferencia a sucursal'],
  Ajuste: ['Inventario físico', 'Error de digitación', 'Vencimiento'],
}

export default function DigitMovimientos() {
  const [movimientos, setMovimientos] = useState(movimientosSeed)
  const [tipo, setTipo] = useState('Entrada')
  const [producto, setProducto] = useState(productosSeed[0]?.nombre || '')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS.Entrada[0])
  const [ok, setOk] = useState('')

  const registrar = (e) => {
    e.preventDefault()
    const signo = tipo === 'Entrada' ? 1 : tipo === 'Salida' ? -1 : Number(cantidad) < 0 ? -1 : 1
    const mov = {
      id: `MOV-${502 + movimientos.length}`,
      tipo,
      producto,
      cantidad: signo * Math.abs(Number(cantidad) || 0),
      motivo,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
    }
    setMovimientos((prev) => [mov, ...prev])
    setOk(`Movimiento ${mov.id} registrado y enviado a validación.`)
    setCantidad('')
    setTimeout(() => setOk(''), 4000)
  }

  const validar = (id) => {
    setMovimientos((prev) => prev.map((m) => (m.id === id ? { ...m, estado: 'Validado' } : m)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiPrinter size={20} />
          </span>
          Imprimir
        </h2>
        <p className="mt-1 text-sm text-slate-400">Imprime las hojas de vida digitalizadas.</p>
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
        {/* Formulario */}
        <form onSubmit={registrar} className="panel h-fit space-y-5 p-6 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
              <FiPrinter size={18} />
            </span>
            <h3 className="font-bold text-white">Registrar impresión</h3>
          </div>

          <div>
            <label className="label-form">Tipo de movimiento *</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTipo(key)
                    setMotivo(MOTIVOS[key][0])
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3.5 text-xs font-semibold transition ${
                    tipo === key
                      ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={20} />
                  {key}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{TIPOS.find((t) => t.key === tipo)?.desc}</p>
          </div>

          <div>
            <label className="label-form">Producto *</label>
            <select value={producto} onChange={(e) => setProducto(e.target.value)} className="input-field">
              {productosSeed.map((p) => (
                <option key={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Cantidad *</label>
              <input
                type="number"
                required
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={tipo === 'Ajuste' ? 'Ej. -3 o +5' : '0'}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-form">Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-field">
                {MOTIVOS[tipo].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            Registrar movimiento
          </button>
        </form>

        {/* Historial */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Historial ({movimientos.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {movimientos.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    m.tipo === 'Entrada'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : m.tipo === 'Salida'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-blue-600/15 text-blue-400'
                  }`}
                >
                  {m.tipo === 'Entrada' ? <FiArrowDownCircle size={16} /> : m.tipo === 'Salida' ? <FiArrowUpCircle size={16} /> : <FiSliders size={16} />}
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold text-white">
                    {m.producto}{' '}
                    <span className={`ml-1 font-black ${m.cantidad >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.cantidad > 0 ? '+' : ''}
                      {m.cantidad}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.id} · {m.motivo} · {new Date(m.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                {m.estado === 'Pendiente' ? (
                  <button
                    onClick={() => validar(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/15 px-3.5 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white"
                  >
                    <FiCheckCircle size={13} /> Validar
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    Validado ✓
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
