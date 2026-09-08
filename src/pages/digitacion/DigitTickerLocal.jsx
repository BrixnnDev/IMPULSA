import { useEffect, useMemo, useState } from 'react'
import {
  FiCheck,
  FiXCircle,
  FiArchive,
  FiCalendar,
  FiArrowLeft,
  FiShoppingBag,
} from 'react-icons/fi'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const LOCALES = {
  KYB1: 'Papelería KYB 1',
  KYB2: 'Papelería KYB 2',
}

function diaLocal(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hoyLocal() {
  return diaLocal(new Date().toISOString())
}

export default function DigitTickerLocal() {
  const { local } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [comisiones, setComisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [diaFiltro, setDiaFiltro] = useState(hoyLocal())

  const nombreLocal = LOCALES[local] || 'Local'

  const cargar = async () => {
    try {
      const lista = await fetch(`${API}/api/comisiones`).then((r) => r.json())
      setComisiones(Array.isArray(lista) ? lista : [])
    } catch {
      setError('No se pudieron cargar las comisiones.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 1000)
    return () => clearInterval(id)
  }, [])

  const pendientes = comisiones.filter(
    (c) => !c.aprobado && c.estado !== 'Rechazado' && (!c.local || c.local === '' || c.local === local),
  )

  const delDia = useMemo(() => (list) => {
    if (!diaFiltro) return list
    return list.filter((c) => diaLocal(c.fecha) === diaFiltro)
  }, [diaFiltro])

  const pendDia = delDia(pendientes)
  const aprobadasDia = delDia(comisiones.filter((c) => c.aprobado === true))
  const rechazadasDia = delDia(comisiones.filter((c) => c.estado === 'Rechazado'))
  const totalAprobadoDia = aprobadasDia.reduce((a, c) => a + (c.total || 0), 0)

  const aprobar = async (id, aprobarFlag) => {
    try {
      const r = await fetch(`${API}/api/comisiones/${id}/aprobar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ local, aprobar: aprobarFlag, aprobado_por: user?.id || '' }),
      })
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Error')
      setComisiones((prev) => prev.map((c) =>
        c.id === id
          ? { ...c, estado: aprobarFlag ? 'Aprobado' : 'Rechazado', aprobado: aprobarFlag, local: aprobarFlag ? local : '' }
          : c,
      ))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-hidden">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/digitacion/historial')}
            aria-label="Volver"
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
                <FiShoppingBag size={18} />
              </span>
              {nombreLocal}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Aprueba o rechaza los valecitos del día.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-night-800 px-3 py-2">
            <FiCalendar size={14} className="text-blue-400" />
            <input
              type="date"
              value={diaFiltro}
              onChange={(e) => setDiaFiltro(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Por aprobar</p>
          <p className="mt-1 text-2xl font-black text-amber-400">{pendDia.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aprobadas</p>
          <p className="mt-1 text-2xl font-black text-white">{aprobadasDia.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total aprobado</p>
          <p className="mt-1 text-2xl font-black text-emerald-400">S/ {totalAprobadoDia.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2 text-xs text-red-300">{error}</div>
      )}

      {/* Valecitos pendientes del día */}
      <div className="panel min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <FiArchive size={16} className="text-amber-400" /> Por aprobar · {diaFiltro}
          </h3>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/30">
            {pendDia.length}
          </span>
        </div>

        {cargando ? (
          <p className="flex h-full items-center justify-center p-10 text-sm text-slate-500">Cargando…</p>
        ) : pendDia.length === 0 ? (
          <p className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-sm text-slate-500">
            <FiArchive size={28} className="text-slate-600" />
            No hay valecitos pendientes en {nombreLocal} para esta fecha.
          </p>
        ) : (
          <ul className="h-full divide-y divide-white/5 overflow-y-auto">
            {pendDia.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition hover:bg-white/[0.03]">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-300 ring-1 ring-blue-500/25">
                  {c.id}
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold text-white">{c.trabajador || 'Cliente'}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(c.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    {c.nota && ` · ${c.nota}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-white">S/ {c.total.toFixed(2)}</p>
                  <p className="text-[11px] text-emerald-400">Digitador + S/ {c.ganancia.toFixed(2)}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    onClick={() => aprobar(c.id, true)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500 hover:text-white sm:flex-none"
                  >
                    <FiCheck size={13} /> Aprobar
                  </button>
                  <button
                    onClick={() => aprobar(c.id, false)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500 hover:text-white sm:flex-none"
                  >
                    <FiXCircle size={13} /> Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Historial del día: aprobadas y rechazadas */}
      <div className="grid grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
        {/* Aprobadas */}
        <div className="panel min-h-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <FiArchive size={14} className="text-emerald-400" /> Aprobadas
            </h4>
            <span className="text-[11px] font-semibold text-emerald-400">S/ {totalAprobadoDia.toFixed(2)}</span>
          </div>
          <ul className="max-h-72 divide-y divide-white/5 overflow-y-auto">
            {aprobadasDia.length === 0 && (
              <li className="px-5 py-6 text-center text-xs text-slate-500">Sin aprobadas esta fecha.</li>
            )}
            {aprobadasDia.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <FiCheck size={14} className="shrink-0 text-emerald-400" />
                <span className="rounded-lg bg-blue-600/10 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-300 ring-1 ring-blue-500/25">{c.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">{c.trabajador || 'Cliente'}</span>
                <span className="shrink-0 text-sm font-black text-white">S/ {c.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rechazadas */}
        <div className="panel min-h-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <FiXCircle size={14} className="text-rose-400" /> Rechazadas
            </h4>
            <span className="text-[11px] font-semibold text-rose-400">{rechazadasDia.length}</span>
          </div>
          <ul className="max-h-72 divide-y divide-white/5 overflow-y-auto">
            {rechazadasDia.length === 0 && (
              <li className="px-5 py-6 text-center text-xs text-slate-500">Sin rechazadas esta fecha.</li>
            )}
            {rechazadasDia.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <FiXCircle size={14} className="shrink-0 text-rose-400" />
                <span className="rounded-lg bg-blue-600/10 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-300 ring-1 ring-blue-500/25">{c.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">{c.trabajador || 'Cliente'}</span>
                <span className="shrink-0 text-sm font-black text-white">S/ {c.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
