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

    const { id_grupo } = req.body;

    if (!id_grupo) {
      return res.status(400).json({ success: false, message: 'Group ID is required' });
    }

    // Eliminar relaciones con docentes
    await query('DELETE FROM docente_grupo WHERE id_grupo_dg_fk = ?', [id_grupo]);

    // Eliminar relaciones con alumnos
    await query('DELETE FROM alumno_grupo WHERE id_grupo_ag_fk = ?', [id_grupo]);

    // Eliminar el grupo
    await query('DELETE FROM grupos WHERE id_grupo = ?', [id_grupo]);

    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting group:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error deleting group: ' + error.message
    });
  }
}
