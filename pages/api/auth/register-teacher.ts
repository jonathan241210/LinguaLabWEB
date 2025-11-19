import type { NextApiRequest, NextApiResponse } from 'next';
import { DocenteController } from '@/src/controllers/DocenteController';

interface ResponseData {
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const result = await DocenteController.registrar(req.body);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(result.error?.includes('ya está') ? 400 : 500).json(result);
  }
}
