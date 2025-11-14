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
      id_programa_alumno_fk,
      id_nivel_alumno_fk,
      contrasena,
      rol,
    } = req.body;

    if (!nombre || !primer_apellido || !matricula || !correo || !id_programa_alumno_fk || !id_nivel_alumno_fk || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar que los IDs de programa y nivel existan
    const programaExists = await query('SELECT id_programa FROM programas_educativos WHERE id_programa = ? AND activo = 1', [id_programa_alumno_fk]);
    if (!Array.isArray(programaExists) || programaExists.length === 0) {
      return res.status(400).json({ error: 'El programa educativo seleccionado no es válido' });
    }

    const nivelExists = await query('SELECT id_nivel FROM niveles_educativos WHERE id_nivel = ? AND activo = 1', [id_nivel_alumno_fk]);
    if (!Array.isArray(nivelExists) || nivelExists.length === 0) {
      return res.status(400).json({ error: 'El nivel educativo seleccionado no es válido' });
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

    const studentResult = await query(
      'INSERT INTO alumnos (id_usuario_alumno_fk, matricula, id_programa_alumno_fk, id_nivel_alumno_fk) VALUES (?, ?, ?, ?)',
      [userId, matricula, id_programa_alumno_fk, id_nivel_alumno_fk]
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
        id_programa_alumno_fk,
        id_nivel_alumno_fk,
        rol: 'alumno',
      },
    });
  } catch (error) {
    console.error('Error registrando alumno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
