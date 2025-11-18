import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_vocabulario } = req.body

    if (!id_vocabulario) {
      return res.status(400).json({ error: 'Missing vocabulary ID' })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.query(
        `UPDATE vocabulario 
         SET activo = NOT activo 
         WHERE id_vocabulario = ?`,
        [id_vocabulario]
      )

      res.status(200).json({
        message: 'Status updated successfully'
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error toggling status:', error)
    return res.status(500).json({ error: 'Error updating status' })
  }
}
