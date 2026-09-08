import { Router } from 'express'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

export function webAccesosRouter(io) {
  const r = Router()

  // ── Carpetas ──────────────────────────────────────────────

  // Listar carpetas
  r.get('/carpetas', async (req, res) => {
    try {
      const { user_id } = req.query
      const q = user_id
        ? await pool.query('SELECT * FROM web_carpetas WHERE user_id=$1 ORDER BY creado ASC', [user_id])
        : await pool.query('SELECT * FROM web_carpetas ORDER BY creado ASC')
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Crear carpeta
  r.post('/carpetas', async (req, res) => {
    try {
      const { nombre, user_id } = req.body
      if (!nombre?.trim()) return res.status(400).json({ ok: false, error: 'Nombre requerido.' })
      const id = `wc-${randomUUID().slice(0, 8)}`
      const creado = new Date().toISOString()
      await pool.query(
        'INSERT INTO web_carpetas (id, nombre, user_id, creado) VALUES ($1,$2,$3,$4)',
        [id, nombre.trim(), user_id || 'global', creado],
      )
      const carp = { id, nombre: nombre.trim(), user_id: user_id || 'global', creado }
      io.emit('webcarpeta:new', carp)
      res.json({ ok: true, carpeta: carp })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Eliminar carpeta (y sus accesos)
  r.delete('/carpetas/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM web_accesos WHERE carpeta_id=$1', [req.params.id])
      await pool.query('DELETE FROM web_carpetas WHERE id=$1', [req.params.id])
      io.emit('webcarpeta:removed', req.params.id)
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // ── Accesos ───────────────────────────────────────────────

  // Listar accesos (filtrar por carpeta opcional)
  r.get('/accesos', async (req, res) => {
    try {
      const { carpeta_id } = req.query
      const q = carpeta_id
        ? await pool.query('SELECT * FROM web_accesos WHERE carpeta_id=$1 ORDER BY creado DESC', [carpeta_id])
        : await pool.query('SELECT * FROM web_accesos ORDER BY creado DESC')
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Crear acceso
  r.post('/accesos', async (req, res) => {
    try {
      const { carpeta_id, url, nombre, creado_por } = req.body
      if (!carpeta_id || !url?.trim()) return res.status(400).json({ ok: false, error: 'Faltan carpeta_id o url.' })
      const id = `wa-${randomUUID().slice(0, 8)}`
      const creado = new Date().toISOString()
      const finalUrl = url.trim().includes('://') ? url.trim() : `https://${url.trim()}`
      await pool.query(
        'INSERT INTO web_accesos (id, carpeta_id, url, nombre, creado_por, creado) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, carpeta_id, finalUrl, nombre?.trim() || finalUrl, creado_por || '', creado],
      )
      const acceso = { id, carpeta_id, url: finalUrl, nombre: nombre?.trim() || finalUrl, creado_por: creado_por || '', creado }
      io.emit('webacceso:new', acceso)
      res.json({ ok: true, acceso })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Eliminar acceso
  r.delete('/accesos/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM web_accesos WHERE id=$1', [req.params.id])
      io.emit('webacceso:removed', req.params.id)
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
