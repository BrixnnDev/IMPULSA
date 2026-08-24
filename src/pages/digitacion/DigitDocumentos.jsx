import { useState } from 'react'
import { FiFolder, FiPlus, FiCheckCircle, FiX, FiFileText, FiClock } from 'react-icons/fi'

const TIPOS_DOC = ['PDF', 'Word', 'Excel', 'PowerPoint', 'Texto']

const seedDocumentos = [
  { id: 'DOC-0521', nombre: 'Contrato alquiler local', tipo: 'PDF', paginas: 4, fecha: new Date(Date.now() - 3600e3 * 6).toISOString(), estado: 'Firmado' },
  { id: 'DOC-0522', nombre: 'Inventario semanal', tipo: 'Excel', paginas: 1, fecha: new Date(Date.now() - 3600e3 * 2).toISOString(), estado: 'Borrador' },
  { id: 'DOC-0523', nombre: 'Carta recomendación — Ana Cárdenas', tipo: 'Word', paginas: 1, fecha: new Date().toISOString(), estado: 'Finalizado' },
]

const ESTADO_STYLES = {
  Borrador: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  Finalizado: 'bg-blue-600/15 text-blue-400 ring-blue-500/30',
  Firmado: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
}

const TIPO_ICONS = {
  PDF: 'bg-red-500/15 text-red-400',
  Word: 'bg-blue-500/15 text-blue-400',
  Excel: 'bg-emerald-500/15 text-emerald-400',
  PowerPoint: 'bg-orange-500/15 text-orange-400',
  Texto: 'bg-slate-500/15 text-slate-400',
}

const emptyForm = { nombre: '', tipo: 'PDF', paginas: '' }

export default function DigitDocumentos() {
  const [documentos, setDocumentos] = useState(seedDocumentos)
  const [form, setForm] = useState(emptyForm)
  const [ok, setOk] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const agregar = (e) => {
    e.preventDefault()
    const doc = {
      id: `DOC-${524 + documentos.length}`,
      nombre: form.nombre,
      tipo: form.tipo,
      paginas: Number(form.paginas) || 1,
      fecha: new Date().toISOString(),
      estado: 'Borrador',
    }
    setDocumentos((prev) => [doc, ...prev])
    setOk(`Documento "${doc.nombre}" registrado como borrador.`)
    setForm(emptyForm)
    setTimeout(() => setOk(''), 4000)
  }

  const avanzarEstado = (id) => {
    setDocumentos((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const siguiente = d.estado === 'Borrador' ? 'Finalizado' : d.estado === 'Finalizado' ? 'Firmado' : d.estado
        return { ...d, estado: siguiente }
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiFolder size={20} />
          </span>
          Documentos
        </h2>
        <p className="mt-1 text-sm text-slate-400">Gestiona los documentos del sistema.</p>
      </div>

      {ok && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          <FiCheckCircle size={18} /> {ok}
          <button onClick={() => setOk('')} className="ml-auto text-emerald-300/70 hover:text-emerald-200">
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        {/* Formulario */}
        <form onSubmit={agregar} className="panel h-fit space-y-4 p-6 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40">
              <FiFileText size={18} />
            </span>
            <h3 className="font-bold text-white">Nuevo documento</h3>
          </div>

          <div>
            <label className="label-form">Nombre *</label>
            <input name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Ej. Acta compromiso" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="input-field">
                {TIPOS_DOC.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Páginas</label>
              <input name="paginas" type="number" min="1" value={form.paginas} onChange={handleChange} placeholder="1" className="input-field" />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            <FiPlus /> Registrar documento
          </button>
        </form>

        {/* Lista */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Documentos ({documentos.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {[...documentos].reverse().map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {d.id}
                </span>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TIPO_ICONS[d.tipo] || TIPO_ICONS.Texto}`}>
                  <FiFileText size={18} />
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="truncate text-sm font-semibold text-white">{d.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {d.tipo} · {d.paginas} pág. · {new Date(d.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[d.estado]}`}>
                  {d.estado !== 'Firmado' && <FiClock size={11} className="mr-1 inline" />}
                  {d.estado}
                </span>
                {d.estado !== 'Firmado' && (
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
