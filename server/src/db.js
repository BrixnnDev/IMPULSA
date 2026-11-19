import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

console.log(
  '[db] diagnostico:',
  process.env.DATABASE_URL
    ? `DATABASE_URL PRESENTE (len=${process.env.DATABASE_URL.length})`
    : 'DATABASE_URL VACIA -> usando PG_* locales',
)

// Soporta Supabase/cloud mediante connection string (DATABASE_URL) o local con PG_*
const useUrl = process.env.DATABASE_URL || ''
const pool = useUrl
  ? new Pool({
      connectionString: useUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT) || 5432,
      database: process.env.PG_DATABASE || 'impulsa',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
        apellido TEXT DEFAULT '',
        cedula TEXT DEFAULT '',
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
        fecha_emparejada TEXT,
        usuario_id TEXT DEFAULT ''
      );

      ALTER TABLE pcs ADD COLUMN IF NOT EXISTS usuario_id TEXT DEFAULT '';

      CREATE TABLE IF NOT EXISTS prints (
        id TEXT PRIMARY KEY,
        pc TEXT NOT NULL,
        responsable TEXT NOT NULL,
        documento TEXT NOT NULL,
        paginas INTEGER DEFAULT 1,
        copias INTEGER DEFAULT 1,
        hora TEXT NOT NULL,
        fecha TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'Impreso',
        usuario TEXT DEFAULT '',
        impresora TEXT DEFAULT '',
        usuario_id TEXT DEFAULT '',
        archivo BYTEA,
        archivo_nombre TEXT DEFAULT '',
        archivo_tipo TEXT DEFAULT '',
        archivo_size BIGINT DEFAULT 0
      );

      ALTER TABLE prints ADD COLUMN IF NOT EXISTS usuario TEXT DEFAULT '';
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS impresora TEXT DEFAULT '';
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS usuario_id TEXT DEFAULT '';
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS archivo BYTEA;
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS archivo_nombre TEXT DEFAULT '';
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS archivo_tipo TEXT DEFAULT '';
      ALTER TABLE prints ADD COLUMN IF NOT EXISTS archivo_size BIGINT DEFAULT 0;
      CREATE INDEX IF NOT EXISTS prints_fecha_idx ON prints (fecha DESC);

      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        archivo TEXT NOT NULL UNIQUE,
        nombre_base TEXT NOT NULL,
        size BIGINT NOT NULL,
        fecha TEXT NOT NULL,
        persona TEXT DEFAULT '',
        contenido BYTEA NOT NULL
      );

      CREATE INDEX IF NOT EXISTS scans_nombre_base_size_idx ON scans (nombre_base, size);
      CREATE INDEX IF NOT EXISTS scans_fecha_idx ON scans (fecha DESC);

      CREATE TABLE IF NOT EXISTS carpetas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        padre TEXT DEFAULT '',
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

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT NOT NULL,
        clave TEXT NOT NULL,
        valor TEXT DEFAULT '',
        PRIMARY KEY (user_id, clave)
      );

