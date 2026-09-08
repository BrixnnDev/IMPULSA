import { Router } from 'express'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

export function comisionesRouter(io) {
  const r = Router()

  // POST  -> registrar comisión (50/50 split se hace en frontend o aquí si no se manda ganancia)
  r.post('/', async (req, res) => {
    const { user_id, trabajador, trabajo_id, total, ganancia, panaderia, nota } = req.body
    const totalNum = Number(total) || 0
    const gananciaNum = ganancia != null ? Number(ganancia) : totalNum / 2
    const panaderiaNum = panaderia != null ? Number(panaderia) : totalNum - gananciaNum
    try {
      const id = `COM-${randomUUID().slice(0, 6).toUpperCase()}`
      const fila = {
        id,
        user_id: user_id || '',
        trabajador: trabajador || '',
        trabajo_id: trabajo_id || '',
        total: totalNum,
        ganancia: gananciaNum,
        panaderia: panaderiaNum,
        nota: nota || '',
        estado: 'Pendiente',
        aprobado: false,
        local: '',
        fecha: new Date().toISOString(),
      }
      await pool.query(
        `INSERT INTO comisiones (id,user_id,trabajador,trabajo_id,total,ganancia,panaderia,nota,estado,fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [fila.id, fila.user_id, fila.trabajador, fila.trabajo_id, fila.total, fila.ganancia, fila.panaderia, fila.nota, fila.estado, fila.fecha],
      )
      io.emit('comision:new', fila)
      res.json({ ok: true, comision: fila })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // GET  -> listar comisiones (filtrar por user_id si se pasa)
  r.get('/', async (req, res) => {
    try {
      const { user_id } = req.query
      let q
      if (user_id) {
        q = await pool.query('SELECT * FROM comisiones WHERE user_id=$1 ORDER BY fecha DESC', [user_id])
      } else {
        q = await pool.query('SELECT * FROM comisiones ORDER BY fecha DESC')
      }
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // PATCH -> aprobar o rechazar un valecito desde un local (KYB1 / KYB2).
  // Si se aprueba, se guarda una entrada de la comisión en la carpeta del digitador.
  r.patch('/:id/aprobar', async (req, res) => {
    try {
      const { local, aprobar, aprobado_por } = req.body
      const q = await pool.query('SELECT * FROM comisiones WHERE id=$1', [req.params.id])
      const com = q.rows[0]
      if (!com) return res.status(404).json({ ok: false, error: 'Comisión no encontrada.' })

      const esAprobacion = Boolean(aprobar)
      const estado = esAprobacion ? 'Aprobado' : 'Rechazado'
      const aprobadoEn = new Date().toISOString()
      await pool.query(
        `UPDATE comisiones
         SET aprobado=$1, local=$2, aprobado_por=$3, aprobado_en=$4, estado=$5
         WHERE id=$6`,
        [esAprobacion, esAprobacion ? (local || '') : '', aprobado_por || '', esAprobacion ? aprobadoEn : '', estado, req.params.id],
      )

      io.emit('comision:update', {
        id: req.params.id,
        estado,
        aprobado: esAprobacion,
        local: esAprobacion ? local || '' : '',
      })

      // Si fue aprobado, guardar entrada en la carpeta del digitador
      if (esAprobacion) {
        try {
          const nombreCarpeta = (com.trabajador || '').trim() || 'Usuarios'
          const exist = await pool.query('SELECT 1 FROM carpetas WHERE nombre=$1', [nombreCarpeta])
          if (!exist.rowCount) {
            await pool.query(
              `INSERT INTO carpetas (id, nombre, creado_por, fecha) VALUES ($1,$2,$3,$4)`,
              [`carp-${randomUUID().slice(0, 8)}`, nombreCarpeta, aprobado_por || '', new Date().toISOString()],
            )
            io.emit('doc:carpeta', { nombre: nombreCarpeta, creado_por: aprobado_por || '', fecha: new Date().toISOString() })
          }
          const docId = `VC-${randomUUID().slice(0, 8).toUpperCase()}`
          const detalle = com.nota ? ` · ${com.nota}` : ''
          await pool.query(
            `INSERT INTO documents (id,nombre,tipo,tamano,ruta,carpeta,subido_por,user_id,fecha,estado)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              docId,
              `Valecito ${com.id} · S/ ${Number(com.total).toFixed(2)}${detalle}`,
              'Valecito',
              0,
              '',
              nombreCarpeta,
              aprobado_por || '',
              com.user_id || '',
              aprobadoEn,
              'Aprobado',
            ],
          )
          io.emit('doc:new', { id: docId, carpeta: nombreCarpeta, fecha: aprobadoEn })
        } catch (e) {
          console.warn('[comisiones] guardar en carpeta:', e.message)
        }
      }

      res.json({ ok: true, comision: { ...com, estado, aprobado: esAprobacion, local: esAprobacion ? local || '' : '' } })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // PATCH -> marcar Pagado/Cobrar
  r.patch('/:id/estado', async (req, res) => {
    try {
      const { estado } = req.body
      await pool.query('UPDATE comisiones SET estado=$1 WHERE id=$2', [estado || 'Pagado', req.params.id])
      io.emit('comision:update', { id: req.params.id, estado: estado || 'Pagado' })
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  r.delete('/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM comisiones WHERE id=$1', [req.params.id])
      io.emit('comision:removed', req.params.id)
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
