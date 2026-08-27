import { Router } from 'express'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

const pcState = new Map()
let ioRef = null

const cleanCode = (c) => c.replace(/-/g, '').toUpperCase()

function generarCodigo() {
  return randomUUID().slice(0, 8).toUpperCase()
}

async function todosLosPcs() {
  const q = await pool.query('SELECT * FROM pcs ORDER BY fecha_creacion ASC')
  return q.rows.map((pc) => {
    const s = pcState.get(pc.id) || pcState.get(pc.etiqueta)
    return {
      ...pc,
      online: s ? Date.now() - s.lastSeen < 90000 : false,
      lastSeen: s?.lastSeen || null,
    }
  })
}

export function pcRouter(io) {
  ioRef = io
  const r = Router()

  // Admin crea carpeta: solo nombre
  r.post('/register', async (req, res) => {
    try {
      const { nombre } = req.body
      if (!nombre?.trim()) return res.status(400).json({ ok: false, error: 'Falta el nombre.' })
      const id = `pc-${Date.now().toString(36)}`
      const codigo = generarCodigo()
      const creado = new Date().toISOString()
      await pool.query(
        `INSERT INTO pcs (id, etiqueta, responsable, codigo, emparejada, fecha_creacion)
         VALUES ($1,$2,$2,$3,FALSE,$4)`,
        [id, nombre.trim(), codigo, creado],
      )
      const pc = { id, etiqueta: nombre.trim(), responsable: nombre.trim(), ip: '', mac: '', sistema: '', ubicacion: '', codigo, emparejada: false, fecha_creacion: creado }
      console.log(`[pc] Carpeta creada: ${pc.etiqueta} → código: ${codigo}`)
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
      const { pc, ip, mac, sistema, ubicacion, codigo } = req.body
      const nombre = pc
      if (!nombre) return res.status(400).json({ ok: false })
      let cond = 'etiqueta = $1'
      let val = nombre
      if (codigo) { cond = 'codigo = $1'; val = cleanCode(codigo) }
      const q = await pool.query(`SELECT * FROM pcs WHERE ${cond} OR id = $2 OR etiqueta = $2 LIMIT 1`, [val, nombre])
      const found = q.rows[0]
      if (found) {
        await pool.query(
          `UPDATE pcs SET ip = $1, mac = $2, sistema = $3, ubicacion = $4, emparejada = TRUE WHERE id = $5`,
          [ip || found.ip, mac || found.mac, sistema || found.sistema, ubicacion || found.ubicacion, found.id],
        )
      }
      const key = found ? found.id : nombre
      const ipDetectada = req.ip || req.connection?.remoteAddress || ''
      const wasOnline = pcState.get(key)?.online || false
      pcState.set(key, { lastSeen: Date.now(), ip: ipDetectada, online: true })
      if (!wasOnline) {
        io.emit('pc:status', { pc: nombre, online: true })
        console.log(`[pc] ${nombre} conectada`)
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

  // Evento de impresión: el script manda cuando alguien imprime
  r.post('/print', async (req, res) => {
    try {
      const { pc, documento, paginas, copias } = req.body
      if (!pc || !documento) return res.status(400).json({ ok: false })
      const q = await pool.query('SELECT * FROM pcs WHERE id = $1 OR codigo = $1 OR etiqueta = $1 LIMIT 1', [pc])
      const found = q.rows[0]
      const registro = {
        id: `PRN-${Date.now().toString(36)}`,
        pc: found ? found.etiqueta : pc,
        responsable: found ? found.responsable : pc,
        documento,
        paginas: paginas || 1,
        copias: copias || 1,
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        fecha: new Date().toISOString(),
        estado: 'Impreso',
      }
      await pool.query(
        `INSERT INTO prints (id, pc, responsable, documento, paginas, copias, hora, fecha, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [registro.id, registro.pc, registro.responsable, registro.documento, registro.paginas, registro.copias, registro.hora, registro.fecha, registro.estado],
      )
      await pool.query(`DELETE FROM prints WHERE id NOT IN (SELECT id FROM prints ORDER BY fecha DESC LIMIT 500)`)
      io.emit('pc:print', registro)
      console.log(`[print] ${registro.pc} imprimió: ${documento}`)
      res.json({ ok: true, registro })
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

  // Historial de impresiones (todas las PCs)
  r.get('/prints', async (_req, res) => {
    try {
      const q = await pool.query('SELECT * FROM prints ORDER BY fecha DESC')
      res.json(q.rows.map((p) => ({ ...p, paginas: p.paginas, copias: p.copias })))
    } catch (e) { console.error('[pc] prints:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Estado de todas las PCs
  r.get('/status', async (_req, res) => {
    try { res.json(await todosLosPcs()) } catch (e) { console.error('[pc] status:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  // Eliminar PC
  r.delete('/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM pcs WHERE id = $1', [req.params.id])
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
      io.emit('pc:paired', { id: found.id, etiqueta: found.etiqueta })
      io.emit('pc:system-report', { id: found.id, ip, mac, sistema })
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
      res.json({ ok: true, pc: { ...found, online: s ? Date.now() - s.lastSeen < 90000 : false, lastSeen: s?.lastSeen || null } })
    } catch (e) { console.error('[pc] detail:', e.message); res.status(500).json({ ok: false, error: e.message }) }
  })

  return r
}

setInterval(() => {
  for (const [pc, s] of pcState) {
    if (Date.now() - s.lastSeen > 90000 && s.online) {
      s.online = false
      if (ioRef) ioRef.emit('pc:status', { pc, online: false })
      console.log(`[pc] ${pc} desconectada`)
    }
  }
}, 30000)
