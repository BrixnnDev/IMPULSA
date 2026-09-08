import { Router } from 'express'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

export function mensajesRouter(io) {
  const r = Router()

  // Lista de contactos (usuarios con los que existe conversación) + último mensaje + no leídos
  r.get('/usuarios', async (req, res) => {
    try {
      const deUser = req.query.de_user || ''
      if (!deUser) return res.status(400).json({ ok: false, error: 'Falta de_user.' })
      const q = await pool.query(
        `SELECT
           c.otro AS otro_id,
           u.name, u.email, u.avatar_url, u.rol,
           (SELECT m2.texto FROM mensajes m2
             WHERE (m2.de_user = $1 AND m2.para_user = c.otro)
                OR (m2.de_user = c.otro AND m2.para_user = $1)
             ORDER BY m2.fecha DESC LIMIT 1) AS ultimo,
           c.fecha AS ultima_fecha,
           c.no_leidos
         FROM (
           SELECT
             (CASE WHEN de_user = $1 THEN para_user ELSE de_user END) AS otro,
             MAX(fecha) AS fecha,
             COUNT(*) FILTER (WHERE para_user = $1 AND leido = FALSE) AS no_leidos
           FROM mensajes
           WHERE de_user = $1 OR para_user = $1
           GROUP BY otro
         ) c
         JOIN users u ON u.id = c.otro
         ORDER BY c.fecha DESC`,
        [deUser],
      )
      res.json(q.rows.map((row) => ({
        id: row.otro_id,
        name: row.name,
        email: row.email,
        avatar_url: row.avatar_url || '',
        rol: row.rol,
        ultimo: row.ultimo || '',
        ultimaFecha: row.ultima_fecha || '',
        noLeidos: parseInt(row.no_leidos) || 0,
      })))
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Conversación entre dos usuarios
  r.get('/conversacion', async (req, res) => {
    try {
      const { de_user, para_user } = req.query
      if (!de_user || !para_user) return res.status(400).json({ ok: false, error: 'Faltan de_user/para_user.' })
      const q = await pool.query(
        `SELECT * FROM mensajes
         WHERE (de_user = $1 AND para_user = $2) OR (de_user = $2 AND para_user = $1)
         ORDER BY fecha ASC`,
        [de_user, para_user],
      )
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Enviar mensaje
  r.post('/', async (req, res) => {
    try {
      const { de_user, para_user, texto } = req.body
      if (!de_user || !para_user || !String(texto || '').trim()) {
        return res.status(400).json({ ok: false, error: 'Faltan de_user/para_user/texto.' })
      }
      const fila = {
        id: `MSG-${randomUUID().slice(0, 8).toUpperCase()}`,
        de_user,
        para_user,
        texto: String(texto).trim(),
        leido: false,
        fecha: new Date().toISOString(),
      }
      await pool.query(
        `INSERT INTO mensajes (id, de_user, para_user, texto, leido, fecha) VALUES ($1,$2,$3,$4,$5,$6)`,
        [fila.id, fila.de_user, fila.para_user, fila.texto, fila.leido, fila.fecha],
      )
      io.emit('mensaje:new', fila)
      res.json({ ok: true, mensaje: fila })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Marcar como leídos los mensajes que un usuario me envió
  r.patch('/leido', async (req, res) => {
    try {
      const { de_user, para_user } = req.body
      if (!de_user || !para_user) return res.status(400).json({ ok: false, error: 'Faltan de_user/para_user.' })
      await pool.query(
        `UPDATE mensajes SET leido = TRUE WHERE para_user = $1 AND de_user = $2 AND leido = FALSE`,
        [de_user, para_user],
      )
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
