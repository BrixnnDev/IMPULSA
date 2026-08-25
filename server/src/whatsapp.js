const GRAPH = 'https://graph.facebook.com/v21.0'

// Meta llama a GET /api/whatsapp/webhook una sola vez para verificar el webhook
export function verifyWebhook(query, verifyToken) {
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  if (mode === 'subscribe' && token === verifyToken) return challenge
  return null
}

// Extrae los mensajes de texto entrantes del payload del webhook de Meta
export function parseIncoming(body) {
  try {
    const out = []
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {}
        for (const msg of value.messages || []) {
          if (msg.type !== 'text') continue
          out.push({
            wa_id: msg.from,
            name: value.contacts?.[0]?.profile?.name || msg.from,
            text: msg.text?.body || '',
            timestamp: Number(msg.timestamp) * 1000 || Date.now(),
          })
        }
      }
    }
    return out
  } catch {
    return []
  }
}

// Envia un mensaje de texto con la Cloud API
export async function sendWhatsApp({ token, phoneNumberId, to, text }) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`)
  return res.json()
}
