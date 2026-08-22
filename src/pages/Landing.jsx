import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiCheckCircle,
  FiBox,
  FiShoppingCart,
  FiBarChart2,
  FiZap,
  FiLock,
  FiPlus,
  FiSmartphone,
  FiMonitor,
  FiHome,
  FiGrid,
  FiLayers,
  FiMail,
  FiGlobe,
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiTag,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi'
import { FaStar, FaGooglePlay, FaApple, FaQuoteLeft } from 'react-icons/fa'
import { MdOutlineInventory2 } from 'react-icons/md'

const pasosYFunciones = [
  { icon: FiDollarSign, title: 'Controla tu flujo de caja', desc: 'Registra ventas y gastos fácilmente y mantén tus finanzas claras todos los días.', accent: 'bg-blue-600/15 text-blue-400 ring-blue-500/30' },
  { icon: MdOutlineInventory2, title: 'Gestiona tu inventario', desc: 'Conoce qué productos rotan más, evita pérdidas y pide a tiempo lo necesario.', accent: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/30' },
  { icon: FiSmartphone, title: 'Accede desde cualquier dispositivo', desc: 'Administra tu negocio desde el celular o computador, estés donde estés, sin complicaciones.', accent: 'bg-violet-500/15 text-violet-400 ring-violet-500/30' },
  { icon: FiBarChart2, title: 'Toma decisiones con datos reales', desc: 'Revisa estadísticas claras y reportes automáticos que muestran cómo hacer crecer tu negocio.', accent: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  { icon: FiUsers, title: 'Maneja clientes, proveedores y empleados', desc: 'Organiza contactos, controla pagos pendientes y fortalece relaciones clave en un solo lugar.', accent: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  { icon: FiFileText, title: 'Formaliza tu negocio', desc: 'Genera comprobantes fácilmente y cumple con requisitos legales para crecer con confianza y respaldo.', accent: 'bg-rose-500/15 text-rose-400 ring-rose-500/30' },
]

const PERIODOS = [
  { key: 'mensual', label: 'Mensual', desc: '', factor: 1, nota: 'facturación mensual' },
  { key: 'trimestral', label: 'Trimestral', desc: '-10%', factor: 0.9, nota: 'facturado cada 3 meses' },
  { key: 'anual', label: 'Anual', desc: '-25%', factor: 0.75, nota: 'facturado anualmente' },
]

const PLANES = [
  {
    nombre: 'Gratis',
    base: 0,
    desc: 'Para empezar a digitalizar tu negocio',
    features: ['1 usuario', 'Hasta 30 productos', 'Ventas básicas', 'Soporte por correo'],
    cta: 'Empezar gratis',
  },
  {
    nombre: 'Emprendedor',
    base: 29,
    desc: 'Para negocios que están creciendo',
    popular: true,
    features: ['Hasta 3 usuarios', 'Productos ilimitados', 'POS completo + inventario', 'Reportes en tiempo real', 'Gestión de clientes'],
    cta: 'Probar 14 días gratis',
  },
  {
    nombre: 'Profesional',
    base: 59,
    desc: 'Para negocios que quieren escalar',
    features: ['Usuarios ilimitados', 'Multi-sucursal', 'Facturación electrónica', 'Digitación avanzada de catálogo', 'Soporte prioritario 24/7'],
    cta: 'Hablar con ventas',
  },
]

const TESTIMONIOS = [
  {
    texto: 'Con StockFlow pude organizar mis ventas y ahora facturo 40% más que antes. Es súper fácil de usar.',
    nombre: 'María González',
    negocio: 'Panadería Don Pepe',
    ciudad: 'Bogotá',
    resultado: 'Aumentó ventas 40%',
    iniciales: 'MG',
  },
  {
    texto: 'Antes perdía muchas ventas por no controlar el inventario. Ahora sé exactamente qué tengo y qué necesito.',
    nombre: 'Carlos Rodríguez',
    negocio: 'Ferretería El Martillo',
    ciudad: 'Medellín',
    resultado: 'Redujo pérdidas 60%',
    iniciales: 'CR',
  },
  {
    texto: 'StockFlow me ayudó a entender cuáles servicios me dan más ganancia. Ahora puedo planificar mejor mi negocio.',
    nombre: 'Ana Herrera',
    negocio: 'Salón de Belleza Glamour',
    ciudad: 'Cali',
    resultado: 'Mejoró rentabilidad 35%',
    iniciales: 'AH',
  },
]

const steps = [
  { n: '01', t: 'Crea tu cuenta', d: 'Regístrate gratis con tu nombre y correo.' },
  { n: '02', t: 'Elige tu perfil', d: 'Selecciona entre Digitación o POS al entrar.' },
  { n: '03', t: 'Empieza a gestionar', d: 'Accede al dashboard diseñado para tu flujo.' },
]

const PALABRAS = ['Facturación', 'Gestión', 'Digitación']
const INTERVALO_PALABRA = 5000

export default function Landing() {
  const [indicePalabra, setIndicePalabra] = useState(0)
  const [periodo, setPeriodo] = useState('mensual')
  const [verNosotros, setVerNosotros] = useState(false)

  useEffect(() => {
    const id = setInterval(
      () => setIndicePalabra((i) => (i + 1) % PALABRAS.length),
      INTERVALO_PALABRA,
    )
    return () => clearInterval(id)
  }, [])

  const palabra = PALABRAS[indicePalabra]

  return (
    <div className="min-h-screen bg-night-950 text-slate-200">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
              S
            </span>
            <span className="text-lg font-bold tracking-tight text-white">StockFlow</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            <Link to="/" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiHome size={15} /> Inicio
            </Link>
            <a href="#funciones" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiGrid size={15} /> Funciones
            </a>
            <a href="#precios" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiTag size={15} /> Precios
            </a>
            <a href="#como-funciona" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiLayers size={15} /> Cómo funciona
            </a>
            <a href="#contacto" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiMail size={15} /> Contacto
            </a>
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

      {/* Hero: Sistema de Facturación */}
      <section className="relative overflow-hidden">
        {/* Línea de luz superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        {/* Cuadrícula blueprint */}
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_70%_at_50%_35%,black_25%,transparent_80%)]" />
        <div className="bg-grid pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]" />

        {/* Orbes de luz */}
        <div className="animate-orb pointer-events-none absolute -top-40 left-1/3 h-[500px] w-[650px] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

        {/* Elementos flotantes decorativos */}
        <FiPlus className="animate-float pointer-events-none absolute left-[6%] top-28 hidden text-xl text-blue-500/50 lg:block" />
        <FiPlus className="animate-float pointer-events-none absolute left-[12%] bottom-24 hidden text-sm text-cyan-400/40 lg:block [animation-delay:1.5s]" />
        <FiPlus className="animate-float pointer-events-none absolute right-[7%] top-[420px] hidden text-base text-indigo-400/40 lg:block [animation-delay:3s]" />
        <span className="animate-float-alt pointer-events-none absolute right-[14%] top-24 hidden h-6 w-6 rounded-md border border-blue-500/40 lg:block" />
        <span className="animate-float-alt pointer-events-none absolute left-[8%] top-[380px] hidden h-9 w-9 rounded-lg border border-cyan-400/25 lg:block [animation-delay:2s]" />
        <span className="animate-orb pointer-events-none absolute right-[26%] top-16 hidden h-2 w-2 rounded-full bg-blue-400/70 shadow-[0_0_18px_4px_rgba(59,130,246,0.5)] lg:block" />
        <span className="animate-orb pointer-events-none absolute left-[24%] top-[520px] hidden h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_14px_3px_rgba(34,211,238,0.45)] lg:block [animation-delay:2.5s]" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {/* Contenedor 1: texto */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <FiZap className="text-blue-400" /> Gestión inteligente
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sistema de
              <span
                key={palabra}
                className="animate-word block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
              >
                {palabra}
              </span>
              <span className="block">para tu negocio</span>
            </h1>
            <p className="mt-5 text-lg font-semibold text-slate-200">
              Digitaliza tu negocio ¡De cero a StockFlow!
            </p>

            <ul className="mt-7 space-y-3.5">
              {[
                'Somos la plataforma más fácil e intuitiva',
                'Úsalo desde el celular y computador',
                'Conoce las estadísticas de tu negocio en tiempo real',
              ].map((t, i) => (
                <li key={t} className="flex items-start justify-center gap-3 text-slate-300 lg:justify-start">
                  <FiCheckCircle
                    className={`mt-0.5 shrink-0 text-lg ${i === 1 ? 'text-cyan-400' : 'text-blue-400'}`}
                  />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/registro" className="glow-blue btn-primary px-8 py-3.5">
                Prueba ya <FiArrowRight />
              </Link>
              <a href="#contacto" className="btn-ghost px-8 py-3.5">
                Contáctanos
              </a>
            </div>

            {/* Rating */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} size={16} className="text-amber-400" />
                ))}
              </div>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-300">
                <strong className="font-bold text-white">4.8 de 5</strong> en
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <FaGooglePlay className="text-emerald-400" /> Google Play
                </span>
                y
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <FaApple className="text-slate-100" /> App Store
                </span>
              </p>
            </div>

            {/* Estadísticas movidas a su propia sección más abajo */}
          </div>

          {/* Contenedor 2: laptop + celular */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="animate-orb pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[110px]" />

            {/* Laptop */}
            <div className="relative pr-12 pb-12 pt-4 sm:pr-20 sm:pb-16">
              <div className="panel overflow-hidden ring-1 ring-blue-500/25 shadow-2xl shadow-black/50">
                {/* Barra del navegador */}
                <div className="flex items-center gap-2 border-b border-white/5 bg-night-800 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 hidden h-5 flex-1 items-center rounded-md bg-night-700 px-3 text-[10px] text-slate-500 sm:flex">
                    stockflow.app/pos
                  </span>
                </div>
                {/* Pantalla dashboard */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden w-28 shrink-0 space-y-3 border-r border-white/5 bg-night-900 p-4 sm:block">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
                      S
                    </span>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-2.5 rounded-full ${i === 0 ? 'w-full bg-blue-500/60' : 'w-4/5 bg-white/10'}`} />
                    ))}
                  </div>
                  {/* Contenido */}
                  <div className="flex-1 space-y-3.5 p-5">
                    <div className="grid grid-cols-3 gap-2.5">
                      {['S/ 1,240', '+86', 'S/ 58'].map((v, i) => (
                        <div key={i} className="rounded-lg bg-night-800 p-2.5 ring-1 ring-white/5">
                          <div className="mb-1.5 h-1.5 w-3/4 rounded-full bg-white/10" />
                          <p className={`text-xs font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-300'}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    {/* Gráfico */}
                    <div className="flex h-28 items-end gap-2 rounded-lg bg-night-800 p-3 ring-1 ring-white/5">
                      {[35, 55, 40, 70, 52, 88, 64].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`flex-1 rounded-sm ${i === 5 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-600/40'}`}
                        />
                      ))}
                    </div>
                    {/* Filas */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="h-6 w-6 shrink-0 rounded-md bg-blue-600/20 ring-1 ring-blue-500/30" />
                        <span className="h-2 flex-1 rounded-full bg-white/10" />
                        <span className="h-2 w-10 rounded-full bg-emerald-400/40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Base del laptop */}
              <div className="relative -mx-6 mt-0 h-3 rounded-b-2xl bg-gradient-to-b from-slate-600/60 to-slate-800 shadow-xl sm:-mx-8">
                <div className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-lg bg-slate-900" />
              </div>

              {/* Celular */}
              <div className="absolute bottom-0 right-0 w-40 rotate-3 rounded-[1.9rem] border-[6px] border-slate-800 bg-night-900 shadow-2xl shadow-black/60 ring-1 ring-blue-500/30 sm:w-48">
                <div className="relative overflow-hidden rounded-[1.4rem]">
                  <div className="mx-auto mt-2 h-2 w-12 rounded-full bg-slate-700" />
                  <div className="space-y-2.5 p-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-2.5">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-blue-200">Ventas hoy</p>
                      <p className="text-base font-black text-white">S/ 1,240</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                        <div className="mb-1 h-1 w-3/4 rounded-full bg-white/10" />
                        <p className="text-[10px] font-bold text-emerald-400">+86</p>
                      </div>
                      <div className="rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                        <div className="mb-1 h-1 w-3/4 rounded-full bg-white/10" />
                        <p className="text-[10px] font-bold text-blue-400">S/ 58</p>
                      </div>
                    </div>
                    <div className="flex h-16 items-end gap-1.5 rounded-lg bg-night-800 p-2 ring-1 ring-white/5">
                      {[45, 70, 38, 85, 60].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`flex-1 rounded-sm ${i === 3 ? 'bg-cyan-400' : 'bg-blue-600/50'}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-around rounded-lg bg-night-800 py-2 ring-1 ring-white/5">
                      <FiShoppingCart size={14} className="text-blue-400" />
                      <FiBarChart2 size={14} className="text-slate-500" />
                      <FiSmartphone size={14} className="text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chips decorativos */}
            <span className="absolute -left-2 top-10 hidden items-center gap-1.5 rounded-full border border-white/10 bg-night-800/90 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur md:inline-flex">
              <FiMonitor className="text-blue-400" /> Web · POS
            </span>
            <span className="absolute right-2 top-2 hidden items-center gap-1.5 rounded-full border border-white/10 bg-night-800/90 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur md:inline-flex">
              <FiSmartphone className="text-cyan-400" /> Móvil · Ventas
            </span>
          </div>
        </div>
      </section>

      {/* Qué puedes hacer */}
      <section id="funciones" className="relative scroll-mt-20 overflow-hidden border-t border-white/5">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_65%_70%_at_50%_40%,black,transparent)]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <FiZap className="text-blue-400" /> Todo en un solo lugar
          </span>
          <h2 className="mt-5 text-center text-3xl font-bold text-white sm:text-4xl">
            ¿Qué puedes hacer con StockFlow?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Herramientas pensadas para que gestiones tu negocio completo sin salir de la plataforma.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pasosYFunciones.map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className="panel group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-600/10"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-600/0 blur-2xl transition duration-300 group-hover:bg-blue-600/15" />
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ring-1 ${accent}`}>
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-bold leading-snug text-white">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{desc}</p>
                <span className="mt-4 block h-1 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 opacity-40 transition-all duration-300 group-hover:w-16 group-hover:opacity-100" />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/registro" className="glow-blue btn-primary mx-auto px-10 py-4 text-base">
              Regístrate ahora <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="relative scroll-mt-20 overflow-hidden border-t border-white/5">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black_45%,transparent)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-600/10 blur-[110px]" />

        {/* Triángulos decorativos */}
        <svg className="animate-float pointer-events-none absolute left-[7%] top-28 hidden h-12 w-12 text-blue-500/35 lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
        </svg>
        <svg className="animate-float pointer-events-none absolute left-[16%] top-[62%] hidden h-8 w-8 text-cyan-400/30 lg:block [animation-delay:1.8s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
        </svg>
        <svg className="animate-float pointer-events-none absolute right-[9%] top-32 hidden h-9 w-9 text-indigo-400/35 lg:block [animation-delay:2.6s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
        </svg>
        <svg className="animate-float pointer-events-none absolute bottom-[18%] right-[15%] hidden h-11 w-11 text-blue-400/25 lg:block [animation-delay:3.5s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 4 L21 20 L3 20 Z" strokeLinejoin="round" />
        </svg>
        <span className="animate-float-alt pointer-events-none absolute right-[22%] top-14 hidden h-16 w-16 bg-gradient-to-br from-blue-600/25 to-transparent lg:block [clip-path:polygon(50%_0,100%_100%,0_100%)] [animation-delay:1s]" />
        <span className="animate-float-alt pointer-events-none absolute bottom-[12%] left-[24%] hidden h-10 w-10 rotate-180 bg-gradient-to-tl from-cyan-500/25 to-transparent lg:block [clip-path:polygon(50%_0,100%_100%,0_100%)] [animation-delay:2.2s]" />
        <span className="animate-orb pointer-events-none absolute left-[45%] top-[88%] hidden h-3 w-3 bg-blue-400/60 lg:block [clip-path:polygon(50%_0,100%_100%,0_100%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Empieza en minutos</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            Tres pasos simples y estarás gestionando tu negocio.
          </p>

          <div className="relative mt-16">
            {/* Línea conectora entre pasos */}
            <div className="absolute left-[16.7%] right-[16.7%] top-8 hidden h-px md:block">
              <div className="h-px w-full bg-white/10" />
              <div className="animate-flow absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.9),transparent)]" />
            </div>

            <div className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-8">
              {steps.map(({ n, t, d }, i) => (
                <div key={n} className="group relative flex flex-col items-center text-center">
                  {/* Círculo con número */}
                  <div
                    className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-night-850 text-lg font-black shadow-lg shadow-black/50 ring-2 transition duration-300 group-hover:scale-110 ${
                      i === 1
                        ? 'text-cyan-300 ring-cyan-400/70 shadow-[0_0_30px_-6px_rgba(34,211,238,0.55)]'
                        : 'text-blue-300 ring-blue-500/70 shadow-[0_0_30px_-6px_rgba(59,130,246,0.55)]'
                    }`}
                  >
                    {n}
                    <span className={`absolute -inset-1.5 -z-10 rounded-full opacity-40 blur-md transition duration-300 group-hover:opacity-90 ${i === 1 ? 'bg-cyan-500/30' : 'bg-blue-600/30'}`} />
                  </div>

                  {/* Tarjeta del paso */}
                  <div className={`panel mt-7 w-full p-7 transition duration-300 group-hover:-translate-y-1.5 ${i === 1 ? 'ring-1 ring-blue-500/30' : ''}`}>
                    <FiCheckCircle className={`mx-auto text-2xl ${i === 1 ? 'text-cyan-400' : 'text-blue-400'}`} />
                    <h3 className="mt-4 text-lg font-bold text-white">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planes y precios */}
      <section id="precios" className="relative scroll-mt-20 overflow-hidden border-t border-white/5">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Planes y precios</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            Elige el plan que mejor se ajuste a las necesidades de tu negocio.
          </p>

          {/* Toggle de período */}
          <div className="mt-9 flex justify-center">
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-night-850 p-1.5">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-6 ${
                    periodo === p.key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                  {p.desc && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        periodo === p.key ? 'bg-cyan-400 text-night-900' : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                      }`}
                    >
                      {p.desc}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjetas de planes */}
          <div className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {PLANES.map((plan) => {
              const per = PERIODOS.find((p) => p.key === periodo)
              const precio = Math.round(plan.base * per.factor)
              return (
                <div
                  key={plan.nombre}
                  className={`panel relative flex flex-col p-8 transition duration-300 hover:-translate-y-1.5 ${
                    plan.popular
                      ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-600/20 lg:-my-3 lg:py-11'
                      : 'hover:border-blue-500/30'
                  }`}
                >
                  {plan.popular && (
                    <span className="glow-blue absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-white">
                      Más popular
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-white">{plan.nombre}</h3>
                  <p className="mt-1 text-sm text-slate-400">{plan.desc}</p>

                  <div className="mt-6 flex items-end gap-2">
                    {per.factor < 1 && plan.base > 0 && (
                      <span className="mb-2 text-sm font-semibold text-slate-500 line-through">S/ {plan.base}</span>
                    )}
                    <span className="text-5xl font-black tracking-tight text-white">
                      S/ {precio}
                    </span>
                    <span className="mb-1.5 text-sm text-slate-400">/mes</span>
                  </div>
                  <p className="mt-1 h-4 text-xs text-slate-500">{plan.base > 0 ? per.nota : 'para siempre'}</p>

                  <ul className="mt-7 space-y-3 border-t border-white/5 pt-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <FiCheckCircle className="mt-0.5 shrink-0 text-blue-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/registro"
                    className={`mt-8 w-full py-3 ${plan.popular ? 'btn-primary glow-blue' : 'btn-ghost'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Todos los planes incluyen actualizaciones gratis. Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* Casos de éxito */}
      <section id="testimonios" className="relative scroll-mt-20 overflow-hidden border-t border-white/5">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_65%_75%_at_50%_50%,black,transparent)]" />
        <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Casos de éxito reales</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            Miles de emprendedores ya transformaron sus negocios con StockFlow
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIOS.map(({ texto, nombre, negocio, ciudad, resultado, iniciales }) => (
              <div
                key={nombre}
                className="panel group relative flex flex-col p-7 transition duration-300 hover:-translate-y-1.5 hover:border-blue-500/40"
              >
                <FaQuoteLeft className="text-2xl text-blue-500/50 transition group-hover:text-blue-400" />
                <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-300">“{texto}”</p>

                <div className="mt-7 border-t border-white/5 pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-black text-blue-300 ring-1 ring-blue-500/40">
                      {iniciales}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{nombre}</p>
                      <p className="truncate text-xs text-slate-400">{negocio} · {ciudad}</p>
                    </div>
                  </div>
                  <span className="mt-4 inline-block w-full rounded-xl bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                    ↑ {resultado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section id="nosotros" className="relative scroll-mt-20 overflow-hidden border-t border-white/5">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          {/* Contenedor 1: imagen */}
          <div className="relative order-2 lg:order-1">
            <div className="animate-orb pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[100px]" />

            <div className="panel relative overflow-hidden p-6 ring-1 ring-blue-500/25 sm:p-8">
              {/* Tarjeta principal */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-night-800 p-8 text-center shadow-2xl shadow-blue-900/50">
                <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
                <span className="animate-orb pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/25 blur-2xl" />
                <div className="relative">
                  <span className="glow-blue mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-700">
                    S
                  </span>
                  <p className="mt-4 text-xl font-black tracking-tight text-white">StockFlow</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Facturación · Gestión · Digitación
                  </p>
                </div>
              </div>

              {/* Tira de mini-tarjetas */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: FiShoppingCart, label: 'Ventas' },
                  { icon: FiBox, label: 'Inventario' },
                  { icon: FiFileText, label: 'Facturas' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-night-800 py-4 transition hover:border-blue-500/40">
                    <Icon size={18} className="text-blue-400" />
                    <span className="text-[11px] font-semibold text-slate-300">{label}</span>
                  </div>
                ))}
              </div>

              {/* Chips flotantes */}
              <span className="absolute -right-3 top-16 hidden rotate-3 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-night-850 px-3.5 py-2 text-xs font-bold text-emerald-400 shadow-xl md:inline-flex">
                <FiTrendingUp /> Ventas ↑ 40%
              </span>
              <span className="absolute -left-3 bottom-14 hidden -rotate-3 items-center gap-1.5 rounded-xl border border-blue-500/30 bg-night-850 px-3.5 py-2 text-xs font-bold text-blue-300 shadow-xl md:inline-flex">
                <FiCheckCircle /> Stock al día
              </span>
            </div>
          </div>

          {/* Contenedor 2: sobre el negocio */}
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <FiUsers className="text-blue-400" /> Sobre nosotros
            </span>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              El aliado digital de tu{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                negocio
              </span>
            </h2>

            <p className="mt-5 leading-relaxed text-slate-400">
              En <strong className="text-slate-200">StockFlow</strong> creemos que todo emprendedor,
              sin importar el tamaño de su negocio, merece herramientas profesionales.
              Por eso creamos una plataforma simple para facturar, vender y controlar tu inventario
              desde donde estés.
            </p>
            <p className="mt-3 leading-relaxed text-slate-400">
              Nuestro equipo combina experiencia en retail y tecnología para acompañarte
              en cada paso del crecimiento de tu negocio.
            </p>

            {verNosotros && (
              <div className="panel mt-5 space-y-3 p-5 text-sm leading-relaxed text-slate-300 ring-1 ring-blue-500/25 animate-word">
                <p>
                  <strong className="text-blue-300">Nuestra misión:</strong> digitalizar el comercio
                  local de América Latina, haciendo que gestionar un negocio sea tan fácil como usar el celular.
                </p>
                <p>
                  <strong className="text-blue-300">Nuestra visión:</strong> ser la plataforma de gestión
                  n.º 1 de los emprendedores, presente en cada tienda, bodega y negocio del continente.
                </p>
              </div>
            )}

            <ul className="mt-6 space-y-2.5">
              {['Equipo con experiencia en retail y tecnología', 'Soporte en español y cerca de ti', 'Mejora continua gracias a tus comentarios'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-cyan-400" />
                  {t}
                </li>
              ))}
            </ul>

            <button onClick={() => setVerNosotros(!verNosotros)} className="btn-primary mt-8">
              {verNosotros ? 'Mostrar menos' : 'Quiénes somos'} <FiArrowRight className={`transition ${verNosotros ? '-rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section id="estadisticas" className="relative scroll-mt-20 border-t border-white/5">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
        <div className="pointer-events-none absolute left-1/4 top-0 h-56 w-56 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Negocios que confían en StockFlow
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-400">
            Miles de emprendedores ya digitalizaron su negocio con nosotros.
          </p>

          <div className="panel mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4">
            {[
              { icon: FiShoppingCart, valor: '+7.000.000', label: 'negocios usan StockFlow', color: 'text-blue-400' },
              { icon: FiGlobe, valor: '+21', label: 'países con presencia', color: 'text-cyan-400' },
              { icon: FiStar, valor: '4.8 / 5', label: 'valoración en tiendas', color: 'text-amber-400' },
              { icon: FiZap, valor: '99.9%', label: 'disponibilidad garantizada', color: 'text-emerald-400' },
            ].map(({ icon: Icon, valor, label, color }) => (
              <div key={label} className="group flex flex-col items-center gap-1 border-white/5 px-4 py-7 text-center transition odd:border-r even:border-r lg:border-r lg:last:border-r-0 hover:bg-blue-600/5">
                <Icon size={18} className={`${color} transition group-hover:scale-110`} />
                <p className={`mt-1 text-xl font-black tracking-tight text-white sm:text-2xl ${color}`}>{valor}</p>
                <p className="text-[11px] leading-tight text-slate-400 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden border-t border-white/5">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[150px]" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <div className="relative mx-auto max-w-4xl py-6 sm:py-10">
            {/* Fondo de cuadraditos */}
            <div className="bg-grid pointer-events-none absolute -inset-x-10 -inset-y-8 opacity-90 [mask-image:radial-gradient(ellipse_72%_72%_at_50%_45%,black_25%,transparent_82%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[110px]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rotate-12 rounded-3xl bg-gradient-to-br from-blue-600/25 to-transparent blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 -rotate-12 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-transparent blur-2xl" />
            <span className="animate-float-alt pointer-events-none absolute left-[6%] top-8 hidden h-9 w-9 border border-cyan-400/25 lg:block [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-blue-500/10" />
            <span className="animate-float-alt pointer-events-none absolute bottom-6 right-[5%] hidden h-11 w-11 border border-blue-400/25 lg:block [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-blue-500/10 [animation-delay:2s]" />

            <div className="relative">
              {/* Avatares de la comunidad */}
              <div className="mx-auto flex w-fit items-center">
                {['MG', 'CR', 'AH', 'JL', '＋'].map((ini, i) => (
                  <span
                    key={i}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black ring-2 ring-night-800 ${
                      ini === '＋'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-night-600 to-night-700 text-slate-200'
                    } ${i > 0 ? '-ml-3' : ''}`}
                  >
                    {ini}
                  </span>
                ))}
              </div>

              <h2 className="mt-7 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Únete a la comunidad de{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  más de 7 millones de empresarios
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-slate-400">
                Descubre en StockFlow el aliado para la gestión de tu negocio y la forma
                más simple de controlar tu inventario y tus ventas.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/registro" className="btn-primary glow-blue px-10 py-4 text-base">
                  Regístrate ahora <FiArrowRight />
                </Link>
                <a href="#precios" className="btn-ghost px-8 py-4 text-base">
                  Ver planes
                </a>
              </div>

              {/* Chips de confianza */}
              <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
                  <span className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} size={11} />
                    ))}
                  </span>
                  4.8 de 5
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
                  <FiShoppingCart size={13} className="text-blue-400" /> +7.000.000 negocios
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
                  <FiGlobe size={13} className="text-cyan-400" /> +21 países
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-white/5 bg-night-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
              S
            </span>
            <span>© 2026 StockFlow · Gestión de Inventario & POS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiLock size={14} /> Acceder
            </Link>
            <Link to="/registro" className="flex items-center gap-1.5 transition hover:text-blue-400">
              <FiShoppingCart size={14} /> Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
