import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

const CARPETA = path.join(process.cwd(), 'uploads', 'escaner')
fs.mkdirSync(CARPETA, { recursive: true })

// Limpia el nombre para que sea seguro en disco
function limpiarNombre(nombre) {
  const base = path.basename(nombre || 'escaneo.pdf')
  return base.replace(/[^a-zA-Z0-9._\- ()áéíóúÁÉÍÓÚñÑ]/g, '_').slice(0, 120)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CARPETA),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf'
    const sinExt = limpiarNombre(path.basename(file.originalname, path.extname(file.originalname)))
    cb(null, `${sinExt}-${randomUUID().slice(0, 8)}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } })

function listar() {
  return fs
    .readdirSync(CARPETA)
    .filter((f) => !f.startsWith('.'))
    .map((nombre) => {
      const st = fs.statSync(path.join(CARPETA, nombre))
      return {
        id: `ESC-${nombre.split('-').pop()?.replace(/\..*$/, '') || '0000'}`,
        archivo: nombre,
        nombre,
        size: st.size,
        fecha: st.mtime.toISOString(),
      }
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

// Exporta el router; necesita io para avisar a la página en tiempo real
export function scansRouter(io) {
  const r = Router()

  // El programa vigilante del PC sube aqui los archivos escaneados
  r.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false, error: 'Falta el archivo (campo "file").' })
    const data = listar()[0] || {}
    io.emit('scan:new', { ...data, persona: req.body?.persona || '' })
    console.log(`[escaner] recibido: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)} KB)`)
    res.json({ ok: true, archivo: req.file.filename })
  })

  r.get('/list', (_req, res) => res.json(listar()))

  // Ver o descargar el archivo escaneado
  r.get('/file/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const ruta = path.join(CARPETA, nombre)
    if (!fs.existsSync(ruta)) return res.status(404).json({ ok: false, error: 'No existe.' })
    res.sendFile(ruta)
  })

  r.delete('/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const ruta = path.join(CARPETA, nombre)
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta)
    res.json({ ok: true })
  })

  return r
}
