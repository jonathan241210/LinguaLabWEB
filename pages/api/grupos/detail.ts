import type { NextApiRequest, NextApiResponse } from 'next';
import { GrupoController } from '@/src/controllers/GrupoController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Group ID is required' });
  }

  const result = await GrupoController.obtenerDetalle(parseInt(id));

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json(result);
  }
}
