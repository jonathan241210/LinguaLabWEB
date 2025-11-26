import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verificar token de autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded || !decoded.id_usuario) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Obtener id_docente del usuario
    const docenteResult: any = await query(
      'SELECT id_docente FROM docentes WHERE id_usuario_docente_fk = ?',
      [decoded.id_usuario]
    );

    if (!docenteResult || docenteResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const id_docente = docenteResult[0].id_docente;

    // Obtener grupos asignados al docente
    const grupos: any = await query(
      `SELECT 
        g.id_grupo,
        g.nombre AS grupo_nombre,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        pe.nombre AS programa,
        COUNT(DISTINCT ag.id_alumno_ag_fk) AS total_alumnos,
        COUNT(DISTINCT actg.id_actividad_ag_fk) AS actividades_publicadas,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS promedio_grupo
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN programas_educativos pe ON coh.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo_ag_fk AND ag.activo = 1
      LEFT JOIN actividad_grupo actg ON g.id_grupo = actg.id_grupo_ag_fk
      LEFT JOIN resultados r ON ag.id_alumno_ag_fk = r.id_alumno_resultado_fk
      INNER JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk
      WHERE dg.id_docente_dg_fk = ? AND dg.activo = 1
      GROUP BY g.id_grupo, g.nombre, c.nombre, coh.etiqueta, pe.nombre
      ORDER BY g.nombre ASC`,
      [id_docente]
    );

    return res.status(200).json({
      success: true,
      grupos: grupos || []
    });
  } catch (error: any) {
    console.error('Error fetching teacher groups:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving teacher groups',
      error: error.message
    });
  }
}
