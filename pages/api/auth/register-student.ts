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
    const {
      nombre,
      primer_apellido,
      segundo_apellido,
      matricula,
      correo,
      contrasena,
      rol,
    } = req.body;

    if (!nombre || !primer_apellido || !matricula || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const existingUser = await query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const existingMatricula = await query('SELECT id_alumno FROM alumnos WHERE matricula = ?', [matricula]);
    if (Array.isArray(existingMatricula) && existingMatricula.length > 0) {
      return res.status(400).json({ error: 'La matrícula ya está registrada' });
    }

    const hashedPassword = hashPassword(contrasena);

    const userResult = await query(
      'INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, correo, contrasena, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, primer_apellido, segundo_apellido || null, correo, hashedPassword, rol || 'alumno', 1]
    );
    const userId = (userResult as any).insertId;

    // Insertar alumno SIN programa ni nivel (se asignarán al crear grupo)
    const studentResult = await query(
      'INSERT INTO alumnos (id_usuario_alumno_fk, matricula) VALUES (?, ?)',
      [userId, matricula]
    );

    return res.status(201).json({
      success: true,
      message: 'Alumno registrado exitosamente',
      data: {
        id_usuario: userId,
        id_alumno: (studentResult as any).insertId,
        nombre,
        primer_apellido,
        segundo_apellido,
        matricula,
        correo,
        rol: 'alumno',
      },
    });
  } catch (error) {
    console.error('Error registrando alumno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
