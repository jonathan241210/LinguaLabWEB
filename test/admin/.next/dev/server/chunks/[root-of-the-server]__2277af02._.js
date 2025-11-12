module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/mysql2/promise [external] (mysql2/promise, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mysql2/promise", () => require("mysql2/promise"));

module.exports = mod;
}),
"[project]/test/lib/db.js [api] (ecmascript)", ((__turbopack_context__, module, exports) => {

const mysql = __turbopack_context__.r("[externals]/mysql2/promise [external] (mysql2/promise, cjs)");
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'tu_usuario',
    password: process.env.DB_PASSWORD || 'tu_contraseña',
    database: process.env.DB_NAME || 'lingualab2'
};
let pool = null;
function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}
module.exports = {
    getPool
};
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/test/lib/hash.js [api] (ecmascript)", ((__turbopack_context__, module, exports) => {

const crypto = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}
function verifyPassword(password, stored) {
    const [salt, key] = stored.split(':');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    const keyBuf = Buffer.from(key, 'hex');
    const derivedBuf = Buffer.from(derived, 'hex');
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
}
module.exports = {
    hashPassword,
    verifyPassword
};
}),
"[project]/test/pages/api/register.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
const { getPool } = __turbopack_context__.r("[project]/test/lib/db.js [api] (ecmascript)") || __turbopack_context__.r("[project]/test/lib/db.js [api] (ecmascript)");
const { hashPassword } = __turbopack_context__.r("[project]/test/lib/hash.js [api] (ecmascript)") || __turbopack_context__.r("[project]/test/lib/hash.js [api] (ecmascript)");
async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', [
            'POST'
        ]);
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }
    const { nombre, primer_apellido, segundo_apellido, correo, contrasena, rol } = req.body || {};
    if (!nombre || !primer_apellido || !correo || !contrasena) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios'
        });
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const hashed = hashPassword(contrasena);
        const [result] = await conn.execute('INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)', [
            nombre,
            primer_apellido,
            segundo_apellido || null,
            correo,
            hashed,
            rol || 'administrador'
        ]);
        const insertId = result.insertId || result && result[0] && result[0].insertId;
        await conn.execute('INSERT INTO administradores (id_usuario_admin_fk, permisos) VALUES (?, ?)', [
            insertId,
            JSON.stringify({
                super: true
            })
        ]);
        await conn.commit();
        return res.status(201).json({
            ok: true,
            id: insertId
        });
    } catch (err) {
        await conn.rollback();
        console.error('DB error:', err);
        if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({
            error: 'Correo ya registrado'
        });
        return res.status(500).json({
            error: 'Error en la base de datos'
        });
    } finally{
        conn.release();
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2277af02._.js.map