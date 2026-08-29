import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiSend, FiArrowLeft, FiMapPin, FiPhone, FiHome, FiGrid, FiTag, FiLayers, FiPlus } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import RocketLogo from '../components/RocketLogo'
import Footer from '../components/Footer'

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
    <div className="relative flex h-screen flex-col overflow-hidden bg-night-950 text-slate-200">
      {/* Decoraciones de fondo */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_35%,black_25%,transparent_80%)]" />
      <div className="animate-orb pointer-events-none absolute -top-40 left-1/3 h-[500px] w-[650px] rounded-full bg-blue-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
      <FiPlus className="animate-float pointer-events-none absolute left-[6%] top-28 hidden text-xl text-blue-500/50 lg:block" />
      <FiPlus className="animate-float pointer-events-none absolute left-[12%] bottom-24 hidden text-sm text-cyan-400/40 lg:block [animation-delay:1.5s]" />
      <span className="animate-float-alt pointer-events-none absolute right-[14%] top-24 hidden h-6 w-6 rounded-md border border-blue-500/40 lg:block" />
      <span className="animate-float-alt pointer-events-none absolute left-[8%] top-[380px] hidden h-9 w-9 rounded-lg border border-cyan-400/25 lg:block [animation-delay:2s]" />
      <span className="animate-orb pointer-events-none absolute right-[26%] top-16 hidden h-2 w-2 rounded-full bg-blue-400/70 shadow-[0_0_18px_4px_rgba(59,130,246,0.5)] lg:block" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <RocketLogo size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">IMPULSA</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            <Link to="/#inicio" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiHome size={15} /> Inicio
            </Link>
            <Link to="/#funciones" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiGrid size={15} /> Funciones
            </Link>
            <Link to="/#precios" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiTag size={15} /> Precios
            </Link>
            <Link to="/#como-funciona" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiLayers size={15} /> Cómo funciona
            </Link>
            <Link to="/contacto" className="flex items-center gap-1.5 text-blue-400">
              <FiMail size={15} /> Contacto
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-6">
            <Link to="/login" className="btn-ghost !px-4 !py-2">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="btn-primary !px-4 !py-2">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido centrado */}
      <main className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-6">
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

      <Footer />
    </div>
  )
}
