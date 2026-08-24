import { useState } from 'react'
import { FiPrinter, FiPlus, FiCheckCircle, FiX, FiDollarSign, FiFileText, FiClock } from 'react-icons/fi'

const TIPOS_TRABAJO = ['Impresión B/N', 'Impresión a color', 'Fotocopias', 'Escaneo', 'Anillado']

const seedTrabajos = [
  { id: 'IMP-2041', cliente: 'María Fernanda Rojas', tipo: 'Impresión B/N', paginas: 5, monto: 2.5, fecha: new Date(Date.now() - 3600e3 * 3).toISOString(), estado: 'Pagado' },
  { id: 'IMP-2042', cliente: 'Carlos Andrés Peña', tipo: 'Fotocopias', paginas: 12, monto: 6.0, fecha: new Date(Date.now() - 3600e3 * 2).toISOString(), estado: 'Pagado' },
  { id: 'IMP-2043', cliente: 'Luisa Martínez', tipo: 'Impresión a color', paginas: 3, monto: 4.5, fecha: new Date(Date.now() - 3600e3).toISOString(), estado: 'Pendiente' },
  { id: 'IMP-2044', cliente: 'Jorge Iván Ramírez', tipo: 'Escaneo', paginas: 8, monto: 3.0, fecha: new Date().toISOString(), estado: 'Pendiente' },
]

const emptyForm = { cliente: '', tipo: TIPOS_TRABAJO[0], paginas: '', monto: '' }

export default function DigitHistorial() {
  const [trabajos, setTrabajos] = useState(seedTrabajos)
  const [form, setForm] = useState(emptyForm)
  const [ok, setOk] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const totalGanado = trabajos.filter((t) => t.estado === 'Pagado').reduce((a, t) => a + t.monto, 0)
  const totalPendiente = trabajos.filter((t) => t.estado === 'Pendiente').reduce((a, t) => a + t.monto, 0)

  const agregar = (e) => {
    e.preventDefault()
    const trabajo = {
      id: `IMP-${2045 + trabajos.length}`,
      cliente: form.cliente,
      tipo: form.tipo,
      paginas: Number(form.paginas) || 1,
      monto: Number(form.monto) || 0,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
    }
    setTrabajos((prev) => [trabajo, ...prev])
    setOk(`Valecito registrado: ${trabajo.id} — S/ ${trabajo.monto.toFixed(2)} por ${trabajo.tipo}.`)
    setForm(emptyForm)
    setTimeout(() => setOk(''), 4000)
  }

  const marcarPagado = (id) => {
    setTrabajos((prev) => prev.map((t) => (t.id === id ? { ...t, estado: 'Pagado' } : t)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiDollarSign size={20} />
          </span>
          Historial de impresión
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Registra cada trabajo realizado y coloca cuánto dinero te pagan por él (valecito).
        </p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} /> {ok}
          <button onClick={() => setOk('')} className="ml-auto text-emerald-300/70 hover:text-emerald-200">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Resumen de dinero */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="panel flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-lg text-blue-400 ring-1 ring-blue-500/40">
            <FiFileText />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trabajos registrados</p>
            <p className="text-2xl font-black text-white">{trabajos.length}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-lg text-emerald-400 ring-1 ring-emerald-500/40">
            <FiCheckCircle />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cobrado</p>
            <p className="text-2xl font-black text-emerald-400">S/ {totalGanado.toFixed(2)}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-lg text-amber-400 ring-1 ring-amber-500/40">
            <FiClock />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Por cobrar</p>
            <p className="text-2xl font-black text-amber-400">S/ {totalPendiente.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        {/* Formulario valecito */}
        <form onSubmit={agregar} className="panel h-fit space-y-4 p-6 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
              <FiPrinter size={18} />
            </span>
            <h3 className="font-bold text-white">Registrar trabajo + valecito</h3>
          </div>

          <div>
            <label className="label-form">Cliente / Persona *</label>
            <input name="cliente" required value={form.cliente} onChange={handleChange} placeholder="Ej. María Rojas" className="input-field" />
          </div>

          <div>
            <label className="label-form">Tipo de trabajo *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input-field">
              {TIPOS_TRABAJO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Páginas *</label>
              <input name="paginas" type="number" min="1" required value={form.paginas} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="label-form">Dinero (S/) *</label>
              <input
                name="monto"
                type="number"
                step="0.10"
                min="0"
                required
                value={form.monto}
                onChange={handleChange}
                placeholder="0.00"
                className="input-field !border-emerald-500/30 focus:!ring-emerald-500/30"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            <FiPlus /> Registrar y guardar valecito
          </button>
        </form>

        {/* Lista de trabajos con su dinero */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Trabajos y pagos ({trabajos.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {[...trabajos].reverse().map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {t.id}
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold text-white">{t.cliente}</p>
                  <p className="text-xs text-slate-500">
                    {t.tipo} · {t.paginas} pág. · {new Date(t.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-black text-emerald-400 ring-1 ring-emerald-500/30">
                  + S/ {t.monto.toFixed(2)}
                </span>
                {t.estado === 'Pendiente' ? (
                  <button
                    onClick={() => marcarPagado(t.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/15 px-3.5 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white"
                  >
                    <FiCheckCircle size={13} /> Cobrar
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    Pagado ✓
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
