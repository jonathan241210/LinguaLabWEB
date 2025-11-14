import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

interface Nivel {
  id_nivel: number;
  nombre: string;
  codigo: string;
  activo: number;
}

interface ResponseData {
  success?: boolean;
  data?: Nivel[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const niveles = await query(
      'SELECT id_nivel, nombre, codigo, activo FROM niveles_educativos WHERE activo = 1 ORDER BY orden, nombre',
      []
    );

    return res.status(200).json({
      success: true,
      data: niveles as Nivel[],
    });
  } catch (error) {
    console.error('Error obteniendo niveles:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
