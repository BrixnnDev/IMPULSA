import { useCallback, useEffect, useRef, useState } from 'react'
import { FiSend, FiMessageCircle, FiCheck } from 'react-icons/fi'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function DigitMensajes() {
  const { user } = useAuth()
  const [contactos, setContactos] = useState([])
  const [activo, setActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [textoBox, setTextoBox] = useState(0)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  const miId = user?.id || ''

  const cargarContactos = useCallback(async () => {
    if (!miId) return
    try {
      const r = await fetch(`${API}/api/mensajes/usuarios?de_user=${miId}`).then((res) => res.json())
      setContactos(Array.isArray(r) ? r : [])
    } catch {}
  }, [miId])

  const marcarLeido = useCallback(async (paraUser) => {
    if (!miId || !paraUser) return
    try {
      await fetch(`${API}/api/mensajes/leido`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ de_user: miId, para_user: paraUser }),
      })
    } catch {}
  }, [miId])

  const cargarConversacion = useCallback(async (paraUser) => {
    if (!miId || !paraUser) return
    try {
      const r = await fetch(`${API}/api/mensajes/conversacion?de_user=${miId}&para_user=${paraUser}`).then((res) => res.json())
      setMensajes(Array.isArray(r) ? r : [])
      marcarLeido(paraUser)
      setCargando(false)
    } catch {
      setCargando(false)
    }
  }, [miId, marcarLeido])

  useEffect(() => {
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    socketRef.current = s
    s.on('mensaje:new', (m) => {
      cargarContactos()
      if (activo && (m.de_user === activo || m.para_user === activo)) {
        cargarConversacion(activo)
        marcarLeido(activo)
      }
    })
    return () => s.close()
  }, [miId, activo, cargarContactos, cargarConversacion, marcarLeido])

  // Cargar contactos inicial
  useEffect(() => {
    cargarContactos()
    setCargando(false)
    const id = setInterval(cargarContactos, 5000)
    return () => clearInterval(id)
  }, [miId, cargarContactos])

  const abrirConversacion = (c) => {
    setActivo(c.id)
    setTexto('')
    cargarConversacion(c.id)
    marcarLeido(c.id)
  }

  const enviar = async (e) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t || !activo || !miId) return
    const temp = {
      id: `temp-${Date.now()}`,
      de_user: miId,
      para_user: activo,
      texto: t,
      fecha: new Date().toISOString(),
      leido: false,
    }
    setMensajes((prev) => [...prev, temp])
    setTexto('')
    setTextoBox((v) => v + 1)
    try {
      await fetch(`${API}/api/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ de_user: miId, para_user: activo, texto: t }),
      })
      cargarContactos()
      cargarConversacion(activo)
    } catch {}
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [mensajes, textoBox])

  const contactoActivo = contactos.find((c) => c.id === activo) || null

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <FiMessageCircle size={18} />
            </span>
            Mensajes
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Conversa con los usuarios de IMPULSA.</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[64px_1fr] gap-4 overflow-hidden">
        {/* Columna izquierda: solo avatares (tooltip con el nombre al pasar el cursor) */}
        <div className="panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-center border-b border-white/5 py-3">
            <FiMessageCircle size={16} className="text-emerald-400" />
          </div>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
            {cargando && <li className="py-3 text-center text-xs text-slate-500">…</li>}
            {!cargando && contactos.length === 0 && (
              <li className="px-1 py-3 text-center text-xs leading-relaxed text-slate-500">
                Sin
                <br />
                mensajes
              </li>
            )}
            {contactos.map((c) => {
              const inicial = (c.name || c.email || '?').charAt(0).toUpperCase()
              const activoClass = c.id === activo ? 'ring-2 ring-emerald-400' : 'ring-1 ring-white/10'
              return (
                <li key={c.id} className="relative">
                  <button
                    onClick={() => abrirConversacion(c)}
                    title={c.name || c.email}
                    className={`block w-full rounded-xl p-1 transition hover:bg-white/5 ${c.id === activo ? 'bg-white/10' : ''}`}
                  >
                    <span className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-black text-emerald-300 ${activoClass}`}>
                      {inicial}
                      {c.noLeidos > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-night-900">
                          {c.noLeidos}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Contenedor derecho: conversación tipo Messenger/WhatsApp */}
        <div className="panel flex min-h-0 flex-col overflow-hidden">
          {!contactoActivo ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/15 ring-1 ring-emerald-500/30">
                <FiMessageCircle size={30} className="text-emerald-400" />
              </span>
              <p className="font-bold text-white">Selecciona un contacto</p>
              <p className="max-w-[240px] text-xs text-slate-500">
                Elige un usuario de la lista izquierda para ver la conversación.
              </p>
            </div>
          ) : (
            <>
              {/* Encabezado del contacto */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-night-800 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  {contactoActivo.name?.charAt(0).toUpperCase() || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{contactoActivo.name || 'Usuario'}</p>
                  <p className="truncate text-xs text-slate-500">{contactoActivo.email}</p>
                </div>
              </div>

              {/* Mensajes */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-night-900 p-4">
                {mensajes.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                    Sin mensajes todavía. Empieza la conversación.
                  </div>
                )}
                {mensajes.map((m) => {
                  const mio = m.de_user === miId
                  return (
                    <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                      <span
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mio
                            ? 'rounded-br-md bg-emerald-600 text-white'
                            : 'rounded-bl-md bg-night-800 text-slate-200'
                        }`}
                      >
                        {m.texto}
                        <span className={`mt-0.5 block text-right text-[10px] ${mio ? 'text-white/60' : 'text-slate-500'}`}>
                          {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          {mio && <FiCheck size={10} className="ml-1 inline" />}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <form onSubmit={enviar} className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={`Mensaje para ${contactoActivo.name || 'usuario'}…`}
                  className="input-field !py-2.5"
                />
                <button type="submit" aria-label="Enviar" className="btn-primary !rounded-xl !p-3">
                  <FiSend size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
