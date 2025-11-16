import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const cohortes = await query(
      `SELECT id_cohorte, etiqueta, anio_ingreso, cuatrimestre_inicial
       FROM cohortes
       WHERE activo = 1
       ORDER BY anio_ingreso DESC, cuatrimestre_inicial ASC`
    );

    res.status(200).json({
      success: true,
      data: cohortes,
    });
  } catch (error: any) {
    console.error('Error al obtener cohortes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cohortes', error: error.message });
  }
}
