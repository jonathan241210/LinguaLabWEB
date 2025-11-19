import { NextApiRequest, NextApiResponse } from 'next'
import { LaboratorioController } from '@/src/controllers/LaboratorioController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await LaboratorioController.crear(req.body)

  if (result.success) {
    return res.status(201).json(result)
  } else {
    return res.status(400).json(result)
  }
}
