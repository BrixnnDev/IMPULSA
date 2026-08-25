import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

const CARPETA_RED = process.env.SCAN_FOLDER || ''
const CARPETA_LOCAL = path.join(process.cwd(), 'uploads', 'escaner')
fs.mkdirSync(CARPETA_LOCAL, { recursive: true })

function limpiarNombre(nombre) {
  const base = path.basename(nombre || 'escaneo.pdf')
  return base.replace(/[^a-zA-Z0-9._\- ()áéíóúÁÉÍÓÚñÑ]/g, '_').slice(0, 120)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CARPETA_LOCAL),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf'
    const sinExt = limpiarNombre(path.basename(file.originalname, path.extname(file.originalname)))
    cb(null, `${sinExt}-${randomUUID().slice(0, 8)}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

function carpetaActiva() {
  if (CARPETA_RED && fs.existsSync(CARPETA_RED)) return CARPETA_RED
  return CARPETA_LOCAL
}

function listar() {
  const carpeta = carpetaActiva()
  try {
    return fs
      .readdirSync(carpeta)
      .filter((f) => !f.startsWith('.'))
      .map((nombre) => {
        try {
          const st = fs.statSync(path.join(carpeta, nombre))
          return {
            id: `ESC-${nombre.split('-').pop()?.replace(/\..*$/, '') || nombre.slice(0, 8)}`,
            archivo: nombre,
            nombre,
            size: st.size,
            fecha: st.mtime.toISOString(),
            origen: carpeta === CARPETA_RED ? 'red' : 'local',
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  } catch {
    return []
  }
}

export function scansRouter(io) {
  const r = Router()

  r.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false, error: 'Falta el archivo (campo "file").' })
    const data = listar()[0] || {}
    io.emit('scan:new', { ...data, persona: req.body?.persona || '' })
    console.log(`[escaner] recibido: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)} KB)`)
    res.json({ ok: true, archivo: req.file.filename })
  })

  r.get('/list', (_req, res) => {
    const limit = Math.min(Number(_req.query.limit) || 200, 2000)
    const offset = Number(_req.query.offset) || 0
    const todos = listar()
    res.json({ total: todos.length, items: todos.slice(offset, offset + limit) })
  })

  r.get('/list/raw', (_req, res) => res.json(listar()))

  r.get('/file/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const carpeta = carpetaActiva()
    const ruta = path.join(carpeta, nombre)
    if (!fs.existsSync(ruta)) return res.status(404).json({ ok: false, error: 'No existe.' })
    res.sendFile(ruta)
  })

  r.get('/status', (_req, res) => {
    res.json({
      carpetaRed: CARPETA_RED || null,
      carpetaActiva: carpetaActiva(),
      conectado: CARPETA_RED ? fs.existsSync(CARPETA_RED) : false,
      totalArchivos: listar().length,
    })
  })

  r.delete('/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const carpeta = carpetaActiva()
    const ruta = path.join(carpeta, nombre)
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta)
    res.json({ ok: true })
  })

  return r
}
