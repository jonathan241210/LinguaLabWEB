import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de grupo requerido' });
    }

    // Info básica del grupo
    const grupoInfo: any = await query(
      `SELECT 
        g.id_grupo,
        g.nombre,
        g.estado_practicas,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        coh.anio_ingreso,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS docente,
        d.matricula AS matricula_docente,
        dg.fecha_inicio AS docente_desde
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      WHERE g.id_grupo = ?`,
      [id]
    );

    if (!grupoInfo || grupoInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    // Alumnos del grupo
    const alumnos = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', u.segundo_apellido) AS nombre_completo,
        a.promedio_general,
        a.experiencia_total,
        ag.fecha_ingreso
      FROM alumno_grupo ag
      JOIN alumnos a ON ag.id_alumno_ag_fk = a.id_alumno
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1
      ORDER BY u.primer_apellido, u.nombre`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        grupo: grupoInfo[0],
        alumnos,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener detalle del grupo:', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalle', error: error.message });
  }
}
