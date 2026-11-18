import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { pool } from './db.js'

// Los escaneos se guardan en la base de datos: el disco de Render es efímero
// y se borra en cada despliegue, por eso el historial no puede vivir ahí.
const CARPETA_RED = process.env.SCAN_FOLDER || ''
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

function limpiarNombre(nombre) {
  const base = path.basename(nombre || 'escaneo.pdf')
  return base.replace(/[^a-zA-Z0-9._\- ()áéíóúÁÉÍÓÚñÑ]/g, '_').slice(0, 120)
}

// Quita el sufijo aleatorio agregado al guardar para comparar nombres originales.
function nombreBase(nombre) {
  return nombre.replace(/-[0-9a-f]{8}(\.[^.]+)?$/i, (_match, ext) => ext || '')
}

function filaApi(row) {
  return {
    id: row.id,
    archivo: row.archivo,
    nombre: row.archivo,
    size: Number(row.size),
    fecha: row.fecha,
    origen: 'red',
  }
}

async function listar(limit = 2000, offset = 0) {
  const q = await pool.query(
    `SELECT id, archivo, size, fecha FROM scans ORDER BY fecha DESC LIMIT $1 OFFSET $2`,
    [Math.min(limit, 2000), offset],
  )
  return q.rows.map(filaApi)
}

export function scansRouter(io) {
  const r = Router()

  r.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false, error: 'Falta el archivo (campo "file").' })

    const original = req.file.originalname || 'escaneo.pdf'
    const base = nombreBase(original)
    const size = req.file.size

    // Varios PC pueden vigilar la misma carpeta compartida: evita duplicados.
    const existe = await pool.query(
      `SELECT archivo, size FROM scans WHERE nombre_base = $1 AND size = $2 LIMIT 1`,
      [base, size],
    )
    if (existe.rows.length) {
      console.log(`[escaner] duplicado ignorado: ${original}`)
      return res.json({ ok: true, archivo: existe.rows[0].archivo, duplicado: true })
    }

    const ext = path.extname(original) || '.pdf'
    const sinExt = limpiarNombre(path.basename(original, path.extname(original)))
    const archivo = `${sinExt}-${randomUUID().slice(0, 8)}${ext}`
    const fechaScan = new Date(req.body?.fecha)
    const fecha = Number.isNaN(fechaScan.getTime()) ? new Date() : fechaScan

    await pool.query(
      `INSERT INTO scans (id, archivo, nombre_base, size, fecha, persona, contenido)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        `ESC-${randomUUID().slice(0, 8)}`,
        archivo,
        base,
        size,
        fecha.toISOString(),
        req.body?.persona || '',
        req.file.buffer,
      ],
    )

    io.emit('scan:new', {
      id: `ESC-${archivo.split('-').pop()?.replace(/\..*$/, '') || archivo.slice(0, 8)}`,
      archivo,
      nombre: archivo,
      size,
      fecha: fecha.toISOString(),
      origen: 'red',
      persona: req.body?.persona || '',
    })
    console.log(`[escaner] recibido: ${original} (${(size / 1024).toFixed(0)} KB)`)
    res.json({ ok: true, archivo })
  })

  r.get('/list', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 200, 2000)
    const offset = Number(req.query.offset) || 0
    const items = await listar(limit, offset)
    const total = (await pool.query('SELECT COUNT(*)::int AS n FROM scans')).rows[0].n
    res.json({ total, items })
  })

  r.get('/list/raw', async (_req, res) => res.json(await listar()))

  r.get('/file/:nombre', async (req, res) => {
    const nombre = path.basename(req.params.nombre)
    const q = await pool.query('SELECT contenido FROM scans WHERE archivo = $1 LIMIT 1', [nombre])
    if (!q.rows.length) return res.status(404).json({ ok: false, error: 'No existe.' })
    const ext = path.extname(nombre).toLowerCase()
    const tipos = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.tif': 'image/tiff',
      '.tiff': 'image/tiff',
    }
    res.type(tipos[ext] || 'application/octet-stream')
    res.send(q.rows[0].contenido)
  })

  r.get('/status', async (_req, res) => {
    const totalArchivos = (await pool.query('SELECT COUNT(*)::int AS n FROM scans')).rows[0].n
    res.json({
      carpetaRed: CARPETA_RED || null,
      carpetaActiva: 'base de datos (persistente)',
      conectado: true,
      totalArchivos,
    })
  })

  r.delete('/:nombre', async (req, res) => {
    const nombre = path.basename(req.params.nombre)
    await pool.query('DELETE FROM scans WHERE archivo = $1', [nombre])
    res.json({ ok: true })
  })

  return r
}
