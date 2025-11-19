import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Student ID is required' });
  }

  try {
    const id_alumno = parseInt(id);

    // Información básica del alumno
    const alumnoInfo: any = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        u.correo,
        pe.nombre AS programa,
        u.activo AS usuario_activo,
        g.nombre AS grupo_nombre,
        c.nombre AS cuatrimestre,
        coh.etiqueta AS cohorte,
        ag.fecha_ingreso,
        DATEDIFF(CURDATE(), ag.fecha_ingreso) AS dias_en_programa,
        CONCAT(ud.nombre, ' ', ud.primer_apellido) AS docente_nombre
      FROM alumnos a
      INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      LEFT JOIN programas_educativos pe ON a.id_programa_alumno_fk = pe.id_programa
      LEFT JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk AND ag.activo = 1
      LEFT JOIN grupos g ON ag.id_grupo_ag_fk = g.id_grupo
      LEFT JOIN cuatrimestres c ON g.id_cuatrimestre_grupo_fk = c.id_cuatrimestre
      LEFT JOIN cohortes coh ON g.id_cohorte_grupo_fk = coh.id_cohorte
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios ud ON d.id_usuario_docente_fk = ud.id_usuario
      WHERE a.id_alumno = ?`,
      [id_alumno]
    );

    if (!alumnoInfo || alumnoInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Estadísticas de actividades/laboratorios
    const labStats: any = await query(
      `SELECT 
        COUNT(DISTINCT r.id_resultado) AS total_labs_attempted,
        SUM(CASE WHEN r.completado = 1 THEN 1 ELSE 0 END) AS labs_completed,
        SUM(CASE WHEN r.aprobado = 1 THEN 1 ELSE 0 END) AS labs_passed,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS average_score,
        SUM(IFNULL(r.experiencia_ganada, 0)) AS total_experience,
        SUM(CASE WHEN r.completado = 1 THEN IFNULL(r.tiempo_segundos, 0) ELSE 0 END) AS total_time_seconds,
        SUM(IFNULL(r.aciertos, 0)) AS total_correct_words,
        SUM(IFNULL(r.errores, 0)) AS total_incorrect_words,
        SUM(IFNULL(r.palabras_totales, 0)) AS total_words,
        MAX(r.puntaje) AS highest_score,
        MIN(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS lowest_score
      FROM resultados r
      WHERE r.id_alumno_resultado_fk = ?`,
      [id_alumno]
    );

    // Progreso por tipo de juego
    const progressByType: any = await query(
      `SELECT 
        j.nombre_juego AS game_type,
        j.icono,
        COUNT(DISTINCT r.id_resultado) AS attempts,
        SUM(CASE WHEN r.completado = 1 THEN 1 ELSE 0 END) AS completed,
        AVG(CASE WHEN r.completado = 1 THEN r.puntaje ELSE NULL END) AS avg_score,
        SUM(IFNULL(r.experiencia_ganada, 0)) AS experience_earned
      FROM resultados r
      INNER JOIN actividades act ON r.id_actividad_resultado_fk = act.id_actividad
      INNER JOIN juegos j ON act.id_juego_actividad_fk = j.id_juego
      WHERE r.id_alumno_resultado_fk = ?
      GROUP BY j.id_juego, j.nombre_juego, j.icono
      ORDER BY experience_earned DESC`,
      [id_alumno]
    );

    // Últimos 10 actividades completadas
    const recentLabs: any = await query(
      `SELECT 
        act.titulo AS titulo,
        j.nombre_juego AS game_type,
        j.icono,
        r.puntaje AS puntuacion,
        r.experiencia_ganada,
        r.fecha AS fecha_completado,
        r.tiempo_segundos AS tiempo_empleado,
        r.aprobado
      FROM resultados r
      INNER JOIN actividades act ON r.id_actividad_resultado_fk = act.id_actividad
      INNER JOIN juegos j ON act.id_juego_actividad_fk = j.id_juego
      WHERE r.id_alumno_resultado_fk = ? AND r.completado = 1
      ORDER BY r.fecha DESC
      LIMIT 10`,
      [id_alumno]
    );

    // Progreso mensual (últimos 6 meses)
    const monthlyProgress: any = await query(
      `SELECT 
        DATE_FORMAT(r.fecha, '%Y-%m') AS month,
        COUNT(*) AS labs_completed,
        AVG(r.puntaje) AS avg_score,
        SUM(IFNULL(r.experiencia_ganada, 0)) AS experience_gained
      FROM resultados r
      WHERE r.id_alumno_resultado_fk = ? 
        AND r.completado = 1
        AND r.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(r.fecha, '%Y-%m')
      ORDER BY month DESC`,
      [id_alumno]
    );

    // Top 5 palabras con más dominio
    const topWords: any = await query(
      `SELECT 
        palabra,
        veces_correcta,
        veces_incorrecta,
        tasa_exito,
        nivel_dominio
      FROM estadisticas_palabras
      WHERE id_alumno_fk = ?
      ORDER BY tasa_exito DESC, veces_correcta DESC
      LIMIT 5`,
      [id_alumno]
    );

    // Palabras que necesitan práctica
    const weakWords: any = await query(
      `SELECT 
        palabra,
        veces_correcta,
        veces_incorrecta,
        tasa_exito,
        nivel_dominio
      FROM estadisticas_palabras
      WHERE id_alumno_fk = ? AND veces_vista >= 3
      ORDER BY tasa_exito ASC, veces_incorrecta DESC
      LIMIT 5`,
      [id_alumno]
    );

    return res.status(200).json({
      success: true,
      data: {
        student: alumnoInfo[0],
        labStats: labStats[0],
        progressByType,
        recentLabs,
        monthlyProgress,
        topWords,
        weakWords
      }
    });
  } catch (error: any) {
    console.error('Error getting student statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student statistics',
      error: error.message
    });
  }
}
