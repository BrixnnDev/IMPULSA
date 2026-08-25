import { Router } from 'express'

const PC_LIST = [
  'PC-01', 'PC-02', 'PC-03', 'PC-04', 'PC-05', 'PC-06', 'PC-07',
  'PC-08', 'PC-09', 'PC-10', 'PC-11', 'PC-12', 'PC-13', 'PC-14',
]

const pcState = new Map()
let ioRef = null

function todosLosPcs() {
  return PC_LIST.map((pc) => {
    const s = pcState.get(pc)
    return {
      pc,
      online: s ? Date.now() - s.lastSeen < 90000 : false,
      lastSeen: s?.lastSeen || null,
      ip: s?.ip || null,
    }
  })
}

export function pcRouter(io) {
  ioRef = io
  const r = Router()

  r.post('/heartbeat', (req, res) => {
    const { pc } = req.body
    if (!pc) return res.status(400).json({ ok: false })
    const ip = req.ip || req.connection?.remoteAddress || ''
    const wasOnline = pcState.get(pc)?.online || false
    pcState.set(pc, { lastSeen: Date.now(), ip, online: true })

    if (!wasOnline) {
      io.emit('pc:status', { pc, online: true })
      console.log(`[pc] ${pc} conectada (${ip})`)
    }

    res.json({ ok: true })
  })

  r.get('/status', (_req, res) => res.json(todosLosPcs()))

  r.get('/:pc', (req, res) => {
    const s = pcState.get(req.params.pc)
    if (!s) return res.json({ pc: req.params.pc, online: false, lastSeen: null })
    res.json({ pc: req.params.pc, online: Date.now() - s.lastSeen < 90000, lastSeen: s.lastSeen })
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
