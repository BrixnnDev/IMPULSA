import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'uploads', 'pcs.json')
const PRINTS_PATH = path.join(process.cwd(), 'uploads', 'prints.json')
const pcState = new Map()
let ioRef = null

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) } catch { return [] }
}
function saveDB(list) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
}
function loadPrints() {
  try { return JSON.parse(fs.readFileSync(PRINTS_PATH, 'utf-8')) } catch { return [] }
}
function savePrints(list) {
  fs.mkdirSync(path.dirname(PRINTS_PATH), { recursive: true })
  fs.writeFileSync(PRINTS_PATH, JSON.stringify(list, null, 2))
}

function generarCodigo() {
  return randomUUID().slice(0, 8).toUpperCase()
}

function todosLosPcs(db) {
  return db.map((pc) => {
    const s = pcState.get(pc.id)
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
  r.post('/register', (req, res) => {
    const { nombre } = req.body
    if (!nombre?.trim()) return res.status(400).json({ ok: false, error: 'Falta el nombre.' })
    const db = loadDB()
    const id = `pc-${Date.now().toString(36)}`
    const codigo = generarCodigo()
    const pc = {
      id,
      etiqueta: nombre.trim(),
      responsable: nombre.trim(),
      ip: '',
      mac: '',
      sistema: '',
      ubicacion: '',
      codigo,
      emparejada: false,
      fechaCreacion: new Date().toISOString(),
    }
    db.push(pc)
    saveDB(db)
    console.log(`[pc] Carpeta creada: ${pc.etiqueta} → código: ${codigo}`)
    res.json({ ok: true, pc })
  })

  // Script se registra con código único que él generó
  r.post('/register-from-script', (req, res) => {
    const { codigo, pc, ip, mac, sistema } = req.body
    if (!codigo || !pc) return res.status(400).json({ ok: false, error: 'Falta código o nombre.' })
    const db = loadDB()
    let found = db.find((p) => p.codigo === codigo)
    if (!found) {
      const newPc = {
        id: `pc-${Date.now().toString(36)}`,
        etiqueta: pc,
        responsable: pc,
        ip: ip || '',
        mac: mac || '',
        sistema: sistema || '',
        ubicacion: '',
        codigo,
        emparejada: true,
        fechaCreacion: new Date().toISOString(),
        fechaEmparejada: new Date().toISOString(),
      }
      db.push(newPc)
      saveDB(db)
      console.log(`[pc] Script registró: ${pc} (${codigo})`)
      io.emit('pc:paired', { id: newPc.id, etiqueta: newPc.etiqueta })
      return res.json({ ok: true, pc: newPc })
    }
    if (ip) found.ip = ip
    if (mac) found.mac = mac
    if (sistema) found.sistema = sistema
    found.emparejada = true
    found.fechaEmparejada = new Date().toISOString()
    saveDB(db)
    console.log(`[pc] Script emparejó: ${found.etiqueta} (${codigo})`)
    io.emit('pc:paired', { id: found.id, etiqueta: found.etiqueta })
    res.json({ ok: true, pc: found })
  })

  // El script en la PC se empareja con el código que el admin creó
  r.post('/pair', (req, res) => {
    const { codigo, pc, ip, mac, sistema } = req.body
    if (!codigo) return res.status(400).json({ ok: false, error: 'Falta el código.' })
    const db = loadDB()
    const found = db.find((p) => p.codigo === codigo.toUpperCase())
    if (!found) return res.status(404).json({ ok: false, error: 'Código no válido.' })
    if (pc) found.etiqueta = pc
    if (ip) found.ip = ip
    if (mac) found.mac = mac
    if (sistema) found.sistema = sistema
    found.emparejada = true
    found.fechaEmparejada = new Date().toISOString()
    saveDB(db)
    io.emit('pc:paired', { id: found.id, etiqueta: found.etiqueta })
    console.log(`[pc] Emparejada: ${found.etiqueta} (${codigo})`)
    res.json({ ok: true, pc: found })
  })

  // Heartbeat: el script manda info cada 30 seg
  r.post('/heartbeat', (req, res) => {
    const { pc, ip, mac, sistema, ubicacion } = req.body
    const nombre = pc
    if (!nombre) return res.status(400).json({ ok: false })
    const db = loadDB()
    const found = db.find((p) => p.id === nombre || p.codigo === nombre || p.etiqueta === nombre)
    if (found) {
      if (ip) found.ip = ip
      if (mac) found.mac = mac
      if (sistema) found.sistema = sistema
      if (ubicacion) found.ubicacion = ubicacion
      found.emparejada = true
      saveDB(db)
    }
    const ipDetectada = req.ip || req.connection?.remoteAddress || ''
    const wasOnline = pcState.get(nombre)?.online || false
    pcState.set(nombre, { lastSeen: Date.now(), ip: ipDetectada, online: true })
    if (!wasOnline) {
      io.emit('pc:status', { pc: nombre, online: true })
      console.log(`[pc] ${nombre} conectada`)
    }
    res.json({ ok: true })
  })

  // Lista de PCs
  r.get('/list', (_req, res) => {
    const db = loadDB()
    res.json(todosLosPcs(db))
  })

  // Evento de impresión: el script manda cuando alguien imprime
  r.post('/print', (req, res) => {
    const { pc, documento, paginas, copias } = req.body
    if (!pc || !documento) return res.status(400).json({ ok: false })
    const db = loadDB()
    const found = db.find((p) => p.id === pc || p.codigo === pc || p.etiqueta === pc)
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
    const prints = loadPrints()
    prints.unshift(registro)
    if (prints.length > 500) prints.length = 500
    savePrints(prints)
    io.emit('pc:print', registro)
    console.log(`[print] ${registro.pc} imprimió: ${documento}`)
    res.json({ ok: true, registro })
  })

  // Evento de escaneo: el script manda cuando alguien escanea
  r.post('/scan', (req, res) => {
    const { pc, documento, paginas } = req.body
    if (!pc || !documento) return res.status(400).json({ ok: false })
    const db = loadDB()
    const found = db.find((p) => p.id === pc || p.codigo === pc || p.etiqueta === pc)
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
  })

  // Historial de impresiones (todas las PCs)
  r.get('/prints', (_req, res) => {
    res.json(loadPrints())
  })

  // Estado de todas las PCs
  r.get('/status', (_req, res) => {
    const db = loadDB()
    res.json(todosLosPcs(db))
  })

  // Eliminar PC
  r.delete('/:id', (req, res) => {
    let db = loadDB()
    db = db.filter((p) => p.id !== req.params.id)
    saveDB(db)
    res.json({ ok: true })
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
