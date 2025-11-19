import type { NextApiRequest, NextApiResponse } from 'next';
import { CohorteController } from '@/src/controllers/CohorteController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const result = await CohorteController.crear(req.body);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(400).json(result);
  }
}
