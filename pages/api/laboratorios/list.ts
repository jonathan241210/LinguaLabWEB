import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sqlQuery = `
      SELECT 
        a.id_actividad AS id_laboratorio,
        a.titulo,
        a.nivel,
        a.numero_palabras,
        j.nombre AS tipo_juego,
        j.tipo_juego AS tipo_juego_code,
        j.icono,
        a.publicado,
        a.experiencia_base,
        a.experiencia_bonus_perfecto,
        a.puntuacion_minima_aprobar,
        a.tiempo_limite,
        a.intentos_permitidos,
        a.permitir_pistas,
        COUNT(DISTINCT ag.id_grupo_fk) AS grupos_asignados,
        COUNT(DISTINCT r.id_alumno_fk) AS alumnos_participantes,
        AVG(r.calificacion) AS promedio_puntuacion,
        SUM(CASE WHEN r.aprobado = TRUE THEN 1 ELSE 0 END) AS completados,
        a.fecha_creacion
      FROM actividades a
      INNER JOIN juegos j ON a.id_juego_fk = j.id_juego
      LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_fk
      LEFT JOIN resultados r ON ag.id_asignacion = r.id_asignacion_fk
      WHERE j.es_plantilla = TRUE
      GROUP BY a.id_actividad
      ORDER BY a.fecha_creacion DESC
    `

    const laboratorios = await query(sqlQuery)

    return res.status(200).json({ 
      success: true,
      laboratorios: laboratorios || []
    })
  } catch (error) {
    console.error('Error fetching laboratorios:', error)
    return res.status(500).json({ error: 'Error fetching laboratorios' })
  }
}
