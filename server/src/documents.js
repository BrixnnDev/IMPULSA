import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

const CARPETA_DOCS = path.join(process.cwd(), 'uploads', 'documents')
fs.mkdirSync(CARPETA_DOCS, { recursive: true })

function limpiarNombre(nombre) {
  const base = path.basename(nombre || 'documento.bin')
  return base.replace(/[^a-zA-Z0-9._\- ()áéíóúÁÉÍÓÚñÑ]/g, '_').slice(0, 120)
}

function tipoDeArchivo(nombre) {
  const ext = path.extname(nombre || '').toLowerCase()
  if (['.pdf'].includes(ext)) return 'PDF'
  if (['.doc', '.docx'].includes(ext)) return 'Word'
  if (['.xls', '.xlsx', '.csv'].includes(ext)) return 'Excel'
  if (['.ppt', '.pptx'].includes(ext)) return 'PowerPoint'
  if (['.txt', '.rtf'].includes(ext)) return 'Texto'
  if (['.exe', '.msi', '.bat'].includes(ext)) return 'Programa'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) return 'Imagen'
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'Comprimido'
  if (['.mp3', '.wav', '.mp4', '.avi', '.mkv'].includes(ext)) return 'Multimedia'
  return 'Archivo'
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CARPETA_DOCS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    const sinExt = limpiarNombre(path.basename(file.originalname, path.extname(file.originalname)))
    cb(null, `${sinExt}-${randomUUID().slice(0, 8)}${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } })

export function documentsRouter(io) {
  const r = Router()

  // ---- Carpetas ----
  r.get('/carpetas', async (_req, res) => {
    try {
      const q = await pool.query('SELECT * FROM carpetas ORDER BY fecha DESC')
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  r.post('/carpetas', async (req, res) => {
    const { nombre, creado_por } = req.body
    if (!nombre || !String(nombre).trim()) return res.status(400).json({ ok: false, error: 'Nombre requerido.' })
    try {
      const id = `carp-${randomUUID().slice(0, 8)}`
      await pool.query(
        `INSERT INTO carpetas (id, nombre, creado_por, fecha) VALUES ($1,$2,$3,$4)`,
        [id, String(nombre).trim(), creado_por || '', new Date().toISOString()],
      )
      io.emit('doc:carpeta', { id, nombre, creado_por, fecha: new Date().toISOString() })
      res.json({ ok: true, id })
    } catch (e) {
      if (e.code === '23505') return res.status(400).json({ ok: false, error: 'La carpeta ya existe.' })
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  r.delete('/carpetas/:id', async (req, res) => {
    try {
      const carp = await pool.query('SELECT * FROM carpetas WHERE id=$1', [req.params.id])
      if (carp.rows.length) {
        await pool.query('DELETE FROM documents WHERE carpeta=$1', [carp.rows[0].nombre])
        await pool.query('DELETE FROM carpetas WHERE id=$1', [req.params.id])
      }
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  // ---- Documentos ----
  r.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false, error: 'Falta el archivo (campo "file").' })
    try {
      const id = `DOC-${randomUUID().slice(0, 8).toUpperCase()}`
      const nombre = req.body.nombre || req.file.originalname
      const tipo = tipoDeArchivo(nombre)
      const fila = {
        id,
        nombre,
        tipo,
        tamano: req.file.size,
        ruta: req.file.filename,
        carpeta: req.body.carpeta || '',
        subido_por: req.body.subido_por || '',
        user_id: req.body.user_id || '',
        fecha: new Date().toISOString(),
        estado: req.body.estado || 'Finalizado',
      }
      await pool.query(
        `INSERT INTO documents (id,nombre,tipo,tamano,ruta,carpeta,subido_por,user_id,fecha,estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [fila.id, fila.nombre, fila.tipo, fila.tamano, fila.ruta, fila.carpeta, fila.subido_por, fila.user_id, fila.fecha, fila.estado],
      )
      io.emit('doc:new', fila)
      res.json({ ok: true, doc: fila })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  r.get('/list', async (req, res) => {
    try {
      const carpeta = req.query.carpeta
      let q
      if (carpeta) {
        q = await pool.query('SELECT * FROM documents WHERE carpeta=$1 ORDER BY fecha DESC', [carpeta])
      } else {
        q = await pool.query('SELECT * FROM documents ORDER BY fecha DESC')
      }
      res.json(q.rows)
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  r.get('/file/:nombre', (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const ruta = path.join(CARPETA_DOCS, nombre)
    if (!fs.existsSync(ruta)) return res.status(404).json({ ok: false, error: 'No existe.' })
    res.sendFile(ruta)
  })

  r.delete('/:id', async (req, res) => {
    try {
      const q = await pool.query('SELECT * FROM documents WHERE id=$1', [req.params.id])
      if (q.rows.length) {
        const ruta = path.join(CARPETA_DOCS, q.rows[0].ruta)
        if (fs.existsSync(ruta)) fs.unlinkSync(ruta)
        await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id])
      }
      io.emit('doc:removed', req.params.id)
      res.json({ ok: true })
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message })
    }
  })

  return r
}
