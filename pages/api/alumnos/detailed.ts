import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const baseSelect = `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        u.correo,
        IFNULL(p.nombre, 'No program') AS programa,
        IFNULL(n.nombre, 'No level') AS nivel,
        u.activo AS usuario_activo,
        CASE 
          WHEN u.activo = 0 THEN 'inactivo'
          WHEN ag.id_alumno_grupo IS NOT NULL THEN 'asignado'
          ELSE 'disponible'
        END AS estado,
        g.nombre AS grupo_actual,
        CONCAT(c.anio_ingreso, '-C', c.cuatrimestre_inicial, '-', pe.codigo, '-', ne.codigo) AS cohorte_etiqueta,
        IFNULL(pe.nombre, 'No program') AS programa_grupo,
        CONCAT(ud.nombre, ' ', ud.primer_apellido, ' ', IFNULL(ud.segundo_apellido, '')) AS docente_nombre,
        ud.correo AS docente_correo,
        {{EN_PRACTICAS_EXPR}} AS en_practicas
      FROM alumnos a
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      LEFT JOIN programas_educativos p ON a.id_programa_alumno_fk = p.id_programa
      LEFT JOIN niveles_educativos n ON a.id_nivel_alumno_fk = n.id_nivel
      LEFT JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk AND ag.activo = 1
      LEFT JOIN grupos g ON ag.id_grupo_ag_fk = g.id_grupo
      LEFT JOIN cohortes c ON g.id_cohorte_grupo_fk = c.id_cohorte
      LEFT JOIN programas_educativos pe ON c.id_programa_cohorte_fk = pe.id_programa
      LEFT JOIN niveles_educativos ne ON c.id_nivel_inicial_fk = ne.id_nivel
      LEFT JOIN docente_grupo dg ON g.id_grupo = dg.id_grupo_dg_fk AND dg.activo = 1
      LEFT JOIN docentes d ON dg.id_docente_dg_fk = d.id_docente
      LEFT JOIN usuarios ud ON d.id_usuario_docente_fk = ud.id_usuario
      ORDER BY u.activo DESC, u.primer_apellido, u.nombre`;

  try {
    // Primer intento: usar columna real en_practicas
    const sqlWithColumn = baseSelect.replace(
      '{{EN_PRACTICAS_EXPR}}',
      "CASE WHEN a.en_practicas = 1 THEN 'Yes' ELSE 'No' END"
    );
    const alumnos = await query(sqlWithColumn);
    return res.status(200).json({ success: true, data: alumnos });
  } catch (error: any) {
    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      try {
        // Fallback: si la columna no existe, devolver 'No'
        const sqlFallback = baseSelect.replace(
          '{{EN_PRACTICAS_EXPR}}',
          "'No'"
        );
        const alumnos = await query(sqlFallback);
        return res.status(200).json({ success: true, data: alumnos, warning: 'Column en_practicas not found; defaulting to No' });
      } catch (err2: any) {
        console.error('Fallback failed for alumnos detallados:', err2);
        return res.status(500).json({ success: false, message: 'Error al obtener alumnos', error: err2.message });
      }
    }
    console.error('Error al obtener alumnos detallados:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener alumnos', error: error.message });
  }
}