import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiSend, FiMessageCircle, FiCheck, FiArrowLeft, FiPaperclip, FiSmile, FiFileText,
  FiDownload, FiImage, FiVideo, FiMusic, FiUser,
} from 'react-icons/fi'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😅', '🙌',
  '👍', '👏', '🙏', '🔥', '❤️', '💚', '🎉', '✨', '😢', '😭',
  '😡', '😴', '🤝', '✅', '📄', '📌', '💡', '⏰', '📎', '🖨️',
]

const STICKERS = [
  '😂', '😍', '🥳', '😎', '🤩', '😴', '👍', '🙏', '🔥', '💯',
  '🎉', '❤️', '😭', '🤯', '🤝', '✨', '🐶', '🍕', '☕', '⚽',
]

const ROL_LABEL = {
  admin: 'Administrador',
  moderador: 'Moderador',
  digitador: 'Digitación',
  pos: 'POS · Vendedor',
}

function parseMensaje(texto) {
  if (typeof texto === 'string' && texto.startsWith('[[sticker]]')) {
    return { tipo: 'sticker', valor: texto.slice(11) }
  }
  if (typeof texto === 'string' && texto.startsWith('[[file]]')) {
    try {
      return { tipo: 'file', ...JSON.parse(texto.slice(8)) }
    } catch {
      return { tipo: 'texto', valor: texto }
    }
  }
  return { tipo: 'texto', valor: texto }
}

const preview = (texto) => {
  if (!texto) return ''
  const p = parseMensaje(texto)
  if (p.tipo === 'sticker') return `${p.valor} Sticker`
  if (p.tipo === 'file') return `📎 ${p.name || 'Archivo'}`
  return p.valor
}

const iconoArchivo = (mime = '') => {
  if (mime.startsWith('image/')) return 'Imagen'
  if (mime.startsWith('video/')) return 'Video'
  if (mime.startsWith('audio/')) return 'Audio'
  return 'Documento'
}

