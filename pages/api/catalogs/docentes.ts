import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const docentes = await query(
      `SELECT 
        d.id_docente,
        d.matricula,
        CONCAT(u.nombre, ' ', u.primer_apellido, ' ', u.segundo_apellido) AS nombre_completo
       FROM docentes d
       JOIN usuarios u ON d.id_usuario_docente_fk = u.id_usuario
       WHERE d.activo = 1 AND u.activo = 1
       ORDER BY u.primer_apellido, u.nombre`
    );

    res.status(200).json({
      success: true,
      data: docentes,
    });
  } catch (error: any) {
    console.error('Error al obtener docentes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener docentes', error: error.message });
  }
}
