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
        estado: req.body.estado || 'Pendiente',
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
