import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

interface Programa {
  id_programa: number;
  nombre: string;
  codigo: string;
  activo: number;
}

interface ResponseData {
  success?: boolean;
  data?: Programa[];
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
    const programas = await query(
      'SELECT id_programa, nombre, codigo, activo FROM programas_educativos WHERE activo = 1 ORDER BY orden, nombre',
      []
    );

    return res.status(200).json({
      success: true,
      data: programas as Programa[],
    });
  } catch (error) {
    console.error('Error obteniendo programas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
