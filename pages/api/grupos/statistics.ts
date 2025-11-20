import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Group ID is required' });
  }

  try {
    const id_grupo = parseInt(id);

    // Información básica del grupo
    const grupoInfo: any = await query(
      `SELECT 
        g.id_grupo,
        g.nombre AS grupo_nombre,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        pe.nombre AS programa,
        CONCAT(ud.nombre, ' ', ud.primer_apellido) AS docente_nombre,
        COUNT(DISTINCT ag.id_alumno_ag_fk) AS total_students
      FROM grupos g
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN programas_educativos pe ON coh.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios ud ON d.id_usuario_docente_fk = ud.id_usuario
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo_ag_fk AND ag.activo = 1
      WHERE g.id_grupo = ?
      GROUP BY g.id_grupo, g.nombre, c.nombre, coh.etiqueta, pe.nombre, ud.nombre, ud.primer_apellido`,
      [id_grupo]
    );

    if (!grupoInfo || grupoInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Estadísticas generales del grupo
    const groupStats: any = await query(
      `SELECT 
        COUNT(DISTINCT r.id_alumno_resultado_fk) AS students_with_activity,
        COUNT(DISTINCT r.id_resultado) AS total_labs_attempted,
        SUM(CASE WHEN r.completado = 1 THEN 1 ELSE 0 END) AS total_labs_completed,
        SUM(CASE WHEN r.aprobado = 1 THEN 1 ELSE 0 END) AS total_labs_passed,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS average_score,
        SUM(IFNULL(r.experiencia_ganada, 0)) AS total_xp
      FROM resultados r
      INNER JOIN alumno_grupo ag ON r.id_alumno_resultado_fk = ag.id_alumno_ag_fk
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1`,
      [id_grupo]
    );

    // Top 5 estudiantes por promedio
    const topStudents: any = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS nombre_completo,
        COUNT(DISTINCT CASE WHEN r.completado = 1 THEN r.id_resultado END) AS labs_completed,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS average_score,
        SUM(IFNULL(r.experiencia_ganada, 0)) AS total_experience
      FROM alumnos a
      INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      INNER JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk
      LEFT JOIN resultados r ON a.id_alumno = r.id_alumno_resultado_fk
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1
      GROUP BY a.id_alumno
      HAVING labs_completed >= 1
      ORDER BY average_score DESC, total_experience DESC
      LIMIT 5`,
      [id_grupo]
    );

    // Estudiantes que necesitan apoyo
    const studentsNeedingHelp: any = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido) AS nombre_completo,
        IFNULL(COUNT(DISTINCT CASE WHEN r.completado = 1 THEN r.id_resultado END), 0) AS labs_completed,
        IFNULL(AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END), 0) AS average_score
      FROM alumnos a
      INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      INNER JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk
      LEFT JOIN resultados r ON a.id_alumno = r.id_alumno_resultado_fk
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1
      GROUP BY a.id_alumno
      HAVING labs_completed = 0 OR average_score < 70
      ORDER BY labs_completed ASC, average_score ASC
      LIMIT 5`,
      [id_grupo]
    );

    // Progreso por tipo de juego
    const progressByGameType: any = await query(
      `SELECT 
        j.nombre AS tipo_juego,
        j.icono,
        COUNT(DISTINCT r.id_resultado) AS total_attempts,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS average_score
      FROM resultados r
      INNER JOIN actividades act ON r.id_actividad_resultado_fk = act.id_actividad
      INNER JOIN juegos j ON act.id_juego_actividad_fk = j.id_juego
      INNER JOIN alumno_grupo ag ON r.id_alumno_resultado_fk = ag.id_alumno_ag_fk
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1
      GROUP BY j.id_juego, j.nombre, j.icono
      ORDER BY total_attempts DESC`,
      [id_grupo]
    );

    // Distribución de calificaciones
    const scoreDistribution: any = await query(
      `SELECT 
        CASE 
          WHEN r.puntaje >= 90 THEN '90-100'
          WHEN r.puntaje >= 80 THEN '80-89'
          WHEN r.puntaje >= 70 THEN '70-79'
          WHEN r.puntaje >= 60 THEN '60-69'
          ELSE '0-59'
        END AS score_range,
        COUNT(*) AS student_count
      FROM resultados r
      INNER JOIN alumno_grupo ag ON r.id_alumno_resultado_fk = ag.id_alumno_ag_fk
      WHERE ag.id_grupo_ag_fk = ? AND ag.activo = 1 AND r.completado = 1
      GROUP BY score_range
      ORDER BY score_range DESC`,
      [id_grupo]
    );

    // Progreso mensual
    const monthlyProgress: any = await query(
      `SELECT 
        DATE_FORMAT(r.fecha, '%M %Y') AS month_name,
        COUNT(*) AS labs_completed,
        AVG(r.puntaje) AS average_score
      FROM resultados r
      INNER JOIN alumno_grupo ag ON r.id_alumno_resultado_fk = ag.id_alumno_ag_fk
      WHERE ag.id_grupo_ag_fk = ? 
        AND ag.activo = 1
        AND r.completado = 1
        AND r.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(r.fecha, '%Y-%m')
      ORDER BY DATE_FORMAT(r.fecha, '%Y-%m') DESC`,
      [id_grupo]
    );

    // Actividades asignadas
    const assignedLabs: any = await query(
      `SELECT 
        act.id_actividad,
        act.titulo AS nombre_laboratorio,
        j.nombre AS tipo_juego,
        actg.publicado,
        actg.fecha_asignacion
      FROM actividad_grupo actg
      INNER JOIN actividades act ON actg.id_actividad_ag_fk = act.id_actividad
      INNER JOIN juegos j ON act.id_juego_actividad_fk = j.id_juego
      WHERE actg.id_grupo_ag_fk = ?
      ORDER BY actg.fecha_asignacion DESC`,
      [id_grupo]
    );

    return res.status(200).json({
      success: true,
      data: {
        groupInfo: grupoInfo[0],
        groupStats: groupStats[0],
        topStudents,
        studentsNeedingHelp,
        progressByGameType,
        scoreDistribution,
        monthlyProgress,
        assignedLabs
      }
    });
  } catch (error: any) {
    console.error('Error getting group statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving group statistics',
      error: error.message
    });
  }
}
