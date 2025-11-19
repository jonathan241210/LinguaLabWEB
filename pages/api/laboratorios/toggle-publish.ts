import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_laboratorio, publicado } = req.body

    if (!id_laboratorio || publicado === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const sqlQuery = `
      UPDATE actividades 
      SET publicado = ?
      WHERE id_actividad = ?
    `

    await query(sqlQuery, [publicado, id_laboratorio])

    return res.status(200).json({ 
      success: true,
      message: `Laboratory ${publicado ? 'published' : 'unpublished'} successfully`
    })
  } catch (error) {
    console.error('Error toggling publish status:', error)
    return res.status(500).json({ error: 'Error updating laboratory status' })
  }
}
