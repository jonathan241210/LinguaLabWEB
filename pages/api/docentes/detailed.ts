import type { NextApiRequest, NextApiResponse } from 'next';
import { DocenteController } from '@/src/controllers/DocenteController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const result = await DocenteController.obtenerDetallados();
  
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
}