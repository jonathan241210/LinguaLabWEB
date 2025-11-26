import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Obtener scope desde query params (teachers, students_lab, all)
    const { scope } = req.query;

    let sqlCondition = 'WHERE a.publicado = 1';
    
    if (scope && scope !== 'all') {
      sqlCondition += ` AND a.published_scope = '${scope}'`;
    } else {
      // Si no se especifica scope o es 'all', buscar publicados para teachers o all
      sqlCondition += ` AND a.published_scope IN ('teachers', 'all')`;
    }

    // Obtener laboratorios (actividades) publicados como plantillas
    const laboratorios: any = await query(
      `SELECT 
        a.id_actividad AS id_laboratorio,
        a.titulo,
        a.descripcion,
        j.nombre AS tipo_juego,
        j.codigo AS tipo_juego_code,
        j.icono,
        v.nivel,
        a.numero_palabras,
        a.experiencia_base,
        a.experiencia_bonus_perfecto,
        a.puntuacion_minima_aprobar,
        a.tiempo_limite,
        a.intentos_permitidos,
        a.permitir_pistas,
        a.is_lab_master,
        a.published_scope,
        a.notes,
        a.fecha_creacion,
        v.archivo_original AS vocabulario_nombre,
        GROUP_CONCAT(DISTINCT u.numero_unidad ORDER BY u.numero_unidad ASC SEPARATOR ', ') AS unidades,
        GROUP_CONCAT(DISTINCT u.nombre_unidad ORDER BY u.numero_unidad ASC SEPARATOR ' | ') AS nombres_unidades,
        COUNT(DISTINCT ag.id_grupo_ag_fk) AS grupos_usando
      FROM actividades a
      INNER JOIN juegos j ON a.id_juego_actividad_fk = j.id_juego
      LEFT JOIN vocabulario v ON a.id_vocabulario_actividad_fk = v.id_vocabulario
      LEFT JOIN actividad_palabra ap ON a.id_actividad = ap.id_actividad_ap_fk
      LEFT JOIN palabras p ON ap.id_palabra_ap_fk = p.id_palabra
      LEFT JOIN unidades u ON p.id_unidad_palabra_fk = u.id_unidad
      LEFT JOIN actividad_grupo ag ON a.id_actividad = ag.id_actividad_ag_fk
      ${sqlCondition}
      GROUP BY a.id_actividad, a.titulo, a.descripcion, j.nombre, j.codigo, j.icono, v.nivel, 
               a.numero_palabras, a.experiencia_base, a.experiencia_bonus_perfecto, 
               a.puntuacion_minima_aprobar, a.tiempo_limite, a.intentos_permitidos, 
               a.permitir_pistas, a.is_lab_master, a.published_scope, a.notes, 
               a.fecha_creacion, v.archivo_original
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
