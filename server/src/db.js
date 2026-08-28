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
    // Rediseño completo de la base de datos: se reconstruyen las tablas
    // (las claves quedan vacias al rediseñar; el admin maestro se re-siembra)
    await client.query('DROP TABLE IF EXISTS prints, pcs, users CASCADE')
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        telefono TEXT DEFAULT '',
        rol TEXT NOT NULL DEFAULT 'digitador',
        verificado BOOLEAN NOT NULL DEFAULT FALSE,
        codigo TEXT DEFAULT '',
        creado TEXT NOT NULL,
        verificado_en TEXT
      );

      CREATE TABLE pcs (
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

      CREATE TABLE prints (
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
    `)

    // Seed del admin maestro
    await client.query(
      `INSERT INTO users (id, name, email, password, rol, verificado, creado, verificado_en)
       VALUES ('u-admin', 'Administrador', 'admin@stockflow.com', 'admin123', 'admin', TRUE, $1, $1)
       ON CONFLICT (email) DO NOTHING`,
      [new Date().toISOString()],
    )

    console.log('[db] PostgreSQL conectado, base de datos rediseñada y lista.')
  } finally {
    client.release()
  }
}

export { pool }
