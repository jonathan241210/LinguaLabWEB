import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_grupo, id_alumno } = req.body;

    // Validaciones
    if (!id_grupo || !id_alumno) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: id_grupo, id_alumno',
      });
    }

    // Soft-delete: marcar como inactivo
    const result: any = await query(
      `UPDATE alumno_grupo 
       SET activo = 0, fecha_egreso = CURDATE()
       WHERE id_grupo_ag_fk = ? AND id_alumno_ag_fk = ? AND activo = 1`,
      [id_grupo, id_alumno]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado en este grupo o ya fue removido',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alumno removido del grupo exitosamente',
    });
  } catch (error: any) {
    console.error('Error al remover alumno:', error);
    res.status(500).json({ success: false, message: 'Error al remover alumno', error: error.message });
  }
}
