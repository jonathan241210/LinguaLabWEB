import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_unidad } = req.query

    if (!id_unidad) {
      return res.status(400).json({ error: 'Missing id_unidad' })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.query(
        `DELETE FROM vocabulario_unidades WHERE id_unidad = ?`,
        [id_unidad]
      )

      res.status(200).json({
        message: 'Unit deleted successfully'
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error deleting unit:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
