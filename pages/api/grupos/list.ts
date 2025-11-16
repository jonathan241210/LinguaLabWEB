import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Obtener todos los grupos con info de cuatrimestre, cohorte, docente y conteo de alumnos
    const grupos = await query(
      `SELECT 
        g.id_grupo,
        g.nombre,
        g.estado_practicas,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS docente,
        d.id_docente,
        COUNT(DISTINCT ag.id_alumno_ag_fk) AS total_alumnos
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo_ag_fk AND ag.activo = 1
      GROUP BY g.id_grupo, g.nombre, g.estado_practicas, c.nombre, coh.etiqueta, docente, d.id_docente
      ORDER BY c.nombre ASC, g.nombre ASC`
    );

    res.status(200).json({
      success: true,
      data: grupos,
    });
  } catch (error: any) {
    console.error('Error al listar grupos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener grupos', error: error.message });
  }
}
