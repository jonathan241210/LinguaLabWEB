import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const cuatrimestres = await query(
      `SELECT id_cuatrimestre, nombre, codigo, activo
       FROM cuatrimestres
       WHERE activo = 1
       ORDER BY orden ASC, nombre ASC`
    );

    res.status(200).json({
      success: true,
      data: cuatrimestres,
    });
  } catch (error: any) {
    console.error('Error al obtener cuatrimestres:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cuatrimestres', error: error.message });
  }
}
