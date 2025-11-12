const { getPool } = require('../../lib/db');
const { hashPassword } = require('../../lib/hash');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, primer_apellido, segundo_apellido, correo, contrasena, matricula } = req.body || {};
  if (!nombre || !primer_apellido || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const hashed = hashPassword(contrasena);

    // Insert usuario con rol 'docente'
    const [result] = await conn.execute(
      'INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, primer_apellido, segundo_apellido || null, correo, hashed, 'docente']
    );

    const insertId = result.insertId || (result && result[0] && result[0].insertId);

    // Insert en docentes (id_usuario_docente_fk, matricula)
    await conn.execute('INSERT INTO docentes (id_usuario_docente_fk, matricula) VALUES (?, ?)', [insertId, matricula || null]);

    await conn.commit();
    return res.status(201).json({ ok: true, id: insertId });
  } catch (err) {
    await conn.rollback();
    console.error('DB error (docente):', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Correo o matrícula duplicada' });
    return res.status(500).json({ error: 'Error en la base de datos' });
  } finally {
    conn.release();
  }
}
