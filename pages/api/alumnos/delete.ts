import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || (decoded as any).rol !== 'administrador') {
      return res.status(403).json({ success: false, message: 'Unauthorized - Admin access required' });
    }

    const { id_alumno } = req.body;

    if (!id_alumno) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // Obtener id_usuario del alumno
    const alumnoResult: any = await query(
      'SELECT id_usuario_alumno_fk FROM alumnos WHERE id_alumno = ?',
      [id_alumno]
    );

    if (!alumnoResult || alumnoResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const id_usuario = alumnoResult[0].id_usuario_alumno_fk;

    // Eliminar relaciones con grupos
    await query('DELETE FROM alumno_grupo WHERE id_alumno_ag_fk = ?', [id_alumno]);

    // Eliminar resultados de laboratorios
    await query('DELETE FROM resultados WHERE id_alumno_resultado_fk = ?', [id_alumno]);

    // Eliminar registro de alumno
    await query('DELETE FROM alumnos WHERE id_alumno = ?', [id_alumno]);

    // Eliminar usuario
    await query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error deleting student: ' + error.message
    });
  }
}
