# StockFlow Server (WhatsApp oficial + Gmail)

Servidor local que conecta tu página con **WhatsApp Cloud API (Meta)** y **Gmail API**, y empuja todo en tiempo real al frontend con WebSocket.

## Puesta en marcha

```bash
cd server
bun install        # o npm install
copy .env.example .env   # y llena las claves
npm run dev
```

El servidor queda en `http://localhost:8787`.

## WhatsApp Cloud API (legal, sin riesgo de baneo)

1. Ve a https://developers.facebook.com y crea una app tipo **Negocio**.
2. Agrega el producto **WhatsApp** → pestaña *API Setup*.
3. Copia el **Access token** y el **Phone number ID** al `.env`
   (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`).
4. En la misma pestaña, configura el **Webhook**:
   - URL: usa una URL pública (ej. con ngrok: `ngrok http 8787`) + `/api/whatsapp/webhook`
   - Verify token: el mismo de `WHATSAPP_VERIFY_TOKEN`
5. Suscríbete al campo **messages**.

Listo: cada mensaje que llegue a tu número aparecerá al instante en el panel
de WhatsApp de StockFlow, y los mensajes que escribas ahí se envían de verdad.

## Gmail

1. https://console.cloud.google.com → proyecto nuevo.
2. Habilita la **Gmail API**.
3. Configura la pantalla de consentimiento OAuth (Externo, agrégate como tester).
4. Crea un **ID de cliente OAuth** (Aplicación web) con redirect:
   `http://localhost:8787/api/gmail/oauth2callback`
5. Copia client ID/secret al `.env`.
6. Abre `http://localhost:8787/api/gmail/auth` e inicia sesión.

Los correos aparecen en la bandeja del panel de Correo (se actualizan cada
15 s automáticamente) y "Redactar" envía correos reales desde tu cuenta.

## Frontend

- Si el servidor está corriendo, los paneles muestran el badge verde **"En vivo"**
  y usan datos reales; si no, quedan en modo **"Demo"** con datos de ejemplo.
- Para apuntar a otro servidor define `VITE_API_URL` en un archivo `.env`
  en la raíz del frontend.
