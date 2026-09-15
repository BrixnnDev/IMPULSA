import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FiFileText, FiPlus, FiTrash2, FiDownload, FiSave } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const ROW_INICIAL = { descripcion: '', cantidad: 1, precio: '' }

const fmt = (n) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(n) || 0)

export default function DigitCotizacion() {
  const { user } = useAuth()
  const hoy = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    numero: `COT-${new Date().getFullYear()}-001`,
    fecha: hoy,
    valida: '',
    empresa: 'Papelería KYB',
    cliente: '',
    dxc: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
  })
  const [items, setItems] = useState([{ ...ROW_INICIAL }])
  const [guardado, setGuardado] = useState('')

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const setItem = (idx, k, v) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  const agregarFila = () => setItems((prev) => [...prev, { ...ROW_INICIAL }])

  const quitarFila = (idx) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))

  const subtotal = items.reduce((a, i) => a + (Number(i.cantidad) || 0) * (Number(i.precio) || 0), 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  const estado = () => {
    const tipos = [
      { val: form.cliente, msg: 'el cliente' },
      { val: form.dxc, msg: 'el RUC/DNI' },
      { val: form.telefono, msg: 'el teléfono' },
      { val: form.email, msg: 'el email' },
    ]
    for (const t of tipos) if (!t.val.trim()) return `Completa ${t.msg} antes de imprimir.`
    if (items.some((i) => !i.descripcion.trim())) return 'Faltan descripciones de productos.'
    if (items.some((i) => (Number(i.cantidad) || 0) <= 0)) return 'Las cantidades deben ser mayores a 0.'
    return ''
  }

  const descargarPDF = () => {
    const err = estado()
    if (err) {
      setGuardado(err)
      setTimeout(() => setGuardado(''), 3500)
      return
    }

    const doc = new jsPDF()
    const w = doc.internal.pageSize.getWidth()

    // Encabezado
    doc.setFillColor(30, 41, 82)
    doc.rect(0, 0, w, 34, 'F')
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 34, w, 2.2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(form.empresa || 'Papelería KYB', 14, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(27)
    doc.text('COTIZACIÓN', w - 14, 25, { align: 'right' })
    doc.setFontSize(10)
    doc.text(form.numero || '', w - 14, 32, { align: 'right' })

    // Datos generales
    doc.setTextColor(90, 90, 90)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('FECHA', 14, 48)
    doc.text('VÁLIDA HASTA', 100, 48)
    doc.setTextColor(33, 33, 33)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(form.fecha || hoy, 14, 54)
    doc.text(form.valida || '—', 100, 54)

    // Cliente
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 61, w - 14, 61)
    doc.setTextColor(90, 90, 90)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CLIENTE', 14, 68)
    doc.setTextColor(33, 33, 33)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(form.cliente, 14, 74)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(
      [form.dxc, form.telefono, form.email, form.direccion].filter(Boolean).join('   |   ') || '—',
      14,
      80,
    )

    // Tabla de items
    autoTable(doc, {
      startY: 88,
      head: [['#', 'DESCRIPCIÓN', 'CANT.', 'P. UNITARIO', 'IMPORTE']],
      body: items.map((it, i) => [
        String(i + 1),
        it.descripcion,
        String(it.cantidad),
        fmt(it.precio || 0),
        fmt((Number(it.cantidad) || 0) * (Number(it.precio) || 0)),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 82], fontSize: 8, halign: 'center' },
      styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    })

    // Totales
    const finalY = doc.lastAutoTable.finalY + 6
    const colX = w - 14 - 60
    autoTable(doc, {
      startY: finalY,
      body: [
        ['SUBTOTAL', fmt(subtotal)],
        ['IGV (18%)', fmt(igv)],
        ['TOTAL', fmt(total)],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 72, fontStyle: 'bold', textColor: [50, 50, 50] },
        1: { cellWidth: 60, halign: 'right', textColor: [50, 50, 50] },
      },
      margin: { left: colX, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = [59, 130, 246]
          data.cell.styles.textColor = [255, 255, 255]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 12
        }
      },
    })

    // Notas
    if (form.notas.trim()) {
      const ny = doc.lastAutoTable.finalY + 10
      doc.setTextColor(90, 90, 90)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('NOTAS', 14, ny)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.setFontSize(9)
      const lineas = doc.splitTextToSize(form.notas, w - 28)
      doc.text(lineas, 14, ny + 5)
    }

    // Pie
    const py = doc.lastAutoTable.finalY + 24
    doc.setDrawColor(210, 210, 210)
    doc.line(14, py - 8, w - 14, py - 8)
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    doc.text('Gracias por su preferencia · IMPULSA — Sistema de digitalización', w / 2, py, { align: 'center' })

    doc.save(`${form.numero || 'Cotizacion'}.pdf`)
    setGuardado('PDF descargado ✓')
    setTimeout(() => setGuardado(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-black text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiFileText size={20} />
            </span>
            Cotización
          </h2>
          <p className="mt-1 text-sm text-slate-400">Escribe los datos y descarga la cotización en PDF automáticamente.</p>
        </div>
        <div className="flex items-center gap-3">
          {guardado && (
            <span className={`text-xs font-bold ${guardado.includes('Completa') || guardado.includes('Faltan') || guardado.includes('cantidades') ? 'text-red-400' : 'text-emerald-400'}`}>
              {guardado}
            </span>
          )}
          <button onClick={descargarPDF} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500">
            <FiDownload size={14} /> Descargar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Datos principales */}
        <div className="panel space-y-5 p-6 xl:col-span-2">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
              <FiSave size={16} />
            </span>
            <h3 className="font-bold text-white">Datos de la cotización</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label-form">N° de cotización</label>
              <input value={form.numero} onChange={set('numero')} className="input-field" />
            </div>
            <div>
              <label className="label-form">Fecha</label>
              <input type="date" value={form.fecha} onChange={set('fecha')} className="input-field" />
            </div>
            <div>
              <label className="label-form">Válida hasta</label>
              <input type="date" value={form.valida} onChange={set('valida')} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-form">Empresa / Razón social</label>
            <input value={form.empresa} onChange={set('empresa')} className="input-field" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label-form">Cliente *</label>
              <input value={form.cliente} onChange={set('cliente')} placeholder="Nombre del cliente" className="input-field" />
            </div>
            <div>
              <label className="label-form">RUC / DNI *</label>
              <input value={form.dxc} onChange={set('dxc')} placeholder="12345678" className="input-field" />
            </div>
            <div>
              <label className="label-form">Teléfono *</label>
              <input value={form.telefono} onChange={set('telefono')} placeholder="999 999 999" className="input-field" />
            </div>
            <div>
              <label className="label-form">Email *</label>
              <input value={form.email} onChange={set('email')} placeholder="cliente@correo.com" className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-form">Dirección</label>
            <input value={form.direccion} onChange={set('direccion')} placeholder="Dirección del cliente" className="input-field" />
          </div>
        </div>

        {/* Items */}
        <div className="panel flex flex-col gap-4 p-6 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 ring-1 ring-violet-500/30">
                <FiFileText size={16} />
              </span>
              <h3 className="font-bold text-white">Detalle de productos</h3>
            </div>
            <button onClick={agregarFila} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-violet-500">
              <FiPlus size={13} /> Agregar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 pr-2 font-semibold">Descripción</th>
                  <th className="w-20 py-2.5 px-2 font-semibold">Cant.</th>
                  <th className="w-28 py-2.5 px-2 font-semibold">P. unit.</th>
                  <th className="w-32 py-2.5 px-2 font-semibold text-right">Importe</th>
                  <th className="w-10 py-2.5 pl-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <input
                        value={it.descripcion}
                        onChange={(e) => setItem(idx, 'descripcion', e.target.value)}
                        placeholder="Ej. Impresión de 50 hojas B/N"
                        className="input-field !py-2"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) => setItem(idx, 'cantidad', e.target.value)}
                        className="input-field !py-2 text-center"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.precio}
                        onChange={(e) => setItem(idx, 'precio', e.target.value)}
                        placeholder="0.00"
                        className="input-field !py-2 text-right"
                      />
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-white">
                      {fmt((Number(it.cantidad) || 0) * (Number(it.precio) || 0))}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        onClick={() => quitarFila(idx)}
                        disabled={items.length === 1}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-600/15 hover:text-red-400 disabled:opacity-30"
                        title="Quitar fila"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales y notas */}
        <div className="space-y-6 xl:col-span-1">
          <div className="panel space-y-3 p-6">
            <h3 className="font-bold text-white">Totales</h3>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-white">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>IGV (18%)</span>
              <span className="font-semibold text-white">{fmt(igv)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-blue-600/15 px-4 py-3 ring-1 ring-blue-500/30">
              <span className="text-sm font-bold text-blue-300">TOTAL</span>
              <span className="text-lg font-black text-blue-300">{fmt(total)}</span>
            </div>
          </div>

          <div className="panel p-6">
            <label className="label-form">Notas / Observaciones</label>
            <textarea
              value={form.notas}
              onChange={set('notas')}
              rows={4}
              placeholder="Ej. Precios incluyen IGV. Vigencia de la cotización 15 días, etc."
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={descargarPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
        >
          <FiDownload size={16} /> Descargar PDF
        </button>
      </div>
    </div>
  )
}