import { Router } from 'express'
import { randomUUID } from 'crypto'
import multer from 'multer'
import path from 'path'
import { pool } from './db.js'

// El agente puede adjuntar el documento real capturado del spooler de Windows.
const uploadPrint = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const pcState = new Map()
let ioRef = null

const cleanCode = (c) => c.replace(/-/g, '').toUpperCase()

function generarCodigo() {
  return randomUUID().slice(0, 6).toUpperCase()
}

async function todosLosPcs() {
  const q = await pool.query('SELECT * FROM pcs ORDER BY fecha_creacion ASC')
  return q.rows.map((pc) => {
    const s = pcState.get(pc.id) || pcState.get(pc.etiqueta)
    return {
      ...pc,
      online: s ? Date.now() - s.lastSeen < 30000 : false,
      lastSeen: s?.lastSeen || null,
    }
  })
}

export function pcRouter(io) {
  ioRef = io
  const r = Router()

  // Admin crea carpeta: el nombre y correo salen del usuario seleccionado
  r.post('/register', async (req, res) => {
    try {
      const { nombre, usuario_id } = req.body
      if (!usuario_id && !nombre?.trim()) {
        return res.status(400).json({ ok: false, error: 'Selecciona un usuario.' })
      }

      let etiqueta = (nombre || '').trim()
      let responsable = etiqueta
      let email = ''
      let avatar_url = ''
      let rol = 'digitador'
      let uid = ''

      if (usuario_id) {
        const uq = await pool.query('SELECT id, name, email, avatar_url, rol FROM users WHERE id = $1', [usuario_id])
        const u = uq.rows[0]
        if (!u) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
        uid = u.id
        etiqueta = u.name
        responsable = u.name
        email = u.email || ''
        avatar_url = u.avatar_url || ''
        rol = u.rol || 'digitador'
      }

      const id = `pc-${Date.now().toString(36)}`
      const codigo = generarCodigo()
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO pcs (id, etiqueta, responsable, email, avatar_url, rol, usuario_id, codigo, emparejada, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9)`,
        [id, etiqueta, responsable, email, avatar_url, rol, uid, codigo, creado],
      )
      const pc = { id, etiqueta, responsable, email, avatar_url, rol, usuario_id: uid, ip: '', mac: '', sistema: '', ubicacion: '', codigo, emparejada: false, fecha_creacion: creado }
      console.log(`[pc] Carpeta creada: ${pc.etiqueta} → ${responsable} (${uid || 'sin usuario'}) → código: ${codigo}`)
      res.json({ ok: true, pc })
    } catch (e) {
      console.error('[pc] register:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Script se registra con código único que él generó
  r.post('/register-from-script', async (req, res) => {
    try {
      const { codigo, pc, ip, mac, sistema } = req.body
      if (!codigo || !pc) return res.status(400).json({ ok: false, error: 'Falta código o nombre.' })
      const c = cleanCode(codigo)
      let q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      let found = q.rows[0]
      if (!found) {
        const id = `pc-${Date.now().toString(36)}`
        const creado = new Date().toISOString()
        await pool.query(
          `INSERT INTO pcs (id, etiqueta, responsable, ip, mac, sistema, codigo, emparejada, fecha_creacion, fecha_emparejada)
           VALUES ($1,$2,$2,$3,$4,$5,$6,TRUE,$7,$7)`,
          [id, pc, ip || '', mac || '', sistema || '', c, creado],
        )
        found = { id, etiqueta: pc, responsable: pc, ip: ip || '', mac: mac || '', sistema: sistema || '', codigo: c, emparejada: true, fecha_creacion: creado }
        console.log(`[pc] Script registró: ${pc} (${c})`)
        io.emit('pc:paired', { id: found.id, etiqueta: found.etiqueta })
        return res.json({ ok: true, pc: found })
      }
      await pool.query(
        `UPDATE pcs SET ip = $1, mac = $2, sistema = $3, emparejada = TRUE, fecha_emparejada = $4 WHERE id = $5`,
        [ip || found.ip, mac || found.mac, sistema || found.sistema, new Date().toISOString(), found.id],
      )
      found = (await pool.query('SELECT * FROM pcs WHERE id = $1', [found.id])).rows[0]
      console.log(`[pc] Script emparejó: ${found.etiqueta} (${codigo})`)
      io.emit('pc:paired', { id: found.id, etiqueta: found.etiqueta })
      res.json({ ok: true, pc: found })
    } catch (e) {
      console.error('[pc] register-from-script:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // El script en la PC se empareja con el código que el admin creó
  r.post('/pair', async (req, res) => {
    try {
      const { codigo, pc, ip, mac, sistema } = req.body
      if (!codigo) return res.status(400).json({ ok: false, error: 'Falta el código.' })
      const c = cleanCode(codigo)
      const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Código no válido.' })
      await pool.query(
        `UPDATE pcs SET etiqueta = $1, ip = $2, mac = $3, sistema = $4, emparejada = TRUE, fecha_emparejada = $5 WHERE id = $6`,
        [pc || found.etiqueta, ip || found.ip, mac || found.mac, sistema || found.sistema, new Date().toISOString(), found.id],
      )
      const updated = (await pool.query('SELECT * FROM pcs WHERE id = $1', [found.id])).rows[0]
      io.emit('pc:paired', { id: updated.id, etiqueta: updated.etiqueta })
      console.log(`[pc] Emparejada: ${updated.etiqueta} (${codigo})`)
      res.json({ ok: true, pc: updated })
    } catch (e) {
      console.error('[pc] pair:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Heartbeat: el script manda info cada 30 seg
  r.post('/heartbeat', async (req, res) => {
    try {
      const { pc, pc_name, ip, mac, sistema, ubicacion, codigo, pairing_code } = req.body
      const nombre = pc || pc_name
      const c = cleanCode(codigo || pairing_code || '')
      if (!nombre && !c) return res.status(400).json({ ok: false })
      let found = null
      if (c) {
        const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1 LIMIT 1', [c])
        found = q.rows[0] || null
      }
      if (!found && nombre) {
        const q = await pool.query('SELECT * FROM pcs WHERE etiqueta = $1 OR id = $1 LIMIT 1', [nombre])
        found = q.rows[0] || null
      }
      if (found) {
        await pool.query(
          `UPDATE pcs SET etiqueta = $1, ip = $2, mac = $3, sistema = $4, ubicacion = $5, emparejada = TRUE WHERE id = $6`,
          [nombre || found.etiqueta, ip || found.ip, mac || found.mac, sistema || found.sistema, ubicacion || found.ubicacion, found.id],
        )
      }
      const key = found ? found.id : nombre
      const ipDetectada = req.ip || req.connection?.remoteAddress || ''
      const wasOnline = pcState.get(key)?.online || false
      pcState.set(key, { lastSeen: Date.now(), ip: ipDetectada, online: true })
      if (found) pcState.set(found.etiqueta, { lastSeen: Date.now(), ip: ipDetectada, online: true })
      const statusName = found ? found.etiqueta : nombre
      if (!wasOnline) {
        io.emit('pc:status', { pc: statusName, online: true })
        console.log(`[pc] ${statusName} conectada`)
      }
      res.json({ ok: true })
    } catch (e) {
      console.error('[pc] heartbeat:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Lista de PCs
  r.get('/list', async (_req, res) => {
    try { res.json(await todosLosPcs()) } catch (e) { console.error('[pc] list:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Evento de impresión: el agente reporta la impresión real de Windows.
  // Acepta JSON (solo metadata) o multipart con el documento capturado.
  r.post('/print', uploadPrint.single('file'), async (req, res) => {
    try {
      const { pc, documento, paginas, copias, usuario, impresora, fecha, evento_id } = req.body
      if (!pc || !documento) return res.status(400).json({ ok: false })
      const q = await pool.query('SELECT * FROM pcs WHERE id = $1 OR codigo = $1 OR etiqueta = $1 LIMIT 1', [pc])
      const found = q.rows[0]
      const fechaReal = fecha && !Number.isNaN(new Date(fecha).getTime()) ? new Date(fecha) : new Date()
      const id = evento_id ? `PRN-${String(evento_id).replace(/[^A-Za-z0-9_-]/g, '')}` : `PRN-${Date.now().toString(36)}`
      const archivo = req.file
      const registro = {
        id,
        pc: found ? found.etiqueta : pc,
        responsable: found ? found.responsable : pc,
        usuario_id: found?.usuario_id || '',
        usuario: usuario || found?.responsable || pc,
        impresora: impresora || '',
        documento,
        paginas: Number(paginas) || 1,
        copias: Number(copias) || 1,
        hora: fechaReal.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        fecha: fechaReal.toISOString(),
        estado: 'Impreso',
        archivo_nombre: archivo?.originalname || '',
        archivo_tipo: archivo?.mimetype || '',
        archivo_size: archivo?.size || 0,
        tieneArchivo: Boolean(archivo),
      }
      // La metadata suele llegar antes que el .spl (la tarea corre cada minuto).
      // Un mismo evento_id debe quedar como UN solo registro: si después llega
      // el archivo, se adjunta; si llega primero, la metadata no lo borra.
      const ins = await pool.query(
        `INSERT INTO prints (id, pc, responsable, documento, paginas, copias, hora, fecha, estado, usuario, impresora, usuario_id, archivo, archivo_nombre, archivo_tipo, archivo_size)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           archivo = COALESCE(EXCLUDED.archivo, prints.archivo),
           archivo_nombre = COALESCE(NULLIF(EXCLUDED.archivo_nombre, ''), prints.archivo_nombre),
           archivo_tipo = COALESCE(NULLIF(EXCLUDED.archivo_tipo, ''), prints.archivo_tipo),
           archivo_size = GREATEST(prints.archivo_size, EXCLUDED.archivo_size),
           documento = COALESCE(NULLIF(EXCLUDED.documento, ''), prints.documento),
           usuario = COALESCE(NULLIF(EXCLUDED.usuario, ''), prints.usuario),
           impresora = COALESCE(NULLIF(EXCLUDED.impresora, ''), prints.impresora),
           fecha = EXCLUDED.fecha
         RETURNING archivo_nombre, archivo_tipo, archivo_size`,
        [
          registro.id, registro.pc, registro.responsable, registro.documento,
          registro.paginas, registro.copias, registro.hora, registro.fecha, registro.estado,
          registro.usuario, registro.impresora, registro.usuario_id,
          archivo?.buffer || null, registro.archivo_nombre, registro.archivo_tipo, registro.archivo_size,
        ],
      )
      await pool.query(`DELETE FROM prints WHERE id NOT IN (SELECT id FROM prints ORDER BY fecha DESC LIMIT 500)`)
      const guardado = ins.rows[0] || {}
      registro.archivo_nombre = guardado.archivo_nombre || ''
      registro.archivo_tipo = guardado.archivo_tipo || ''
      registro.archivo_size = guardado.archivo_size || 0
      registro.tieneArchivo = Boolean(registro.archivo_nombre && Number(registro.archivo_size) > 0)
      if (ins.rowCount > 0) {
        io.emit('pc:print', registro)
        console.log(`[print] ${registro.pc} (${registro.usuario}) imprimió: ${documento}${registro.tieneArchivo ? ' + documento' : ''}`)
      }
      res.json({ ok: true, registro, duplicado: false })
    } catch (e) {
      console.error('[pc] print:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Evento de escaneo: el script manda cuando alguien escanea
  r.post('/scan', async (req, res) => {
    try {
      const { pc, documento, paginas } = req.body
      if (!pc || !documento) return res.status(400).json({ ok: false })
      const q = await pool.query('SELECT * FROM pcs WHERE id = $1 OR codigo = $1 OR etiqueta = $1 LIMIT 1', [pc])
      const found = q.rows[0]
      const registro = {
        id: `ESC-${Date.now().toString(36)}`,
        pc: found ? found.etiqueta : pc,
        responsable: found ? found.responsable : pc,
        documento,
        paginas: paginas || 1,
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        fecha: new Date().toISOString(),
        estado: 'Digitalizado',
      }
      io.emit('pc:scan', registro)
      console.log(`[scan] ${registro.pc} escaneó: ${documento}`)
      res.json({ ok: true, registro })
    } catch (e) {
      console.error('[pc] scan:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Historial de impresiones (todas las PCs). Nunca devuelve el BYTEA del documento.
  r.get('/prints', async (_req, res) => {
    try {
      const q = await pool.query(
        `SELECT id, pc, responsable, documento, paginas, copias, hora, fecha, estado,
                usuario, impresora, usuario_id, archivo_nombre, archivo_tipo, archivo_size
         FROM prints ORDER BY fecha DESC`,
      )
      res.json(q.rows.map((p) => ({
        ...p,
        tieneArchivo: Boolean(p.archivo_nombre && p.archivo_size),
      })))
    } catch (e) { console.error('[pc] prints:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Documento real impreso, capturado por el agente desde el spooler de Windows.
  r.get('/prints/:id/file', async (req, res) => {
    try {
      const q = await pool.query(
        'SELECT archivo, archivo_nombre, archivo_tipo FROM prints WHERE id = $1 LIMIT 1',
        [req.params.id],
      )
      const fila = q.rows[0]
      if (!fila?.archivo) return res.status(404).json({ ok: false, error: 'Esta impresión no tiene documento adjunto.' })
      const nombre = path.basename(fila.archivo_nombre || 'documento.pdf').replace(/["\r\n]/g, '')
      const ext = path.extname(nombre).toLowerCase()
      const tipos = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      }
      res.type(tipos[ext] || fila.archivo_tipo || 'application/octet-stream')
      res.setHeader('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${nombre}"`)
      res.send(fila.archivo)
    } catch (e) { console.error('[pc] print file:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Los trabajos PCL/RAW no se pueden dibujar en el navegador. Extraemos el
  // texto legible del spool para que se pueda identificar el documento y a
  // quién se imprimió, aunque no haya una imagen renderizable.
  r.get('/prints/:id/text', async (req, res) => {
    try {
      const q = await pool.query(
        'SELECT archivo, archivo_nombre, archivo_tipo FROM prints WHERE id = $1 LIMIT 1',
        [req.params.id],
      )
      const fila = q.rows[0]
      if (!fila?.archivo) return res.status(404).json({ ok: false, error: 'Esta impresión no tiene documento adjunto.' })
      const crudo = fila.archivo.toString('latin1')
      const bloques = crudo.match(/[\x20-\x7E]{4,}/g) || []
      const texto = bloques
        .map((b) => b.trim())
        .filter((b) => b.length >= 4)
        .filter((b) => !/^[~%!]/.test(b))
        .slice(0, 300)
        .join('\n')
      res.json({
        ok: true,
        nombre: fila.archivo_nombre || '',
        tipo: fila.archivo_tipo || '',
        texto: texto || 'No se encontró texto legible en el archivo capturado.',
      })
    } catch (e) { console.error('[pc] print text:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Asignar / cambiar el usuario dueño de una PC
  r.patch('/:id', async (req, res) => {
    try {
      const { usuario_id } = req.body
      const q = await pool.query('SELECT * FROM pcs WHERE id = $1', [req.params.id])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'PC no encontrada.' })

      let responsable = found.etiqueta
      let email = ''
      let avatar_url = ''
      let rol = 'digitador'
      let uid = ''

      if (usuario_id) {
        const uq = await pool.query('SELECT id, name, email, avatar_url, rol FROM users WHERE id = $1', [usuario_id])
        const u = uq.rows[0]
        if (!u) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
        uid = u.id
        responsable = u.name
        email = u.email || ''
        avatar_url = u.avatar_url || ''
        rol = u.rol || 'digitador'
      }

      await pool.query(
        `UPDATE pcs SET usuario_id = $1, responsable = $2, email = $3, avatar_url = $4, rol = $5 WHERE id = $6`,
        [uid, responsable, email, avatar_url, rol, found.id],
      )
      const updated = (await pool.query('SELECT * FROM pcs WHERE id = $1', [found.id])).rows[0]
      io.emit('pc:paired', { id: updated.id, etiqueta: updated.etiqueta })
      console.log(`[pc] ${updated.etiqueta} vinculada a ${responsable} (${uid || 'sin usuario'})`)
      res.json({ ok: true, pc: updated })
    } catch (e) {
      console.error('[pc] patch:', e.message)
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // Borrar una impresión del historial (pruebas / correcciones)
  r.delete('/prints/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM prints WHERE id = $1', [req.params.id])
      res.json({ ok: true })
    } catch (e) { console.error('[pc] delete print:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Estado de todas las PCs
  r.get('/status', async (_req, res) => {
    try { res.json(await todosLosPcs()) } catch (e) { console.error('[pc] status:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Eliminar PC
  r.delete('/:id', async (req, res) => {
    try {
      const q = await pool.query('SELECT * FROM pcs WHERE id = $1', [req.params.id])
      const found = q.rows[0]
      await pool.query('DELETE FROM pcs WHERE id = $1', [req.params.id])
      if (found) {
        for (const k of [found.id, found.etiqueta]) pcState.delete(k)
        io.emit('pc:removed', { id: found.id, codigo: found.codigo, etiqueta: found.etiqueta })
        io.emit('pc:status', { pc: found.etiqueta, online: false })
        console.log(`[pc] ${found.etiqueta} eliminada`)
      }
      res.json({ ok: true })
    } catch (e) { console.error('[pc] delete:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Info del usuario dueño del código (para el agente)
  r.get('/user-info', async (req, res) => {
    try {
      const { code } = req.query
      if (!code) return res.status(400).json({ ok: false, error: 'Falta código.' })
      const c = cleanCode(code)
      const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Código no encontrado.' })
      res.json({ ok: true, user: { name: found.responsable || found.etiqueta || 'Sin nombre', email: found.email || '', avatar_url: found.avatar_url || '', role: found.rol || 'digitador' }, pc: { id: found.id, etiqueta: found.etiqueta, ip: found.ip, mac: found.mac, sistema: found.sistema } })
    } catch (e) { console.error('[pc] user-info:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // El agente reporta su info del sistema al emparejar
  r.post('/report-system', async (req, res) => {
    try {
      const { code, pc_name, ip, mac, sistema } = req.body
      if (!code) return res.status(400).json({ ok: false, error: 'Falta código.' })
      const c = cleanCode(code)
      const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Código no válido.' })
      await pool.query(`UPDATE pcs SET etiqueta = $1, ip = $2, mac = $3, sistema = $4, emparejada = TRUE, fecha_emparejada = $5 WHERE id = $6`, [pc_name || found.etiqueta, ip || found.ip, mac || found.mac, sistema || found.sistema, new Date().toISOString(), found.id])
      const etiqueta = pc_name || found.etiqueta
      io.emit('pc:paired', { id: found.id, etiqueta })
      io.emit('pc:connected', { id: found.id, etiqueta })
      io.emit('pc:status', { pc: etiqueta, online: true })
      io.emit('pc:system-report', { id: found.id, ip, mac, sistema })
      pcState.set(found.id, { lastSeen: Date.now(), online: true })
      pcState.set(etiqueta, { lastSeen: Date.now(), online: true })
      console.log(`[pc] ${etiqueta} conectada (report-system)`)
      res.json({ ok: true, user: { name: found.responsable || found.etiqueta || 'Sin nombre', email: found.email || '', avatar_url: found.avatar_url || '', role: found.rol || 'digitador' } })
    } catch (e) { console.error('[pc] report-system:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // La web actualiza datos del usuario dueño de la PC
  r.post('/update-user', async (req, res) => {
    try {
      const { code, name, email, avatar_url, role } = req.body
      if (!code) return res.status(400).json({ ok: false, error: 'Falta código.' })
      const c = cleanCode(code)
      const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Código no encontrado.' })
      await pool.query(`UPDATE pcs SET responsable = $1, email = $2, avatar_url = $3, rol = $4 WHERE id = $5`, [name ?? found.responsable, email ?? found.email, avatar_url ?? found.avatar_url, role ?? found.rol, found.id])
      io.emit('pc:user-updated', { id: found.id, name: name ?? found.responsable, email: email ?? found.email })
      res.json({ ok: true })
    } catch (e) { console.error('[pc] update-user:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // La web obtiene info completa de una PC por código
  r.get('/detail', async (req, res) => {
    try {
      const { code } = req.query
      if (!code) return res.status(400).json({ ok: false, error: 'Falta código.' })
      const c = cleanCode(code)
      const q = await pool.query('SELECT * FROM pcs WHERE codigo = $1', [c])
      const found = q.rows[0]
      if (!found) return res.status(404).json({ ok: false, error: 'Código no encontrado.' })
      const s = pcState.get(found.id) || pcState.get(found.etiqueta)
      res.json({ ok: true, pc: { ...found, online: s ? Date.now() - s.lastSeen < 30000 : false, lastSeen: s?.lastSeen || null } })
    } catch (e) { console.error('[pc] detail:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  return r
}

setInterval(() => {
  for (const [pc, s] of pcState) {
    if (Date.now() - s.lastSeen > 30000 && s.online) {
      s.online = false
      if (ioRef) ioRef.emit('pc:status', { pc, online: false })
      console.log(`[pc] ${pc} desconectada`)
    }
  }
}, 10000)

const socketPc = new Map()

export function bindPcSocket(pcName, socketId) {
  if (pcName) socketPc.set(socketId, pcName)
}

export function unbindPcSocket(socketId) {
  const pcName = socketPc.get(socketId)
  socketPc.delete(socketId)
  return pcName
}

export async function markPcOffline(pcName) {
  let found = null
  if (pcName) {
    const q = await pool.query('SELECT id, etiqueta FROM pcs WHERE etiqueta = $1 OR id = $1 LIMIT 1', [pcName]).catch(() => null)
    found = q?.rows?.[0]
  }
  const keys = new Set()
  if (found) {
    keys.add(found.id)
    keys.add(found.etiqueta)
  }
  if (pcName) keys.add(pcName)
  for (const k of keys) {
    const s = pcState.get(k)
    if (s) {
      s.online = false
      s.lastSeen = 0
    }
  }
  const target = found?.etiqueta || pcName
  if (target && ioRef) ioRef.emit('pc:status', { pc: target, online: false })
  if (target) console.log(`[pc] ${target} desconectada (socket)`)
}
