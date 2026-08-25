#!/usr/bin/env bun
import fs from 'fs'
import path from 'path'

// ─── Resolver rutas relativas al .exe o al script ───
const exeDir = path.dirname(process.argv[0] || '.')
const workDir = process.cwd()
const configPaths = [
  path.join(exeDir, 'config.json'),
  path.join(workDir, 'config.json'),
]
const CONFIG_PATH = configPaths.find((p) => fs.existsSync(p)) || configPaths[1]
const SENT_PATH = CONFIG_PATH.replace('config', 'sent')

// ─── Cargar o crear config.json ───
let CFG
try {
  CFG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
} catch {
  const defaultCfg = {
    carpeta: 'C:\\Escanner',
    servidor: 'http://localhost:8787',
    persona: 'Digitador',
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultCfg, null, 2), 'utf-8')
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  Se creó config.json — ábrelo y editalo     ║')
  console.log('║  con la ruta de tu carpeta de escáner.      ║')
  console.log('╚══════════════════════════════════════════════╝\n')
  console.log(`Archivo: ${CONFIG_PATH}\n`)
  console.log('  "carpeta"  → ruta de la carpeta que el escáner usa')
  console.log('  "servidor" → dirección del servidor StockFlow')
  console.log('  "persona"  → nombre que aparece como quien escanea\n')
  process.exit(0)
}

// ─── Archivos ya enviados ───
let sentSet = new Set()
try { sentSet = new Set(JSON.parse(fs.readFileSync(SENT_PATH, 'utf-8'))) } catch {}
const saveSent = () => fs.writeFileSync(SENT_PATH, JSON.stringify([...sentSet]), 'utf-8')

// ─── Estabilidad del archivo (el escáner escribe poco a poco) ───
async function esperarEstabilidad(ruta) {
  for (let i = 0; i < 15; i++) {
    const s1 = fs.statSync(ruta).size
    await new Promise((ok) => setTimeout(ok, 800))
    const s2 = fs.statSync(ruta).size
    if (s1 > 0 && s1 === s2) return true
  }
  return false
}

// ─── Subir al servidor ───
async function subir(ruta) {
  const nombre = path.basename(ruta)
  if (sentSet.has(nombre)) return

  try {
    const file = Bun.file(ruta)
    if (file.size === 0) return

    if (!(await esperarEstabilidad(ruta))) {
      console.log(`⚠ No se estabilizó (todavía escribiendo): ${nombre}`)
      return
    }

    const blob = new Blob([await file.arrayBuffer()])
    const body = new FormData()
    body.append('file', blob, nombre)
    body.append('persona', CFG.persona || '')

    const res = await fetch(`${CFG.servidor}/api/scans/upload`, { method: 'POST', body })
    const json = await res.json()

    if (json.ok) {
      sentSet.add(nombre)
      saveSent()
      console.log(`✅ ${nombre}  →  enviado`)
    } else {
      console.log(`❌ ${nombre}  →  ${json.error || 'error del servidor'}`)
    }
  } catch (e) {
    console.log(`⚠ ${nombre}  →  sin conexión (${e.message})`)
  }
}

// ─── Buscar archivos sin enviar al arrancar ───
async function enviarPendientes() {
  if (!fs.existsSync(CFG.carpeta)) {
    console.log(`\n⚠  Carpeta no encontrada: ${CFG.carpeta}`)
    console.log('   Edita "carpeta" en config.json con la ruta correcta.\n')
    return
  }
  const archivos = fs.readdirSync(CFG.carpeta).filter((f) => !f.startsWith('.') && !f.endsWith('.sent.json'))
  for (const f of archivos) {
    if (!sentSet.has(f)) await subir(path.join(CFG.carpeta, f))
  }
}

// ─── Observar la carpeta ───
function vigilar() {
  if (!fs.existsSync(CFG.carpeta)) {
    console.log(`⚠  Esperando a que exista la carpeta: ${CFG.carpeta}`)
    const tmp = setInterval(() => {
      if (fs.existsSync(CFG.carpeta)) {
        clearInterval(tmp)
        console.log(`\n📁 Carpeta detectada: ${CFG.carpeta}\n`)
        vigilar()
      }
    }, 5000)
    return
  }

  console.log(`📁 Observando: ${CFG.carpeta}`)
  console.log(`🌐 Servidor:  ${CFG.servidor}\n`)

  let pendientes = new Map()

  fs.watch(CFG.carpeta, { recursive: true }, (evento, nombre) => {
    if (!nombre || nombre.startsWith('.') || nombre.endsWith('.sent.json')) return
    const ruta = path.join(CFG.carpeta, nombre)
    if (!fs.existsSync(ruta)) return

    // Debounce: esperar a que el escritor termine
    if (pendientes.has(nombre)) clearTimeout(pendientes.get(nombre))
    pendientes.set(nombre, setTimeout(() => {
      pendientes.delete(nombre)
      subir(ruta)
    }, 2000))
  })
}

// ─── Arrancar ───
console.log('╔══════════════════════════════════════════╗')
console.log('║    Escáner StockFlow · Vigilante v1.0    ║')
console.log('╚══════════════════════════════════════════╝')
console.log(`\nCarpeta: ${CFG.carpeta}`)
console.log(`Servidor: ${CFG.servidor}`)
console.log(`Persona: ${CFG.persona}\n`)

await enviarPendientes()
vigilar()

console.log('\nCtrl+C para cerrar.\n')
