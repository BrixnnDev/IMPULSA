import { useState } from 'react'
import { FiImage, FiPlus, FiCheckCircle, FiX, FiDownload } from 'react-icons/fi'

const seedImagenes = [
  { id: 'IMG-0341', nombre: 'Fotografía producto — Leche Gloria', formato: 'JPG', peso: '1.2 MB', fecha: new Date(Date.now() - 3600e3 * 3).toISOString(), estado: 'Optimizada' },
  { id: 'IMG-0342', nombre: 'Banner promo junio', formato: 'PNG', peso: '860 KB', fecha: new Date(Date.now() - 3600e3 * 5).toISOString(), estado: 'Original' },
  { id: 'IMG-0343', nombre: 'Escaneo carnet anverso', formato: 'PNG', peso: '420 KB', fecha: new Date().toISOString(), estado: 'Original' },
]

const ESTADO_STYLES = {
  Optimizada: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  Original: 'bg-blue-600/15 text-blue-400 ring-blue-500/30',
}

const FORMAT_COLORS = {
  JPG: 'bg-amber-500/15 text-amber-400',
  PNG: 'bg-violet-500/15 text-violet-400',
  WEBP: 'bg-cyan-500/15 text-cyan-400',
}

const emptyForm = { nombre: '', formato: 'JPG', peso: '' }

export default function DigitImagenes() {
  const [imagenes, setImagenes] = useState(seedImagenes)
  const [form, setForm] = useState(emptyForm)
  const [ok, setOk] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const agregar = (e) => {
    e.preventDefault()
    const img = {
      id: `IMG-${344 + imagenes.length}`,
      nombre: form.nombre,
      formato: form.formato,
      peso: form.peso ? `${form.peso} KB` : '—',
      fecha: new Date().toISOString(),
      estado: 'Original',
    }
    setImagenes((prev) => [img, ...prev])
    setOk(`Imagen "${img.nombre}" registrada.`)
    setForm(emptyForm)
    setTimeout(() => setOk(''), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <FiImage size={20} />
          </span>
          Imágenes
        </h2>
        <p className="mt-1 text-sm text-slate-400">Gestiona las imágenes del sistema.</p>
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
              <FiImage size={18} />
            </span>
            <h3 className="font-bold text-white">Registrar imagen</h3>
          </div>

          <div>
            <label className="label-form">Nombre *</label>
            <input name="nombre" required value={form.nombre} onChange={handleChange} placeholder="Ej. Banner feria" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-form">Formato</label>
              <select name="formato" value={form.formato} onChange={handleChange} className="input-field">
                {['JPG', 'PNG', 'WEBP'].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">Peso (KB)</label>
              <input name="peso" type="number" min="0" value={form.peso} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5">
            <FiPlus /> Registrar imagen
          </button>
        </form>

        {/* Galería */}
        <div className="panel overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <h3 className="font-bold text-white">Imágenes ({imagenes.length})</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {[...imagenes].reverse().map((img) => (
              <li key={img.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {img.id}
                </span>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${FORMAT_COLORS[img.formato] || 'bg-slate-500/15 text-slate-400'}`}>
                  <FiImage size={18} />
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="truncate text-sm font-semibold text-white">{img.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {img.formato} · {img.peso} · {new Date(img.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ESTADO_STYLES[img.estado]}`}>
                  {img.estado}
                </span>
                <button
                  title="Descargar"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-blue-400"
                >
                  <FiDownload size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
