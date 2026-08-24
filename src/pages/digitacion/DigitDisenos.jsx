import { useState } from 'react'
import { FiPenTool, FiPlus, FiCheckCircle, FiX, FiClock } from 'react-icons/fi'

const TIPOS_DISENO = ['Logo / Marca', 'Flyer publicitario', 'Tarjeta de presentación', 'Certificado', 'Cartel / Afiche', 'Otro documento']

const seedDisenos = [
  { id: 'DIS-0112', titulo: 'Logo — Panadería Don Pepe', tipo: 'Logo / Marca', cliente: 'Jorge Ramírez', fecha: new Date(Date.now() - 3600e3 * 4).toISOString(), estado: 'Entregado' },
  { id: 'DIS-0113', titulo: 'Flyer promoción junio', tipo: 'Flyer publicitario', cliente: 'María González', fecha: new Date(Date.now() - 3600e3 * 2).toISOString(), estado: 'En proceso' },
  { id: 'DIS-0114', titulo: 'Certificados curso de ventas', tipo: 'Certificado', cliente: 'Academia Central', fecha: new Date().toISOString(), estado: 'Pendiente' },
]

const ESTADO_STYLES = {
  Entregado: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  'En proceso': 'bg-blue-600/15 text-blue-400 ring-blue-500/30',
  Pendiente: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
}

const emptyForm = { titulo: '', tipo: TIPOS_DISENO[0], cliente: '' }

export default function DigitDisenos() {
  const [disenos, setDisenos] = useState(seedDisenos)
  const [form, setForm] = useState(emptyForm)
  const [ok, setOk] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const agregar = (e) => {
    e.preventDefault()
    const diseno = {
      id: `DIS-${115 + disenos.length}`,
      titulo: form.titulo,
      tipo: form.tipo,
      cliente: form.cliente,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
    }
    setDisenos((prev) => [diseno, ...prev])
    setOk(`Diseño "${diseno.titulo}" registrado como pendiente.`)
    setForm(emptyForm)
    setTimeout(() => setOk(''), 4000)
  }

  const avanzarEstado = (id) => {
    setDisenos((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const siguiente = d.estado === 'Pendiente' ? 'En proceso' : d.estado === 'En proceso' ? 'Entregado' : d.estado
        return { ...d, estado: siguiente }
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiPenTool size={20} />
          </span>
          Diseños
        </h2>
        <p className="mt-1 text-sm text-slate-400">Gestiona los diseños gráficos elaborados.</p>
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
        <form onSubmit={agregar} className="panel h-fit space-y-4 p-6 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
              <FiPenTool size={18} />
            </span>
            <h3 className="font-bold text-white">Nuevo diseño o documento</h3>
          </div>

          <div>
            <label className="label-form">Título *</label>
            <input name="titulo" required value={form.titulo} onChange={handleChange} placeholder="Ej. Logo ferretería" className="input-field" />
          </div>

          <div>
            <label className="label-form">Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input-field">
              {TIPOS_DISENO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-form">Cliente</label>
            <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Opcional" className="input-field" />
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            <FiPlus /> Registrar diseño
          </button>
        </form>

        {/* Lista */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Diseños ({disenos.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {[...disenos].reverse().map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {d.id}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-400">
                  <FiPenTool size={15} />
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className="truncate text-sm font-semibold text-white">{d.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {d.tipo}
                    {d.cliente ? ` · ${d.cliente}` : ''} · {new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[d.estado]}`}>
                  {d.estado !== 'Entregado' && <FiClock size={11} className="mr-1 inline" />}
                  {d.estado}
                </span>
                {d.estado !== 'Entregado' && (
                  <button
                    onClick={() => avanzarEstado(d.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/15 px-3.5 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white"
                  >
                    Avanzar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
