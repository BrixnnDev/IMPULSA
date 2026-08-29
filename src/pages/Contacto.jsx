import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiSend, FiArrowLeft, FiMapPin, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import RocketLogo from '../components/RocketLogo'

const WHATSAPP = 'https://wa.me/51999999999'
const EMAIL = 'contacto@impulsa.app'

export default function Contacto() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const enviarMailto = (e) => {
    e.preventDefault()
    const asunto = encodeURIComponent(`Mensaje de ${form.nombre || 'Cliente IMPULSA'}`)
    const cuerpo = encodeURIComponent(
      `${form.mensaje}\n\n— ${form.nombre}${form.email ? ` (${form.email})` : ''}`
    )
    window.location.href = `mailto:${EMAIL}?subject=${asunto}&body=${cuerpo}`
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-night-950 via-night-950 to-night-900 text-slate-200">
      {/* Barra superior */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <RocketLogo size={20} />
          </span>
          <span className="text-base font-bold tracking-tight text-white">IMPULSA</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-blue-300"
        >
          <FiArrowLeft size={14} /> Volver al inicio
        </Link>
      </header>

      {/* Contenido centrado */}
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-6">
        <div className="grid w-full max-w-4xl gap-6 rounded-3xl border border-white/10 bg-night-800/60 p-6 shadow-2xl backdrop-blur sm:p-8 md:grid-cols-2">
          {/* Izquierda: canales */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Hablemos
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              ¿Tienes dudas, sugerencias o quieres activar IMPULSA en tu negocio? Escríbenos por
              cualquiera de estos canales.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <FaWhatsapp size={20} /> Chatea por WhatsApp
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
              >
                <FiMail size={18} /> {EMAIL}
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <FiPhone size={18} className="text-slate-400" /> +51 999 999 999
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <FiMapPin size={18} className="text-slate-400" /> Lima, Perú
              </div>
            </div>
          </div>

          {/* Derecha: formulario compacto */}
          <form onSubmit={enviarMailto} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white">Envíanos un mensaje</h2>
            <input
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-white/10 bg-night-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Tu correo"
              className="w-full rounded-xl border border-white/10 bg-night-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50"
            />
            <textarea
              name="mensaje"
              value={form.mensaje}
              onChange={onChange}
              placeholder="Escribe tu mensaje..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-night-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50"
            />
            <button
              type="submit"
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <FiSend size={16} /> Enviar mensaje
            </button>
          </form>
        </div>
      </main>

      {/* Crédito */}
      <footer className="flex items-center justify-center gap-x-2 gap-y-1 px-4 py-4 text-center text-xs text-slate-500">
        <RocketLogo size={14} />
        <span>© 2026 IMPULSA · Digitación & Gestión de Inventario</span>
        <span className="text-slate-600">·</span>
        <a
          href="https://brixnndev.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-400 transition hover:text-blue-400"
        >
          Creado por BRIXNNDEV
        </a>
      </footer>
    </div>
  )
}
