import { google } from 'googleapis'

let oauth = null
let tokens = null

function getOAuth(cfg) {
  if (!oauth) {
    oauth = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri)
  }
  if (tokens) oauth.setCredentials(tokens)
  return oauth
}

// URL para que el usuario inicie sesion con su cuenta de Google
export function authUrl(cfg) {
  return getOAuth(cfg).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export async function saveCode(cfg, code) {
  const o = getOAuth(cfg)
  const { tokens: t } = await o.getToken(code)
  tokens = t
  o.setCredentials(t)
  return t
}

export function isReady() {
  return !!tokens
}

function parseFrom(raw) {
  // "Nombre Apellido <correo@x.com>" -> { name, addr }
  const match = raw?.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/) || []
  if (match[2]) return { name: match[1] || match[2], addr: match[2] }
  return { name: raw || '', addr: raw || '' }
}

// Ultimos correos de la bandeja de entrada (formato ligero)
export async function listRecent(cfg, max = 10) {
  const gmail = google.gmail({ version: 'v1', auth: getOAuth(cfg) })
  const { data } = await gmail.users.messages.list({ userId: 'me', maxResults: max, q: 'in:inbox' })
  const out = []
  for (const m of data.messages || []) {
    const r = await gmail.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    })
    const headers = r.data.payload.headers || []
    const get = (n) => headers.find((h) => h.name === n)?.value || ''
    const from = parseFrom(get('From'))
    out.push({
      id: r.data.id,
      fromName: from.name,
      fromAddr: from.addr,
      subject: get('Subject') || '(sin asunto)',
      dateShort: get('Date'),
      snippet: r.data.snippet,
    })
  }
  return out
}

export async function sendMail(cfg, { to, subject, text }) {
  const gmail = google.gmail({ version: 'v1', auth: getOAuth(cfg) })
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text,
  ].join('\r\n')
  return gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(mime).toString('base64url') },
  })
}
