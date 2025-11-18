import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const baseSelect = `SELECT 
        d.id_docente,
        d.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        u.correo,
        u.activo AS usuario_activo,
        CASE 
          WHEN u.activo = 0 THEN 'inactivo'
          WHEN (SELECT COUNT(*) FROM docente_grupo dg2 WHERE dg2.id_docente_dg_fk = d.id_docente AND dg2.activo = 1) > 0 THEN 'asignado'
          ELSE 'disponible'
        END AS estado,
        COUNT(DISTINCT dg.id_grupo_dg_fk) AS grupos_asignados,
        GROUP_CONCAT(DISTINCT CONCAT(c.anio_ingreso, '-C', c.cuatrimestre_inicial, '-', pe.codigo, '-', ne.codigo, '-', g.nombre) SEPARATOR ', ') AS grupos_nombres
      FROM docentes d
      JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
      LEFT JOIN docente_grupo dg ON d.id_docente = dg.id_docente_dg_fk AND dg.activo = 1
      LEFT JOIN grupos g ON dg.id_grupo_dg_fk = g.id_grupo
      LEFT JOIN cohortes c ON g.id_cohorte_grupo_fk = c.id_cohorte
      LEFT JOIN programas_educativos pe ON c.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN niveles_educativos ne ON c.id_nivel_inicial_fk = ne.id_nivel
      GROUP BY d.id_docente, d.matricula, u.nombre, u.primer_apellido, u.segundo_apellido, u.correo, u.activo
      ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;

  try {
    const docentes = await query(baseSelect);
    return res.status(200).json({ success: true, data: docentes });
  } catch (error: any) {
    console.error('Error al obtener docentes detallados:', error);
    
    // Fallback: consulta más simple si falla la principal
    try {
      console.log('Intentando consulta de fallback...');
      const fallbackSelect = `SELECT 
          d.id_docente,
          d.matricula,
          CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
          u.correo,
          u.activo AS usuario_activo,
          CASE 
            WHEN u.activo = 0 THEN 'inactivo'
            ELSE 'disponible'
          END AS estado,
          0 AS grupos_asignados,
          '' AS grupos_nombres
        FROM docentes d
        JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
        ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;
      
      const docentes = await query(fallbackSelect);
      return res.status(200).json({ success: true, data: docentes });
    } catch (fallbackError: any) {
      console.error('Error en consulta de fallback:', fallbackError);
      return res.status(500).json({ success: false, message: 'Error al obtener docentes', error: fallbackError.message });
    }
  }
}