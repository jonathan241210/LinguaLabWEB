import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

interface ResponseData {
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, primer_apellido, segundo_apellido, matricula, correo, contrasena, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !primer_apellido || !matricula || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar que el correo sea único
    const existingUser = await query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Validar que la matricula sea única
    const existingMatricula = await query('SELECT id_docente FROM docentes WHERE matricula = ?', [matricula]);
    if (Array.isArray(existingMatricula) && existingMatricula.length > 0) {
      return res.status(400).json({ error: 'La matrícula ya está registrada' });
    }

    // Hashear la contraseña
    const hashedPassword = hashPassword(contrasena);

    // Insertar en tabla usuarios
    const result = await query(
      'INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, primer_apellido, segundo_apellido || null, correo, hashedPassword, rol || 'docente', 1]
    );

    const userId = (result as any).insertId;

    // Insertar en tabla docentes
    const docResult = await query(
      'INSERT INTO docentes (id_usuario_docente_fk, matricula) VALUES (?, ?)',
      [userId, matricula]
    );

    const docId = (docResult as any).insertId;

    return res.status(201).json({
      success: true,
      message: 'Docente registrado exitosamente',
      data: {
        id_usuario: userId,
        id_docente: docId,
        nombre,
        primer_apellido,
        segundo_apellido,
        matricula,
        correo,
        rol: 'docente',
      },
    });
  } catch (error) {
    console.error('Error registrando docente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
