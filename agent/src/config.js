// El agente no muestra ni permite editar la URL del servidor: siempre usa
// el backend de producción de IMPULSA de forma interna.
export const DEFAULT_SERVER_URL = 'https://impulsa-api-v1l0.onrender.com'
export const SERVER_DISPLAY = 'IMPULSA'
export const SERVER_CONNECTED_TEXT = 'IMPULSA'

export const apiBase = (url) => (url || DEFAULT_SERVER_URL).replace(/\/+$/, '')

export const normalizeCode = (code) => String(code || '').replace(/-/g, '').toUpperCase()
