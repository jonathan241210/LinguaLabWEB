import { NextApiRequest, NextApiResponse } from 'next'
import { LaboratorioController } from '@/src/controllers/LaboratorioController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await LaboratorioController.obtenerTodos()
  
  if (result.success) {
    return res.status(200).json(result)
  } else {
    return res.status(500).json(result)
  }
}
