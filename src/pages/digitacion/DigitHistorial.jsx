import { useEffect, useState } from 'react'
import {
  FiCheckCircle,
  FiDollarSign,
  FiPercent,
  FiX,
  FiUser,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function DigitHistorial() {
  const [trabajos, setTrabajos] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [mostrarComision, setMostrarComision] = useState(false)
  const [formCom, setFormCom] = useState({ total: '', nota: '' })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const cargar = async () => {
      try {
        const lista = await fetch(`${API}/api/comisiones`).then((r) => r.json())
        const arr = Array.isArray(lista) ? lista : []
        setComisiones(arr)
        setTrabajos(arr.map((c) => ({
          id: c.id,
          cliente: c.trabajador || 'Cliente',
          tipo: 'Trabajo registrado',
          paginas: 1,
          monto: c.total || 0,
          fecha: c.fecha,
          estado: c.estado || 'Pendiente',
        })))
      } catch {
        setError('No se pudieron cargar las comisiones.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [user?.id])

  const totalNum = Number(formCom.total) || 0
  const mitad = totalNum / 2

  const totalGeneral = comisiones.reduce((a, c) => a + (c.total || 0), 0)
  const totalGanancias = comisiones.reduce((a, c) => a + (c.ganancia || 0), 0)
  const totalPanaderia = totalGeneral - totalGanancias

  const marcarPagado = async (id) => {
    try {
      await fetch(`${API}/api/comisiones/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Pagado' }),
      })
      setTrabajos((prev) => prev.map((t) => (t.id === id ? { ...t, estado: 'Pagado' } : t)))
      setComisiones((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'Pagado' } : c)))
    } catch {
      setError('No se pudo marcar como pagado.')
    }
  }

  const registrarComision = async (e) => {
    e.preventDefault()
    if (!formCom.total) return
    setError('')
    try {
      const r = await fetch(`${API}/api/comisiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || '',
          trabajador: user?.name || 'Usuario',
          total: totalNum,
          nota: formCom.nota.trim(),
        }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Error al registrar')
      setComisiones((prev) => [data.comision, ...prev])
      const nuevo = {
        id: data.comision.id,
        cliente: data.comision.trabajador || 'Cliente',
        tipo: 'Trabajo registrado',
        paginas: 1,
        monto: data.comision.total || 0,
        fecha: data.comision.fecha,
        estado: data.comision.estado || 'Pendiente',
      }
      setTrabajos((prev) => [nuevo, ...prev])
      setMostrarComision(false)
      setFormCom({ total: '', nota: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-hidden">
      {/* Título + botón comisión */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiDollarSign size={18} />
            </span>
            Historial de valecitos
          </h2>
        </div>
        <button onClick={() => setMostrarComision(true)} className="btn-primary !px-4 !py-2.5 !text-xs">
          <FiPercent /> Registrar comisión
        </button>
      </div>

      {/* Dos cuadros: perfil + historial */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[340px_1fr]">
        {/* Perfil de la cuenta */}
        <div className="panel flex flex-col overflow-hidden p-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-lg font-bold text-blue-300 ring-1 ring-blue-500/40">
              {user?.name?.charAt(0).toUpperCase() || <FiUser size={20} />}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{user?.name || 'Usuario'}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email || 'cuenta@stockflow.com'}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                <FiUser size={10} /> Digitación
              </span>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2.5 text-slate-400">
                <FiCheckCircle size={14} className="text-blue-400" /> Trabajos
              </dt>
              <dd className="font-bold text-white">{comisiones.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2.5 text-slate-400">
                <FiDollarSign size={14} className="text-white" /> Dinero total
              </dt>
              <dd className="font-bold text-white">S/ {totalGeneral.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-500/5 px-3 py-2 ring-1 ring-amber-500/20">
              <dt className="flex items-center gap-2.5 text-slate-400">
                <FiPercent size={14} className="text-amber-400" /> Papelería (50%)
              </dt>
              <dd className="font-bold text-amber-400">S/ {totalPanaderia.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-500/5 px-3 py-2 ring-1 ring-emerald-500/20">
              <dt className="flex items-center gap-2.5 text-slate-400">
                <FiPercent size={14} className="text-emerald-400" /> Digitador (50%)
              </dt>
              <dd className="font-bold text-emerald-400">S/ {totalGanancias.toFixed(2)}</dd>
            </div>
          </dl>

          {/* Historial de comisiones */}
          <div className="mt-auto border-t border-white/5 pt-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registro de comisiones ({comisiones.length})
            </p>
            <ul className="space-y-2">
              {[...comisiones].reverse().slice(0, 2).map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      Trabajo S/ {c.total.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {c.id} · {new Date(c.fecha).toLocaleDateString('es-PE', { dateStyle: 'short' })}
                      {c.nota && ` · ${c.nota}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-emerald-400">+ S/ {c.ganancia.toFixed(2)}</span>
                </li>
              ))}
              {comisiones.length > 2 && (
                <li className="text-[11px] text-slate-500">+{comisiones.length - 2} registros anteriores</li>
              )}
              {comisiones.length === 0 && (
                <li className="rounded-xl bg-white/[0.03] px-3 py-3 text-center text-xs text-slate-500 ring-1 ring-white/5">
                  Sin registros aún.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Historial de trabajos */}
        <div className="panel min-h-0 flex-1 overflow-hidden">
          {error && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-5 py-2 text-xs text-red-300">{error}</div>
          )}
          {cargando ? (
            <p className="flex h-full items-center justify-center p-10 text-sm text-slate-500">Cargando…</p>
          ) : trabajos.length === 0 ? (
            <p className="flex h-full items-center justify-center p-10 text-sm text-slate-500">
              Aún no hay trabajos registrados. Registra tu primera comisión.
            </p>
          ) : (
            <ul className="h-full divide-y divide-white/5 overflow-y-auto">
              {[...trabajos].reverse().map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {t.id}
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold text-white">{t.cliente}</p>
                  <p className="text-xs text-slate-500">
                    {t.tipo} · {t.paginas} pág. ·{' '}
                    {new Date(t.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-black text-emerald-400 ring-1 ring-emerald-500/30">
                  + S/ {t.monto.toFixed(2)}
                </span>
                {t.estado === 'Pendiente' ? (
                  <button
                    onClick={() => marcarPagado(t.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/15 px-3 py-1.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40 transition hover:bg-blue-600 hover:text-white"
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
          )}
        </div>
      </div>

      {/* Flotante: registrar comisión */}
      {mostrarComision && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setMostrarComision(false)}
        >
          <form
            onSubmit={registrarComision}
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-night-850 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
                <FiPercent size={18} />
              </span>
              <div>
                <h3 className="font-bold text-white">Registrar comisión</h3>
                <p className="text-xs text-slate-400">Escribe la comisión que ganaste por un trabajo.</p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarComision(false)}
                aria-label="Cerrar"
                className="ml-auto rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>

            <div>
              <label className="label-form">Trabajador</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-night-800 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-300 ring-1 ring-blue-500/40">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || 'Usuario'}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email || 'cuenta@stockflow.com'}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-blue-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                  Digitación
                </span>
              </div>
            </div>

            <div>
              <label className="label-form">Dinero del trabajo (S/) *</label>
              <input
                type="number"
                step="0.10"
                min="0"
                value={formCom.total}
                onChange={(e) => setFormCom({ ...formCom, total: e.target.value })}
                placeholder="Ej. 1000"
                className="input-field !border-emerald-500/30 focus:!ring-emerald-500/30"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-500/5 px-3 py-2.5 ring-1 ring-amber-500/25">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Papelería · 50%</p>
                  <p className="text-lg font-black tabular-nums text-amber-300">S/ {mitad.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 px-3 py-2.5 ring-1 ring-emerald-500/25">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Digitador · 50%</p>
                  <p className="text-lg font-black tabular-nums text-emerald-300">S/ {mitad.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="label-form">Detalle (opcional)</label>
              <input
                value={formCom.nota}
                onChange={(e) => setFormCom({ ...formCom, nota: e.target.value })}
                placeholder="Ej. Comisión acordada con el jefe"
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button type="button" onClick={() => setMostrarComision(false)} className="btn-ghost !px-5 !py-2.5 !text-xs">
                Cancelar
              </button>
              <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs">
                Registrar comisión
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
