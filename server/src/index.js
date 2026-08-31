import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { verifyWebhook, parseIncoming, sendWhatsApp } from './whatsapp.js'
import { authUrl, saveCode, isReady, listRecent, sendMail } from './gmail.js'
import { scansRouter } from './scans.js'
import { pcRouter, bindPcSocket, unbindPcSocket, markPcOffline } from './pc.js'
import { usersRouter } from './users.js'
import { documentsRouter } from './documents.js'
import { comisionesRouter } from './comisiones.js'
import { settingsRouter } from './settings.js'
import { initDb } from './db.js'

const cfg = {
  port: process.env.PORT || 8787,
  waToken: process.env.WHATSAPP_TOKEN || '',
  waPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  waVerify: process.env.WHATSAPP_VERIFY_TOKEN || 'impulsa-verify-123',
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8787/api/gmail/oauth2callback',
}

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  console.log('[ws] cliente conectado:', socket.id)
  socket.on('pc:register', (d) => {
    const nombre = (d && (d.pcName || d.pc_name)) || ''
    bindPcSocket(nombre, socket.id)
  })
  socket.on('disconnect', () => {
    const pcName = unbindPcSocket(socket.id)
    if (pcName) markPcOffline(pcName)
  })})

/* ============ WHATSAPP CLOUD API (oficial Meta) ============ */

// Verificacion del webhook (Meta la llama una vez al configurarlo)
app.get('/api/whatsapp/webhook', (req, res) => {
  const challenge = verifyWebhook(req.query, cfg.waVerify)
  if (challenge) return res.status(200).send(challenge)
  return res.sendStatus(403)
})

// Mensajes entrantes en tiempo real -> se emiten por WebSocket
app.post('/api/whatsapp/webhook', (req, res) => {
  for (const msg of parseIncoming(req.body)) {
    io.emit('whatsapp:message', msg)
  }
  res.sendStatus(200)
})

// Enviar mensaje de texto
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, text } = req.body
    if (!to || !text) return res.status(400).json({ ok: false, error: 'Faltan "to" o "text".' })
    const data = await sendWhatsApp({
      token: cfg.waToken,
      phoneNumberId: cfg.waPhoneId,
      to,
      text,
    })
    res.json({ ok: true, data })
  } catch (err) {
    console.error('[whatsapp] send:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

/* ============ ESCANER (carpeta del PC -> web) ============ */

app.use('/api/scans', scansRouter(io))
app.use('/api/pc', pcRouter(io))
app.use('/api/users', usersRouter(io))
app.use('/api/documents', documentsRouter(io))
app.use('/api/comisiones', comisionesRouter(io))
app.use('/api/settings', settingsRouter(io))
/* ============ GMAIL (OAuth2 oficial de Google) ============ */

app.get('/api/gmail/status', (_req, res) =>
  res.json({ ready: isReady(), authUrl: isReady() ? null : authUrl(cfg) }),
)

// Paso 1: llevar al usuario a Google para iniciar sesion
app.get('/api/gmail/auth', (req, res) => res.redirect(authUrl(cfg)))

// Paso 2: Google devuelve el codigo y guardamos los tokens
app.get('/api/gmail/oauth2callback', async (req, res) => {
  try {
    await saveCode(cfg, req.query.code)
    res.send('<script>window.close()</script><p style="font-family:sans-serif">Gmail conectado. Ya puedes cerrar esta ventana.</p>')
  } catch (err) {
    console.error('[gmail] oauth:', err.message)
    res.status(500).send('Error conectando Gmail: ' + err.message)
  }
})

// Enviar correo
app.post('/api/gmail/send', async (req, res) => {
  try {
    const { to, subject, text } = req.body
    if (!to || !subject) return res.status(400).json({ ok: false, error: 'Faltan "to" o "subject".' })
    await sendMail(cfg, { to, subject, text: text || '' })
    res.json({ ok: true })
  } catch (err) {
    console.error('[gmail] send:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

async function pollGmail() {
  if (!isReady()) return
  try {
    const list = await listRecent(cfg, 10)
    io.emit('gmail:list', list)
  } catch (err) {
    // Token expirado u otro error: se reintenta en el siguiente ciclo
    console.error('[gmail] poll:', err.message)
  }
}
setInterval(pollGmail, 15000)

initDb().then(() => {
  server.listen(cfg.port, () => {
    console.log(`IMPULSA server en http://localhost:${cfg.port}`)
    console.log('WhatsApp webhook: POST /api/whatsapp/webhook')
    if (!isReady()) console.log(`Conecta Gmail abriendo: http://localhost:${cfg.port}/api/gmail/auth`)
  })
}).catch((err) => {
  console.error('[db] No se pudo conectar a PostgreSQL:', err.message, '| code:', err.code, '| host:', err.address)
  process.exit(1)
})
