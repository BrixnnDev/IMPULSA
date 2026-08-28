import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'stockflow',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
})

export async function initDb() {
  const client = await pool.connect()
  try {
    // Modelo PERSISTENTE: se crean las tablas si no existen (no se destruyen
    // los datos en cada arranque). Los documentos/carpetas/comisiones se conservan.
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        telefono TEXT DEFAULT '',
        rol TEXT NOT NULL DEFAULT 'digitador',
        verificado BOOLEAN NOT NULL DEFAULT FALSE,
        codigo TEXT DEFAULT '',
        creado TEXT NOT NULL,
        verificado_en TEXT,
        avatar_url TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS pcs (
        id TEXT PRIMARY KEY,
        etiqueta TEXT NOT NULL,
        responsable TEXT NOT NULL,
        email TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        rol TEXT DEFAULT 'digitador',
        ip TEXT DEFAULT '',
        mac TEXT DEFAULT '',
        sistema TEXT DEFAULT '',
        ubicacion TEXT DEFAULT '',
        codigo TEXT NOT NULL,
        emparejada BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_creacion TEXT NOT NULL,
        fecha_emparejada TEXT
      );

      CREATE TABLE IF NOT EXISTS prints (
        id TEXT PRIMARY KEY,
        pc TEXT NOT NULL,
        responsable TEXT NOT NULL,
        documento TEXT NOT NULL,
        paginas INTEGER DEFAULT 1,
        copias INTEGER DEFAULT 1,
        hora TEXT NOT NULL,
        fecha TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Impreso'
      );

      CREATE TABLE IF NOT EXISTS carpetas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        creado_por TEXT DEFAULT '',
        fecha TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT DEFAULT '',
        tamano INTEGER DEFAULT 0,
        ruta TEXT DEFAULT '',
        carpeta TEXT DEFAULT '',
        subido_por TEXT DEFAULT '',
        user_id TEXT DEFAULT '',
        fecha TEXT NOT NULL,
        estado TEXT DEFAULT 'Finalizado'
      );

      CREATE TABLE IF NOT EXISTS comisiones (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT '',
        trabajador TEXT DEFAULT '',
        trabajo_id TEXT DEFAULT '',
        total REAL DEFAULT 0,
        ganancia REAL DEFAULT 0,
        panaderia REAL DEFAULT 0,
        nota TEXT DEFAULT '',
        estado TEXT DEFAULT 'Pendiente',
        fecha TEXT NOT NULL
      );
    `)

    // Seed del admin maestro
    await client.query(
      `INSERT INTO users (id, name, email, password, rol, verificado, creado, verificado_en)
       VALUES ('u-admin', 'Administrador', 'admin@stockflow.com', 'admin123', 'admin', TRUE, $1, $1)
       ON CONFLICT (email) DO NOTHING`,
      [new Date().toISOString()],
    )

    // Migraciones para tablas ya existentes (mantiene datos)
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion avatar_url:', e.message)
    }

    // Carpetas iniciales por defecto
    for (const nombre of ['Hojas de vida', 'Contratos', 'Reportes']) {
      await client.query(
        `INSERT INTO carpetas (id, nombre, creado_por, fecha)
         VALUES ($1, $2, '', $3) ON CONFLICT (nombre) DO NOTHING`,
        [`carp-${Math.random().toString(36).slice(2, 10)}`, nombre, new Date().toISOString()],
      )
    }

    console.log('[db] PostgreSQL conectado, tablas (persistentes) listas.')
  } finally {
    client.release()
  }
}

export { pool }