const formatoPeso = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Avatar reutilizable: muestra la foto si existe o la inicial.
function Avatar({ u, className = 'h-11 w-11', textClass = 'text-base', dot = null }) {
  const inicial = (u?.name || u?.email || '?').charAt(0).toUpperCase()
  return (
    <span className={`relative flex shrink-0 items-center justify-center rounded-full bg-emerald-600/20 font-black text-emerald-300 ring-1 ring-white/10 ${className}`}>
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        {u?.avatar_url ? (
          <img src={u.avatar_url} alt={u.name || 'Usuario'} className="h-full w-full object-cover" />
        ) : (
          <span className={textClass}>{inicial}</span>
        )}
      </span>
      {dot !== null && (
        <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-night-900 ${dot ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      )}
    </span>
  )
}

export default function DigitMensajes() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [online, setOnline] = useState([])
  const [convs, setConvs] = useState([])
  const [activo, setActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [textoBox, setTextoBox] = useState(0)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [emojiTab, setEmojiTab] = useState('emojis')
  const [adjuntarOpen, setAdjuntarOpen] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [perfilUsuario, setPerfilUsuario] = useState(null)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)
  const activoRef = useRef(null)
  const fileRef = useRef(null)

  const miId = user?.id || ''

  // Todos los usuarios registrados (excepto yo) para el contenedor izquierdo.
  const cargarUsuarios = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/users/list`).then((res) => res.json())
      const arr = Array.isArray(r) ? r : []
      setUsuarios(arr.filter((u) => u.id !== miId))
      setCargando(false)
    } catch {
      setCargando(false)
    }
  }, [miId])

  // Conversaciones existentes: último mensaje y no leídos.
  const cargarConvs = useCallback(async () => {
    if (!miId) return
    try {
      const r = await fetch(`${API}/api/mensajes/usuarios?de_user=${miId}`).then((res) => res.json())
      setConvs(Array.isArray(r) ? r : [])
    } catch {}
  }, [miId])

  const marcarLeido = useCallback(async (paraUser) => {
    if (!miId || !paraUser) return
    // Marcar inmediatamente en el estado local para respuesta instantánea
    setConvs((prev) => prev.map((c) => c.id === paraUser ? { ...c, noLeidos: 0 } : c))
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

  // Socket: presencia (usuarios conectados) + mensajes en tiempo real.
  useEffect(() => {
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    socketRef.current = s
    const registrarme = () => {
      s.emit('user:online', {
        id: miId,
        name: user?.name || '',
        email: user?.email || '',
        rol: user?.rol || '',
        avatar_url: user?.avatar_url || '',
      })
    }
    s.on('connect', registrarme)
    if (s.connected) registrarme()
    s.on('users:online', (lista) => {
      if (!Array.isArray(lista)) return
      setOnline(lista.map((u) => u.id))
    })
    s.on('mensaje:new', (m) => {
      cargarConvs()
      const actual = activoRef.current
      if (actual && (m.de_user === actual || m.para_user === actual)) {
        cargarConversacion(actual)
        marcarLeido(actual)
      }
    })
    return () => s.close()
  }, [miId, user?.name, user?.email, user?.rol, user?.avatar_url, cargarConvs, cargarConversacion, marcarLeido])

  useEffect(() => { activoRef.current = activo }, [activo])

  // Carga inicial + refresco periódico.
  useEffect(() => {
    cargarUsuarios()
    cargarConvs()
    const id = setInterval(() => {
      cargarUsuarios()
      cargarConvs()
    }, 5000)
    return () => clearInterval(id)
  }, [cargarUsuarios, cargarConvs])

  const cerrarPaneles = () => {
    setEmojiOpen(false)
    setAdjuntarOpen(false)
  }

  const abrirConversacion = (c) => {
    setActivo(c.id)
    setTexto('')
    cerrarPaneles()
    cargarConversacion(c.id)
    marcarLeido(c.id)
  }

  const abrirPerfil = (u) => {
    cerrarPaneles()
    setPerfilUsuario(u)
  }

  // Envía cualquier mensaje (texto, sticker o marcador de archivo).
  const enviarTexto = useCallback(async (contenido) => {
    if (!contenido || !activo || !miId) return
    const temp = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      de_user: miId,
      para_user: activo,
      texto: contenido,
      fecha: new Date().toISOString(),
      leido: false,
    }
    setMensajes((prev) => [...prev, temp])
    setTextoBox((v) => v + 1)
    try {
      await fetch(`${API}/api/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ de_user: miId, para_user: activo, texto: contenido }),
      })
      cargarConvs()
      cargarConversacion(activo)
    } catch {}
  }, [activo, miId, cargarConvs, cargarConversacion])

  const enviar = (e) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    enviarTexto(t)
    setTexto('')
    cerrarPaneles()
  }

  const enviarSticker = (emoji) => {
    enviarTexto(`[[sticker]]${emoji}`)
    cerrarPaneles()
  }

  const elegirArchivo = (accept) => {
    const el = fileRef.current
    if (!el) return
    el.accept = accept
    el.value = ''
    el.click()
    setAdjuntarOpen(false)
  }

  const subirArchivo = async (file) => {
    if (!file || !activo || !miId) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch(`${API}/api/mensajes/archivo`, { method: 'POST', body: fd }).then((res) => res.json())
      if (r?.ok) {
        const marcador = `[[file]]${JSON.stringify({ url: r.url, name: r.name, mime: r.mime, size: r.size })}`
        await enviarTexto(marcador)
      }
    } catch {} finally {
      setSubiendo(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [mensajes, textoBox])

  // Une usuarios + presencia + conversación (último mensaje / no leídos).
  const convMap = Object.fromEntries(convs.map((c) => [c.id, c]))
  const lista = usuarios
    .map((u) => ({
      ...u,
      online: online.includes(u.id),
      noLeidos: convMap[u.id]?.noLeidos || 0,
      ultimo: convMap[u.id]?.ultimo || '',
      ultimaFecha: convMap[u.id]?.ultimaFecha || '',
    }))
    .sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      return new Date(b.ultimaFecha || 0) - new Date(a.ultimaFecha || 0)
    })

  const conectados = lista.filter((u) => u.online)
  const desconectados = lista.filter((u) => !u.online)
  const contactoActivo = lista.find((c) => c.id === activo) || null

  const filaUsuario = (c) => {
    const sel = c.id === activo
    return (
      <li key={c.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => abrirConversacion(c)}
          onKeyDown={(e) => { if (e.key === 'Enter') abrirConversacion(c) }}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/5 ${sel ? 'bg-white/10' : ''}`}
        >
          <button
            type="button"
            title="Ver perfil"
            onClick={(e) => { e.stopPropagation(); abrirPerfil(c) }}
            className="relative shrink-0 rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
          >
            <Avatar u={c} dot={c.online} />
            {c.noLeidos > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-night-900">
                {c.noLeidos}
              </span>
            )}
          </button>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{c.name || 'Usuario'}</span>
            <span className="block truncate text-xs text-slate-500">
              {preview(c.ultimo) || 'Sin mensajes'}
            </span>
          </span>
        </div>
      </li>
    )
  }

  const renderContenido = (m) => {
    const p = parseMensaje(m.texto)
    if (p.tipo === 'sticker') {
      return <span className="text-6xl leading-none">{p.valor}</span>
    }
    if (p.tipo === 'file') {
      const url = `${API}${p.url}`
      const mime = p.mime || ''
      if (mime.startsWith('image/')) {
        return <img src={url} alt={p.name} className="max-h-72 max-w-[260px] rounded-xl object-cover" />
      }
      if (mime.startsWith('video/')) {
        return <video src={url} controls className="max-h-72 max-w-[260px] rounded-xl" />
      }
      if (mime.startsWith('audio/')) {
        return <audio src={url} controls className="max-w-[240px]" />
      }
      return (
        <a
          href={url}
          download={p.name}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2.5 transition hover:bg-black/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <FiFileText size={18} />
          </span>
          <span className="min-w-0">
            <span className="block max-w-[180px] truncate text-sm font-semibold">{p.name}</span>
            <span className="block text-[11px] opacity-70">{iconoArchivo(mime)} · {formatoPeso(p.size)}</span>
          </span>
          <FiDownload size={16} className="ml-1 shrink-0 opacity-70" />
        </a>
      )
    }
    return p.valor
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden lg:h-[calc(100vh-8rem)]">
      <div className="flex shrink-0 items-center justify-between gap-3 pb-4">
        <h2 className="flex items-center gap-2.5 text-xl font-black text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <FiMessageCircle size={16} />
          </span>
          Mensajes
        </h2>
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* Columna izquierda: todos los usuarios (conectados primero) */}
        <div className={`panel min-h-0 flex-col overflow-hidden ${activo ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-3">
            <FiMessageCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">Usuarios</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {conectados.length} conectado{conectados.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="scroll-hidden min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {cargando && <li className="py-4 text-center text-sm text-slate-500">…</li>}
            {!cargando && lista.length === 0 && (
              <li className="px-1 py-4 text-center text-xs leading-relaxed text-slate-500">
                No hay usuarios registrados
              </li>
            )}
            {conectados.length > 0 && (
              <>
                <li className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Conectados · {conectados.length}
                </li>
                {conectados.map(filaUsuario)}
              </>
            )}
            {desconectados.length > 0 && (
              <>
                <li className="px-2.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Desconectados · {desconectados.length}
                </li>
                {desconectados.map(filaUsuario)}
              </>
            )}
          </ul>
        </div>

        {/* Contenedor derecho: conversación tipo Messenger/WhatsApp */}
        <div className={`panel min-h-0 min-w-0 flex-col overflow-hidden ${activo ? 'flex' : 'hidden md:flex'}`}>
          {!contactoActivo ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600/15 ring-1 ring-emerald-500/30">
                <FiMessageCircle size={44} className="text-emerald-400" />
              </span>
              <p className="text-2xl font-black text-white">Selecciona un contacto</p>
              <p className="max-w-sm text-sm text-slate-500">
                Elige un usuario de la lista de la izquierda para ver la conversación y enviarle mensajes.
              </p>
            </div>
          ) : (
            <>
              {/* Encabezado del contacto (clic en la foto = ver información) */}
              <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-night-800 px-4 py-2.5">
                <button
                  onClick={() => setActivo(null)}
                  aria-label="Volver"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
                >
                  <FiArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  title="Ver información"
                  onClick={() => abrirPerfil(contactoActivo)}
                  className="rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
                >
                  <Avatar u={contactoActivo} className="h-8 w-8" textClass="text-sm" dot={contactoActivo.online} />
                </button>
                <button
                  type="button"
                  onClick={() => abrirPerfil(contactoActivo)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-bold text-white">{contactoActivo.name || 'Usuario'}</p>
                  <p className={`truncate text-[11px] ${contactoActivo.online ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {contactoActivo.online ? 'Conectado' : 'Desconectado'}
                  </p>
                </button>
              </div>

              {/* Mensajes */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-night-900 p-3">
                {mensajes.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                    Sin mensajes todavía. Empieza la conversación.
                  </div>
                )}
                {mensajes.map((m) => {
                  const mio = m.de_user === miId
                  const p = parseMensaje(m.texto)
                  const hora = new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

                  if (p.tipo === 'sticker') {
                    return (
                      <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col ${mio ? 'items-end' : 'items-start'}`}>
                          <span className="text-4xl leading-none">{p.valor}</span>
                          <span className="mt-0.5 text-[10px] text-slate-500">
                            {hora}
                            {mio && <FiCheck size={10} className="ml-1 inline" />}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  const mime = p.mime || ''
                  const esMedia = p.tipo === 'file' && (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/'))
                  return (
                    <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                      <span
                        className={`max-w-[70%] rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                          mio
                            ? 'rounded-br-sm bg-emerald-600 text-white'
                            : 'rounded-bl-sm bg-night-800 text-slate-200'
                        } ${esMedia ? '!p-1' : ''}`}
                      >
                        {renderContenido(m)}
                        <span className={`mt-0.5 block text-right text-[10px] ${mio ? 'text-white/60' : 'text-slate-500'} ${esMedia ? 'px-1 pb-0.5' : ''}`}>
                          {hora}
                          {mio && <FiCheck size={10} className="ml-1 inline" />}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <div className="relative shrink-0 border-t border-white/10 p-2.5">
                {(emojiOpen || adjuntarOpen) && (
                  <div className="fixed inset-0 z-10" onClick={cerrarPaneles} />
                )}

                {emojiOpen && (
                  <div className="absolute bottom-full right-4 z-20 mb-2 w-72 rounded-2xl border border-white/10 bg-night-850 p-3 shadow-2xl">
                    <div className="mb-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEmojiTab('emojis')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${emojiTab === 'emojis' ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-400 hover:bg-white/5'}`}
                      >
                        Emojis
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmojiTab('stickers')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${emojiTab === 'stickers' ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-400 hover:bg-white/5'}`}
                      >
                        Stickers
                      </button>
                    </div>
                    {emojiTab === 'emojis' ? (
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setTexto((t) => t + e)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition hover:bg-white/10"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-1">
                        {STICKERS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => enviarSticker(e)}
                            className="flex h-12 w-12 items-center justify-center rounded-xl text-3xl transition hover:bg-white/10"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {adjuntarOpen && (
                  <div className="absolute bottom-full right-4 z-20 mb-2 w-44 rounded-xl border border-white/10 bg-night-850 p-1.5 shadow-2xl">
                    <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Enviar</p>
                    <button type="button" onClick={() => elegirArchivo('image/*')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
                      <FiImage size={14} className="text-violet-400" /> Imagen
                    </button>
                    <button type="button" onClick={() => elegirArchivo('video/*')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
                      <FiVideo size={14} className="text-sky-400" /> Video
                    </button>
                    <button type="button" onClick={() => elegirArchivo('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
                      <FiFileText size={14} className="text-amber-400" /> Documento
                    </button>
                    <button type="button" onClick={() => elegirArchivo('audio/*')} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
                      <FiMusic size={14} className="text-emerald-400" /> Audio
                    </button>
                  </div>
                )}

                <form onSubmit={enviar} className="flex items-center gap-1.5">
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; subirArchivo(f) }}
                  />
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder={`Mensaje para ${contactoActivo.name || 'usuario'}…`}
                    className="w-full rounded-lg border border-white/10 bg-night-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    title="Adjuntar"
                    disabled={subiendo}
                    onClick={() => { setAdjuntarOpen((v) => !v); setEmojiOpen(false) }}
                    className={`rounded-lg p-2 transition hover:bg-white/10 disabled:opacity-40 ${adjuntarOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <FiPaperclip size={15} />
                  </button>
                  <button
                    type="button"
                    title="Emojis y stickers"
                    onClick={() => { setEmojiOpen((v) => !v); setAdjuntarOpen(false) }}
                    className={`rounded-lg p-2 transition hover:bg-white/10 ${emojiOpen ? 'bg-white/10 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                  >
                    <FiSmile size={15} />
                  </button>
                  <button type="submit" aria-label="Enviar" className="btn-primary !rounded-lg !p-2.5">
                    <FiSend size={15} />
                  </button>
                </form>
                {subiendo && <p className="mt-1 text-[10px] text-emerald-400">Subiendo archivo…</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: información del usuario */}
      {perfilUsuario && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPerfilUsuario(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-night-850 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3 bg-night-800 px-6 pb-5 pt-7">
              <Avatar u={perfilUsuario} className="h-20 w-20" textClass="text-3xl" dot={perfilUsuario.online} />
              <div className="text-center">
                <p className="text-lg font-black text-white">{perfilUsuario.name || 'Usuario'}</p>
                <p className="text-xs text-slate-400">{perfilUsuario.email}</p>
              </div>
              <span className="inline-block rounded-full bg-blue-600/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                {ROL_LABEL[perfilUsuario.rol] || perfilUsuario.rol || 'Usuario'}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${perfilUsuario.online ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span className={`h-2 w-2 rounded-full ${perfilUsuario.online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {perfilUsuario.online ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="space-y-2.5 p-6 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <FiUser size={16} className="text-slate-500" />
                <span className="text-slate-500">Nombre:</span>
                <span className="ml-auto truncate font-medium text-white">
                  {[perfilUsuario.name, perfilUsuario.apellido].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <span className="text-slate-500">Correo:</span>
                <span className="ml-auto truncate font-medium text-white">{perfilUsuario.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <span className="text-slate-500">Cédula:</span>
                <span className="ml-auto font-medium text-white">{perfilUsuario.cedula || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <span className="text-slate-500">Celular:</span>
                <span className="ml-auto font-medium text-white">{perfilUsuario.telefono || '—'}</span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-white/5 p-4">
              <button onClick={() => setPerfilUsuario(null)} className="btn-ghost flex-1 !py-2.5 !text-xs">
                Cerrar
              </button>
              <button
                onClick={() => abrirConversacion(perfilUsuario)}
                className="btn-primary flex-1 !py-2.5 !text-xs"
              >
                <FiMessageCircle size={14} /> Enviar mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
