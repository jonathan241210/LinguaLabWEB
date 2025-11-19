import { NextApiRequest, NextApiResponse } from 'next'
import { VocabularioController } from '@/src/controllers/VocabularioController'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await VocabularioController.crear(req.body)

  if (result.success) {
    return res.status(200).json(result)
  } else {
    return res.status(400).json(result)
  }
}