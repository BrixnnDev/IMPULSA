import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { FiMonitor, FiPlus, FiTrash2, FiWifi, FiWifiOff, FiCopy, FiX, FiInfo, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function DigitAdminPcs() {
  const { isAdmin } = useAuth()
  const [pcs, setPcs] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [codigoModal, setCodigoModal] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)
  const [pcStatus, setPcStatus] = useState({})
  const [copiado, setCopiado] = useState('')
  const socketRef = useRef(null)
  const codigoModalRef = useRef(null)
  codigoModalRef.current = codigoModal

  useEffect(() => {
    if (!isAdmin) return
    fetch(`${API}/api/pc/list`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setPcs(d) }).catch(() => {})
    const s = io(API, { transports: ['websocket'], reconnectionAttempts: 5 })
    socketRef.current = s
    s.on('pc:status', ({ pc, online }) => {
      setPcStatus((prev) => ({ ...prev, [pc]: online }))
    })
    s.on('pc:connected', ({ id }) => {
      const cur = codigoModalRef.current
      if (cur && cur.id === id && cur._fase !== 'conectada') {
        setCodigoModal((prev) => prev ? { ...prev, _fase: 'conectada' } : prev)
        setTimeout(() => setCodigoModal(null), 2500)
      }
    })
    s.on('pc:paired', ({ id }) => {
      fetch(`${API}/api/pc/list`).then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) {
          setPcs(d)
          setCodigoModal((prev) => {
            if (prev && prev.id === id) {
              const updated = d.find((p) => p.id === id) || prev
              return { ...updated, _fase: 'conectando' }
            }
            return prev
          })
        }
      }).catch(() => {})
    })
    return () => s.close()
  }, [isAdmin])

  const copiar = (texto, label) => {
    navigator.clipboard?.writeText(texto)
    setCopiado(label)
    setTimeout(() => setCopiado(''), 2000)
  }

  const crearPC = async () => {
    if (!nombre.trim()) return
    try {
      const res = await fetch(`${API}/api/pc/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setPcs((prev) => [...prev, data.pc])
        setCodigoModal({ ...data.pc, _fase: 'codigo' })
        setFormOpen(false)
        setNombre('')
      }
    } catch (e) {
      console.error('Error:', e)
    }
  }

  const eliminarPC = async (id) => {
    try {
      await fetch(`${API}/api/pc/${id}`, { method: 'DELETE' })
      setPcs((prev) => prev.filter((p) => p.id !== id))
      setEliminarId(null)
    } catch {}
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-400">Solo administradores pueden acceder.</p>
      </div>
    )
  }

  const onlineCount = pcs.filter((p) => {
    const s = pcStatus[p.etiqueta]
    return s !== undefined ? s : p.online
  }).length

  const pairedCount = pcs.filter((p) => p.emparejada).length

  const fase = codigoModal?._fase || 'codigo'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiMonitor size={20} />
            </span>
            Administrar PCs
          </h2>
          <p className="mt-1 text-sm text-slate-400">Gestiona las computadoras conectadas al sistema.</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
          <FiPlus /> Agregar PC
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiMonitor /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</p><p className="text-xl font-black text-white">{pcs.length}</p></div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiWifi /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">En línea</p><p className="text-xl font-black text-emerald-400">{onlineCount}</p></div>
        </div>
        <div className="panel flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/40"><FiMonitor /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Vinculadas</p><p className="text-xl font-black text-violet-400">{pairedCount}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {pcs.map((p) => {
          const online = p.emparejada && (pcStatus[p.etiqueta] !== undefined ? pcStatus[p.etiqueta] : p.online)
          return (
            <div key={p.id} className="group relative">
              <span className="relative mx-auto block h-2.5 w-14 rounded-t-md bg-night-700 ring-1 ring-white/10 transition group-hover:bg-blue-500/40" />
              <span className="panel relative flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-500/40">
                <span role="button" tabIndex={0} title="Info" onClick={() => setCodigoModal({ ...p, _fase: p.emparejada ? 'info' : 'codigo' })} className="absolute right-8 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-600/15 hover:text-blue-300"><FiInfo size={14} /></span>
                <span role="button" tabIndex={0} title="Eliminar" onClick={() => setEliminarId(p)} className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-600 transition hover:bg-red-600/15 hover:text-red-400"><FiTrash2 size={13} /></span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition group-hover:scale-110"><FiMonitor size={22} /></span>
                <span className="block w-full truncate px-0.5 text-xs font-bold text-white sm:text-sm">{p.responsable}</span>
                <span className="text-[11px] text-slate-500">{p.etiqueta}</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold">
                  {p.emparejada ? (
                    <>
                      <span className={`flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {online ? <FiWifi size={11} /> : <FiWifiOff size={11} />}
                        {online ? 'En línea' : 'Offline'}
                      </span>
                      {p.ip && <span className="ml-1 text-slate-600">· {p.ip}</span>}
                    </>
                  ) : (
                    <span className="text-amber-400">Sin vincular</span>
                  )}
                </span>
              </span>
            </div>
          )
        })}
        {pcs.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-500">No hay PCs. Agrega una con "Agregar PC".</p>
        )}
      </div>

      {/* Formulario: ingresar nombre → Verificar */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/40"><FiMonitor size={18} /></span>
              <div><h3 className="font-bold text-white">Agregar PC</h3><p className="text-xs text-slate-400">Ingresa el nombre de la persona o computadora.</p></div>
              <button onClick={() => setFormOpen(false)} className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><FiX size={16} /></button>
            </div>
            <div>
              <label className="label-form">Nombre *</label>
              <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && crearPC()} placeholder="Ej. María Victoria" className="input-field" />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => setFormOpen(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">Cancelar</button>
              <button onClick={crearPC} className="btn-primary !px-5 !py-2.5 !text-xs"><FiCheckCircle /> Verificar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal emparejar PC */}
      {codigoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"><FiMonitor size={18} /></span>
              <div><h3 className="font-bold text-white">{codigoModal.etiqueta}</h3><p className="text-xs text-slate-400">{fase === 'conectada' ? 'Conectada' : fase === 'conectando' ? 'Conectando...' : fase === 'info' ? 'Información' : 'Emparejar PC'}</p></div>
            </div>

            <div className="space-y-4">
              {/* FASE: Mostrar código para copiar */}
              {fase === 'codigo' && (
                <>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                    <p className="text-xs font-semibold text-slate-300">Código de emparejamiento:</p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className="rounded-xl bg-black/40 px-6 py-4 font-mono text-3xl font-black tracking-widest text-emerald-400 ring-1 ring-emerald-500/30 select-all">{codigoModal.codigo}</span>
                      <button onClick={() => copiar(codigoModal.codigo, 'codigo')} className="rounded-xl p-3 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Copiar código">
                        <FiCopy size={20} />
                      </button>
                    </div>
                    {copiado === 'codigo' && <p className="mt-2 text-xs text-emerald-400">Copiado al portapapeles</p>}
                  </div>

                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-amber-400">Esperando conexión...</span>
                  </div>
                </>
              )}

              {/* FASE: Conectando (pc:paired recibido, esperando heartbeat) */}
              {fase === 'conectando' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="relative">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/15 ring-2 ring-blue-500/40">
                      <FiMonitor size={32} className="text-blue-400" />
                    </span>
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500"></span>
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Conectando a la PC...</p>
                    <p className="mt-1 text-xs text-slate-400">{codigoModal.etiqueta} se está registrando</p>
                  </div>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              {/* FASE: Conectada */}
              {fase === 'conectada' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="relative">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/40">
                      <FiCheckCircle size={36} className="text-emerald-400" />
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-400">PC conectada exitosamente</p>
                    <p className="mt-1 text-xs text-slate-400">La carpeta ya está disponible en Historial de impresión</p>
                  </div>
                </div>
              )}

              {/* FASE: Info de PC ya vinculada */}
              {fase === 'info' && (
                <div className="space-y-3 rounded-xl border border-white/5 bg-black/30 p-4">
                  <p className="text-xs font-semibold text-slate-300">Información de la PC:</p>
                  {codigoModal.ip && <div className="flex justify-between text-xs"><span className="text-slate-500">IP</span><span className="font-mono font-bold text-slate-200">{codigoModal.ip}</span></div>}
                  {codigoModal.mac && <div className="flex justify-between text-xs"><span className="text-slate-500">MAC</span><span className="font-mono font-bold text-slate-200">{codigoModal.mac}</span></div>}
                  {codigoModal.sistema && <div className="flex justify-between text-xs"><span className="text-slate-500">Sistema</span><span className="font-bold text-slate-200">{codigoModal.sistema}</span></div>}
                  {!codigoModal.ip && !codigoModal.mac && <p className="text-center text-xs text-slate-500">Esperando datos del agente...</p>}
                </div>
              )}
            </div>

            {fase === 'conectada' && (
              <button onClick={() => setCodigoModal(null)} className="btn-primary w-full !py-2.5 !text-xs">Entendido</button>
            )}
          </div>
        </div>
      )}

      {/* Confirmar eliminación */}
      {eliminarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEliminarId(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white">Eliminar {eliminarId.etiqueta}?</h3>
            <p className="text-sm text-slate-400">Se eliminará esta PC del sistema.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEliminarId(null)} className="btn-ghost !px-4 !py-2 !text-xs">Cancelar</button>
              <button onClick={() => eliminarPC(eliminarId.id)} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
