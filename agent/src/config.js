export const DEFAULT_SERVER_URL = 'https://impulsx.vercel.app'
export const SERVER_DISPLAY = 'IMPULSA'
export const SERVER_CONNECTED_TEXT = 'IMPULSA'

export const apiBase = (url) => (url || DEFAULT_SERVER_URL).replace(/\/+$/, '')

export const normalizeCode = (code) => String(code || '').replace(/-/g, '').toUpperCase()
