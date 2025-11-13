import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Contar total de juegos (laboratorios) y obtener el último creado
    const juegosCountData = await query(
      `SELECT COUNT(*) as total FROM juegos`
    ) as any[];
    
    const juegosLastData = await query(
      `SELECT nombre as last_nombre FROM juegos ORDER BY fecha_creacion DESC LIMIT 1`
    ) as any[];

    const totalJuegos = juegosCountData?.[0]?.total || 0;
    const lastJuegoNombre = juegosLastData?.[0]?.last_nombre || null;

    // Contar total de grupos y obtener el último creado
    const gruposCountData = await query(
      `SELECT COUNT(*) as total FROM grupos`
    ) as any[];
    
    const gruposLastData = await query(
      `SELECT nombre as last_nombre FROM grupos ORDER BY id_grupo DESC LIMIT 1`
    ) as any[];

    const totalGrupos = gruposCountData?.[0]?.total || 0;
    const lastGrupoNombre = gruposLastData?.[0]?.last_nombre || null;

    // Contar total de estudiantes activos
    const estudiantesData = await query(
      `SELECT COUNT(*) as total 
       FROM alumnos a 
       INNER JOIN usuarios u ON a.id_usuario_alumno_fk = u.id_usuario 
       WHERE u.activo = 1`
    ) as any[];

    const totalEstudiantes = estudiantesData?.[0]?.total || 0;

    // Contar total de docentes activos
    const totalDocentesData = await query(
      `SELECT COUNT(*) as total 
       FROM docentes d 
       INNER JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario 
       WHERE u.activo = 1`
    ) as any[];

    const totalDocentes = totalDocentesData?.[0]?.total || 0;

    // Obtener el último docente agregado
    const lastDocenteData = await query(
      `SELECT u.nombre as last_nombre 
       FROM docentes d 
       INNER JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario 
       WHERE u.activo = 1 
       ORDER BY d.id_docente DESC 
       LIMIT 1`
    ) as any[];

    const lastDocenteNombre = lastDocenteData?.[0]?.last_nombre || null;

    // Construir respuesta
    const stats = [
      {
        label: 'Labs',
        value: totalJuegos,
        subtitle: totalJuegos > 0 ? `${totalJuegos} juegos disponibles` : 'Sin laboratorios aún',
        lastAdded: lastJuegoNombre || undefined,
      },
      {
        label: 'Groups',
        value: totalGrupos,
        subtitle: totalGrupos > 0 ? `${totalGrupos} grupos activos` : 'Sin grupos aún',
        lastAdded: lastGrupoNombre || undefined,
      },
      {
        label: 'Students',
        value: totalEstudiantes,
        subtitle: totalEstudiantes > 0 ? `${totalEstudiantes} estudiantes registrados` : 'Sin estudiantes aún',
        lastAdded: undefined,
      },
      {
        label: 'Teachers',
        value: totalDocentes,
        subtitle: totalDocentes > 0 ? `${totalDocentes} docentes activos` : 'Sin docentes aún',
        lastAdded: lastDocenteNombre || undefined,
      },
    ];

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}
