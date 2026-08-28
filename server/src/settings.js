import { Router } from 'express'
import { pool } from './db.js'

export function settingsRouter(_io) {
  const r = Router()

  // GET /api/settings/:userId -> devuelve un objeto { clave: valor }
  r.get('/:userId', async (req, res) => {
    try {
      const q = await pool.query('SELECT clave, valor FROM user_settings WHERE user_id=$1', [req.params.userId])
      const obj = {}
      q.rows.forEach((r) => (obj[r.clave] = r.valor))
      res.json(obj)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // PUT /api/settings/:userId  body: { clave, valor }  (upsert)
  r.put('/:userId', async (req, res) => {
    try {
      const { clave, valor } = req.body
      if (!clave) return res.status(400).json({ ok: false, error: 'Falta la clave.' })
      await pool.query(
        `INSERT INTO user_settings (user_id, clave, valor) VALUES ($1,$2,$3)
         ON CONFLICT (user_id, clave) DO UPDATE SET valor=$3`,
        [req.params.userId, clave, String(valor ?? '')],
      )
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
