import { Router } from 'express'
import { randomBytes } from 'crypto'
import { pool } from './db.js'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo() {
  const bytes = randomBytes(6)
  let code = ''
  for (let i = 0; i < 6; i++) code += CHARS[bytes[i] % CHARS.length]
  return code
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    telefono: u.telefono,
    rol: u.rol,
    verificado: u.verificado,
    codigo: u.codigo,
    creado: u.creado,
    verificadoEn: u.verificado_en || null,
  }
}

export function usersRouter(io) {
  const r = Router()

  // Registro de usuario (rol por defecto digitador, sin verificar)
  r.post('/register', async (req, res) => {
    try {
      const { name, email, password, telefono } = req.body
      if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios.' })
      }
      const exist = await pool.query('SELECT 1 FROM users WHERE email = $1', [email.trim().toLowerCase()])
      if (exist.rowCount) return res.status(409).json({ ok: false, error: 'Este correo ya está registrado.' })

      const codigo = generarCodigo()
      const id = `u-${Date.now().toString(36)}`
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO users (id, name, email, password, telefono, rol, verificado, codigo, creado)
         VALUES ($1,$2,$3,$4,$5,'digitador',FALSE,$6,$7)`,
        [id, name.trim(), email.trim().toLowerCase(), password, telefono || '', codigo, creado],
      )
      const user = {
        id, name: name.trim(), email: email.trim().toLowerCase(), telefono: telefono || '',
        rol: 'digitador', verificado: false, codigo, creado, verificado_en: null,
      }
      console.log(`[users] Registro: ${user.email} → código: ${codigo}`)
      io.emit('user:registro', { id: user.id, name: user.name, email: user.email, codigo, rol: user.rol })
      return res.json({ ok: true, user: publicUser(user) })
    } catch (e) {
      console.error('[users] register:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Login: devuelve si el usuario está verificado o necesita código
  r.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ ok: false, error: 'Faltan credenciales.' })
      const q = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()])
      const found = q.rows[0]
      if (!found || found.password !== password) {
        return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' })
      }
      return res.json({ ok: true, user: publicUser(found), requiereVerificacion: !found.verificado })
    } catch (e) {
      console.error('[users] login:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Verificación con código
  r.post('/verify', async (req, res) => {
    try {
      const { email, codigo } = req.body
      if (!email || !codigo) return res.status(400).json({ ok: false, error: 'Faltan datos.' })
      const q = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
      if (found.verificado) return res.json({ ok: true, user: publicUser(found), yaVerificado: true })
      if (String(found.codigo).toUpperCase() !== String(codigo).toUpperCase()) {
        return res.status(400).json({ ok: false, error: 'Código incorrecto.' })
      }
      const verificadoEn = new Date().toISOString()
      await pool.query('UPDATE users SET verificado = TRUE, verificado_en = $1 WHERE id = $2', [verificadoEn, found.id])
      found.verificado = true
      found.verificado_en = verificadoEn
      console.log(`[users] Verificado: ${found.email} (${found.rol})`)
      io.emit('user:verificado', { id: found.id, name: found.name, email: found.email, rol: found.rol })
      return res.json({ ok: true, user: publicUser(found) })
    } catch (e) {
      console.error('[users] verify:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Lista de usuarios (admin)
  r.get('/list', async (_req, res) => {
    try {
      const q = await pool.query('SELECT * FROM users ORDER BY creado ASC')
      res.json(q.rows.map(publicUser))
    } catch (e) {
      console.error('[users] list:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Cambiar rol (admin)
  r.patch('/:id/rol', async (req, res) => {
    try {
      const { rol } = req.body
      if (!['admin', 'digitador', 'pos'].includes(rol)) return res.status(400).json({ ok: false, error: 'Rol no válido.' })
      const q = await pool.query('UPDATE users SET rol = $1 WHERE id = $2 RETURNING *', [rol, req.params.id])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
      io.emit('user:rol', { id: found.id, rol })
      res.json({ ok: true, user: publicUser(found) })
    } catch (e) {
      console.error('[users] rol:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Actualizar perfil (nombre, telefono)
  r.patch('/:id', async (req, res) => {
    try {
      const { name, telefono } = req.body
      const fields = []
      const vals = []
      if (name?.trim()) { fields.push(`name = $${fields.length + 1}`); vals.push(name.trim()) }
      if (telefono !== undefined) { fields.push(`telefono = $${fields.length + 1}`); vals.push(telefono) }
      if (!fields.length) return res.status(400).json({ ok: false, error: 'Sin cambios.' })
      vals.push(req.params.id)
      const q = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals)
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
      res.json({ ok: true, user: publicUser(found) })
    } catch (e) {
      console.error('[users] patch:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Resetear contraseña
  r.post('/reset', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ ok: false, error: 'Faltan datos.' })
      const q = await pool.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING id', [password, email.trim().toLowerCase()])
      if (!q.rowCount) return res.status(404).json({ ok: false, error: 'No existe una cuenta con ese correo.' })
      res.json({ ok: true })
    } catch (e) {
      console.error('[users] reset:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Crear usuario manualmente por admin (genera código de verificación)
  r.post('/create', async (req, res) => {
    try {
      const { name, email, rol, password } = req.body
      if (!name?.trim() || !email?.trim()) return res.status(400).json({ ok: false, error: 'Faltan campos.' })
      const exist = await pool.query('SELECT 1 FROM users WHERE email = $1', [email.trim().toLowerCase()])
      if (exist.rowCount) return res.status(409).json({ ok: false, error: 'Ese correo ya existe.' })
      const codigo = generarCodigo()
      const id = `u-${Date.now().toString(36)}`
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO users (id, name, email, password, telefono, rol, verificado, codigo, creado)
         VALUES ($1,$2,$3,$4,'','',FALSE,$5,$6)`,
        [id, name.trim(), email.trim().toLowerCase(), password || '123456', codigo, creado],
      )
      const user = { id, name: name.trim(), email: email.trim().toLowerCase(), telefono: '', rol: rol || 'digitador', verificado: false, codigo, creado, verificado_en: null }
      console.log(`[users] Admin creó: ${user.email} (${user.rol}) → código: ${codigo}`)
      io.emit('user:registro', { id: user.id, name: user.name, email: user.email, codigo, rol: user.rol })
      res.json({ ok: true, user: publicUser(user) })
    } catch (e) {
      console.error('[users] create:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Eliminar usuario (admin)
  r.delete('/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
      res.json({ ok: true })
    } catch (e) {
      console.error('[users] delete:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
