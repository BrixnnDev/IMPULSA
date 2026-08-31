import { Router } from 'express'
import { randomBytes } from 'crypto'
import { pool } from './db.js'

const CHARS = '0123456789'

// Genera un código de 6 dígitos numéricos
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
    avatar_url: u.avatar_url || '',
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
      const code = String(codigo).trim().toUpperCase()
      const q = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
      if (found.verificado) return res.json({ ok: true, user: publicUser(found), yaVerificado: true })

      const verificadoEn = new Date().toISOString()

      // 1) La key es una KEY DE INVITACIÓN del admin con rol asignado
      const kq = await pool.query('SELECT * FROM keys WHERE codigo = $1 AND usado = FALSE', [code])
      const key = kq.rows[0]
      if (key) {
        await pool.query(
          'UPDATE users SET verificado = TRUE, verificado_en = $1, rol = $2 WHERE id = $3',
          [verificadoEn, key.rol, found.id],
        )
        await pool.query('UPDATE keys SET usado = TRUE, user_id = $1 WHERE id = $2', [found.id, key.id])
        found.verificado = true
        found.verificado_en = verificadoEn
        found.rol = key.rol
        console.log(`[users] Verificado con key (${key.rol}): ${found.email}`)
        io.emit('user:verificado', { id: found.id, name: found.name, email: found.email, rol: found.rol })
        return res.json({ ok: true, user: publicUser(found) })
      }

      // 2) Si no, la key es el CÓDIGO propio generado al registrarse
      if (String(found.codigo).toUpperCase() !== code) {
        return res.status(400).json({ ok: false, error: 'Código incorrecto.' })
      }
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

  // Lista de usuarios (admin) - incluye cuenta de keys de acceso y código de key de invitación usada
  r.get('/list', async (_req, res) => {
    try {
      const q = await pool.query(`
        SELECT u.*,
          COUNT(ak.id) FILTER (WHERE ak.activo = TRUE) AS keys_activas,
          COUNT(ak.id) AS keys_total,
          (SELECT k.codigo FROM keys k WHERE k.user_id = u.id AND k.usado = TRUE ORDER BY k.creado DESC LIMIT 1) AS key_codigo
        FROM users u
        LEFT JOIN access_keys ak ON ak.user_id = u.id
        GROUP BY u.id
        ORDER BY u.creado ASC
      `)
      res.json(q.rows.map(u => ({
        ...publicUser(u),
        keys_total: parseInt(u.keys_total) || 0,
        keys_activas: parseInt(u.keys_activas) || 0,
        key_codigo: u.key_codigo || '',
      })))
    } catch (e) {
      console.error('[users] list:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Generar nueva access key para usuario
  r.post('/:id/keys', async (req, res) => {
    try {
      const { nombre } = req.body
      const userId = req.params.id
      const q = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
      if (!q.rows[0]) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
      const keyId = `k-${Date.now().toString(36)}`
      const rawKey = `sk_${randomBytes(24).toString('hex')}`
      const keyHash = randomBytes(32).toString('hex')
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO access_keys (id, user_id, key_hash, nombre, activo, creado)
         VALUES ($1,$2,$3,$4,TRUE,$5)`,
        [keyId, userId, keyHash, nombre || 'API Key', creado],
      )
      res.json({ ok: true, key: { id: keyId, key: rawKey, nombre: nombre || 'API Key', activo: true, creado } })
    } catch (e) {
      console.error('[users] create-key:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Listar keys de un usuario
  r.get('/:id/keys', async (req, res) => {
    try {
      const q = await pool.query('SELECT id, nombre, activo, creado, usado_en FROM access_keys WHERE user_id = $1 ORDER BY creado DESC', [req.params.id])
      res.json({ ok: true, keys: q.rows })
    } catch (e) {
      console.error('[users] list-keys:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Revocar key
  r.delete('/:id/keys/:keyId', async (req, res) => {
    try {
      await pool.query('UPDATE access_keys SET activo = FALSE WHERE id = $1 AND user_id = $2', [req.params.keyId, req.params.id])
      res.json({ ok: true })
    } catch (e) {
      console.error('[users] revoke-key:', e.message)
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

  // Actualizar perfil (nombre, telefono, avatar)
  r.patch('/:id', async (req, res) => {
    try {
      const { name, telefono, avatar_url } = req.body
      const fields = []
      const vals = []
      if (name?.trim()) { fields.push(`name = $${fields.length + 1}`); vals.push(name.trim()) }
      if (telefono !== undefined) { fields.push(`telefono = $${fields.length + 1}`); vals.push(telefono) }
      if (avatar_url !== undefined) { fields.push(`avatar_url = $${fields.length + 1}`); vals.push(avatar_url) }
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

  // ---- KEYS DE INVITACIÓN (admin) ----

  // Crear una key con rol asignado (genera 6 dígitos automáticamente)
  r.post('/keys', async (req, res) => {
    try {
      const { rol } = req.body
      const rolFinal = ['admin', 'digitador', 'pos'].includes(rol) ? rol : 'digitador'
      let codigo = generarCodigo()
      // Evitar duplicados
      for (let i = 0; i < 5; i++) {
        const dup = await pool.query('SELECT 1 FROM keys WHERE codigo = $1', [codigo])
        if (!dup.rowCount) break
        codigo = generarCodigo()
      }
      const id = `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO keys (id, codigo, rol, usado, creado_por, creado)
         VALUES ($1,$2,$3,FALSE,$4,$5)`,
        [id, codigo, rolFinal, req.body.creado_por || '', creado],
      )
      console.log(`[keys] Creada key ${codigo} con rol ${rolFinal}`)
      res.json({ ok: true, key: { id, codigo, rol: rolFinal, usado: false, creado_por: req.body.creado_por || '', creado } })
    } catch (e) {
      console.error('[keys] create:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Listar keys (admin)
  r.get('/keys', async (_req, res) => {
    try {
      const q = await pool.query(`
        SELECT k.*, u.name AS user_name, u.email AS user_email
        FROM keys k
        LEFT JOIN users u ON u.id = k.user_id
        ORDER BY k.creado DESC
      `)
      res.json(q.rows)
    } catch (e) {
      console.error('[keys] list:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Eliminar key (admin)
  r.delete('/keys/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM keys WHERE id = $1', [req.params.id])
      res.json({ ok: true })
    } catch (e) {
      console.error('[keys] delete:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
