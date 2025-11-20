import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

/**
 * API para eliminar un laboratorio
 * DELETE /api/laboratorios/delete
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id_laboratorio } = req.body;

    if (!id_laboratorio) {
      return res.status(400).json({ error: 'Laboratory ID is required' });
    }

    // Verificar si el laboratorio tiene resultados asociados
    const checkResultados = await query(
      'SELECT COUNT(*) as count FROM resultados WHERE id_actividad_resultado_fk = ?',
      [id_laboratorio]
    );

    const hasResults = (checkResultados as any)[0].count > 0;

    if (hasResults) {
      return res.status(400).json({ 
        error: 'Cannot delete laboratory with existing student results. Please unpublish it instead.' 
      });
    }

    // Eliminar asignaciones de grupos primero (si existen)
    await query(
      'DELETE FROM actividad_grupo WHERE id_actividad_ag_fk = ?',
      [id_laboratorio]
    );

    // Eliminar el laboratorio
    await query(
      'DELETE FROM actividades WHERE id_actividad = ?',
      [id_laboratorio]
    );

    return res.status(200).json({ 
      success: true,
      message: 'Laboratory deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting laboratory:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