CREATE TABLE IF NOT EXISTS access_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        nombre TEXT DEFAULT '',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        creado TEXT NOT NULL,
        usado_en TEXT
      );

      CREATE TABLE IF NOT EXISTS keys (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        rol TEXT NOT NULL,
        usado BOOLEAN NOT NULL DEFAULT FALSE,
        creado_por TEXT DEFAULT '',
        creado TEXT NOT NULL,
        user_id TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS mensajes (
        id TEXT PRIMARY KEY,
        de_user TEXT DEFAULT '',
        para_user TEXT DEFAULT '',
        texto TEXT DEFAULT '',
        leido BOOLEAN NOT NULL DEFAULT FALSE,
        fecha TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS web_carpetas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'global',
        creado TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS web_accesos (
        id TEXT PRIMARY KEY,
        carpeta_id TEXT NOT NULL,
        url TEXT NOT NULL,
        nombre TEXT NOT NULL,
        creado_por TEXT DEFAULT '',
        creado TEXT NOT NULL
      );
    `)

    // Seed del admin maestro — credenciales configurables por variables de entorno
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@impulsa.app'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    await client.query(
      `INSERT INTO users (id, name, email, password, rol, verificado, creado, verificado_en)
       VALUES ('u-admin', 'Administrador', $1, $2, 'admin', TRUE, $3, $3)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password`,
      [adminEmail, adminPassword, new Date().toISOString()],
    )
    console.log(`[db] Admin maestro: ${adminEmail}`)

    // Migraciones para tablas ya existentes (mantiene datos)
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion avatar_url:', e.message)
    }
    // Columna short_id: ID numérico de 8 dígitos único por usuario
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS short_id TEXT DEFAULT ''`)
      // Backfill: asignar short_id a usuarios que no tienen uno
      const sinId = await client.query(`SELECT id FROM users WHERE short_id IS NULL OR short_id = ''`)
      for (const row of sinId.rows) {
        const sid = String(Math.floor(10000000 + Math.random() * 90000000))
        await client.query(`UPDATE users SET short_id = $1 WHERE id = $2`, [sid, row.id])
      }
    } catch (e) {
      console.warn('[db] migracion short_id:', e.message)
    }
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS apellido TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion users.apellido:', e.message)
    }
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cedula TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion users.cedula:', e.message)
    }
    try {
      await client.query(`ALTER TABLE keys ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion keys.user_id:', e.message)
    }

    // Migración: carpetas anidadas (padre). Las carpetas de usuario viven dentro
    // de la carpeta raíz "Usuarios".
    try {
      await client.query(`ALTER TABLE carpetas ADD COLUMN IF NOT EXISTS padre TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion carpetas.padre:', e.message)
    }

    // Migraciones del flujo de aprobación de comisiones/valecitos
    try {
      await client.query(`ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS aprobado BOOLEAN DEFAULT FALSE`)
    } catch (e) {
      console.warn('[db] migracion comisiones.aprobado:', e.message)
    }
    try {
      await client.query(`ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS local TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion comisiones.local:', e.message)
    }
    try {
      await client.query(`ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS aprobado_por TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion comisiones.aprobado_por:', e.message)
    }
    try {
      await client.query(`ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS aprobado_en TEXT DEFAULT ''`)
    } catch (e) {
      console.warn('[db] migracion comisiones.aprobado_en:', e.message)
    }

    // Backfill heurístico: keys usadas antes de que se guardara user_id.
    // Relaciona cada key ya usada sin usuario con un usuario verificado del mismo
    // rol, sin key asignada, cuya verificación ocurrió justo después de crear la key.
    try {
      const keysRes = await client.query(
        `SELECT id, codigo, rol, creado FROM keys
         WHERE usado = TRUE AND (user_id IS NULL OR user_id = '')
         ORDER BY creado ASC`,
      )
      const assignees = new Set()
      const assignedUsers = new Set()
      for (const k of keysRes.rows) {
        const cand = await client.query(
          `SELECT id, name FROM users
           WHERE verificado = TRUE
             AND rol = $1
             AND verificado_en IS NOT NULL
             AND id NOT IN (SELECT user_id FROM keys WHERE user_id IS NOT NULL AND user_id <> '')
           ORDER BY ABS(EXTRACT(EPOCH FROM (verificado_en::timestamptz - $2::timestamptz))) ASC
           LIMIT 1`,
          [k.rol, k.creado],
        )
        if (cand.rows[0] && !assignedUsers.has(cand.rows[0].id)) {
          await client.query('UPDATE keys SET user_id = $1 WHERE id = $2', [cand.rows[0].id, k.id])
          assignees.add(`${k.codigo} -> ${cand.rows[0].name}`)
          assignedUsers.add(cand.rows[0].id)
        }
      }
      if (assignees.size) console.log('[db] backfill keys:', [...assignees])
    } catch (e) {
      console.warn('[db] backfill keys:', e.message)
    }

    // Eliminar credenciales antiguas de prueba si existen
    try {
      await client.query(`DELETE FROM users WHERE email = 'bxzaradmin@gmail.com'`)
    } catch (e) {
      console.warn('[db] limpieza credenciales antiguas:', e.message)
    }

    // Carpeta raíz "Usuarios": dentro de ella se crean las carpetas personales
    // de cada usuario que se registra.
    try {
      const existeUsuarios = await client.query(`SELECT 1 FROM carpetas WHERE nombre = 'Usuarios'`)
      if (!existeUsuarios.rowCount) {
        await client.query(
          `INSERT INTO carpetas (id, nombre, padre, creado_por, fecha) VALUES ($1,'Usuarios','','',$2)`,
          [`carp-usuarios`, new Date().toISOString()],
        )
        console.log('[db] Carpeta raíz "Usuarios" creada.')
      }
    } catch (e) {
      console.warn('[db] carpeta Usuarios:', e.message)
    }

    // Migración única: mueve a "Usuarios" las carpetas personales ya existentes
    // (creadas antes de la estructura anidada). Son las que llevan el nombre de
    // un usuario registrado.
    try {
      const movidas = await client.query(
        `UPDATE carpetas c SET padre = 'Usuarios'
         WHERE (c.padre IS NULL OR c.padre = '')
           AND c.nombre <> 'Usuarios'
           AND EXISTS (SELECT 1 FROM users u WHERE u.name = c.nombre)
         RETURNING c.nombre`,
      )
      if (movidas.rowCount) {
        console.log(`[db] Carpetas de usuario movidas a "Usuarios": ${movidas.rows.map((r) => r.nombre).join(', ')}`)
      }
    } catch (e) {
      console.warn('[db] migracion carpetas -> Usuarios:', e.message)
    }

    console.log('[db] Tablas listas.')

    console.log('[db] PostgreSQL conectado, tablas (persistentes) listas.')
  } finally {
    client.release()
  }
}

export { pool }
