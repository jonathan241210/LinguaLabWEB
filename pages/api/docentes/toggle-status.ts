import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_docente, activo } = req.body;

    if (!id_docente || typeof activo !== 'boolean') {
      return res.status(400).json({ success: false, message: 'ID de docente y estado activo son requeridos' });
    }

    // Actualizar el estado activo del usuario asociado al docente
    const result = await query(
      `UPDATE usuarios u 
       JOIN docentes d ON u.id_usuario = d.id_usuario_docente_fk 
       SET u.activo = ? 
       WHERE d.id_docente = ?`,
      [activo ? 1 : 0, id_docente]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Docente no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: `Docente ${activo ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error: any) {
    console.error('Error al cambiar estado del docente:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
  }
}