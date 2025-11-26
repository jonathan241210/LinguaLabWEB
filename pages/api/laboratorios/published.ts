import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Solo obtener actividades publicadas
    const sqlCondition = 'WHERE a.publicado = 1';

    // Obtener laboratorios (actividades) publicados como plantillas
    const laboratorios: any = await query(
      `SELECT 
        a.id_actividad AS id_laboratorio,
        a.titulo,
        a.descripcion,
        j.nombre AS tipo_juego,
        j.tipo_juego AS tipo_juego_code,
        j.icono,
        v.nivel,
        a.numero_palabras,
        a.experiencia_base,
        a.experiencia_bonus_perfecto,
        a.puntuacion_minima_aprobar,
        a.tiempo_limite,
        a.intentos_permitidos,
        a.permitir_pistas,
        a.fecha_creacion,
        v.archivo_original AS vocabulario_nombre,
        COUNT(DISTINCT ag.id_grupo_ag_fk) AS grupos_usando
      FROM actividades a
      INNER JOIN juegos j ON a.id_juego_actividad_fk = j.id_juego
      LEFT JOIN vocabulario v ON a.id_vocabulario_fk = v.id_vocabulario
      LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_ag_fk
      ${sqlCondition}
      GROUP BY a.id_actividad, a.titulo, a.descripcion, j.nombre, j.tipo_juego, j.icono, v.nivel, 
               a.numero_palabras, a.experiencia_base, a.experiencia_bonus_perfecto, 
               a.puntuacion_minima_aprobar, a.tiempo_limite, a.intentos_permitidos, 
               a.permitir_pistas, a.fecha_creacion, v.archivo_original
      ORDER BY a.fecha_creacion DESC`
    );

    return res.status(200).json({
      success: true,
      laboratorios: laboratorios || []
    });
  } catch (error: any) {
    console.error('Error fetching published labs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving published laboratories',
      error: error.message
    });
  }
}
