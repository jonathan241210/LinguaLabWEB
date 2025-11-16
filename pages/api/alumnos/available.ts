import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Obtener alumnos que NO tienen grupo activo
    const alumnos = await query(
      `SELECT 
        a.id_alumno,
        a.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', IFNULL(u.segundo_apellido, '')) AS nombre_completo,
        IFNULL(p.nombre, 'Sin asignar') AS programa,
        IFNULL(n.nombre, 'Sin asignar') AS nivel
      FROM alumnos a
      JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario
      LEFT JOIN programas_educativos p ON a.id_programa_alumno_fk = p.id_programa
      LEFT JOIN niveles_educativos n ON a.id_nivel_alumno_fk = n.id_nivel
      LEFT JOIN alumno_grupo ag ON a.id_alumno = ag.id_alumno_ag_fk AND ag.activo = 1
      WHERE ag.id_alumno_grupo IS NULL AND u.activo = 1
      ORDER BY u.primer_apellido, u.nombre`
    );

    res.status(200).json({
      success: true,
      data: alumnos,
    });
  } catch (error: any) {
    console.error('Error al obtener alumnos disponibles:', error);
    res.status(500).json({ success: false, message: 'Error al obtener alumnos', error: error.message });
  }
}
