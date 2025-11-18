import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_alumno, activo } = req.body;

    if (!id_alumno || typeof activo !== 'boolean') {
      return res.status(400).json({ success: false, message: 'ID de alumno y estado activo son requeridos' });
    }

    // Actualizar el estado activo del usuario asociado al alumno
    const result = await query(
      `UPDATE usuarios u 
       JOIN alumnos a ON u.id_usuario = a.id_usuario_alumno_fk 
       SET u.activo = ? 
       WHERE a.id_alumno = ?`,
      [activo ? 1 : 0, id_alumno]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: `Alumno ${activo ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error: any) {
    console.error('Error al cambiar estado del alumno:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
  }
}