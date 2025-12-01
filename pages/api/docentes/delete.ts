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

    const { id_docente } = req.body;

    if (!id_docente) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }

    // Obtener id_usuario del docente
    const docenteResult: any = await query(
      'SELECT id_usuario_docente_fk FROM docentes WHERE id_docente = ?',
      [id_docente]
    );

    if (!docenteResult || docenteResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const id_usuario = docenteResult[0].id_usuario_docente_fk;

    // Eliminar relaciones con grupos
    await query('DELETE FROM docente_grupo WHERE id_docente_dg_fk = ?', [id_docente]);

    // Eliminar registro de docente
    await query('DELETE FROM docentes WHERE id_docente = ?', [id_docente]);

    // Eliminar usuario
    await query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);

    return res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error deleting teacher: ' + error.message
    });
  }
}
