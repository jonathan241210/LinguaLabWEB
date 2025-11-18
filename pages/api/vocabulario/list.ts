import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const [vocabularios] = await connection.query(
        `SELECT 
          id_vocabulario,
          nivel,
          contenido,
          archivo_original,
          fecha_creacion,
          fecha_actualizacion,
          activo
        FROM vocabulario
        WHERE contenido IS NOT NULL
        ORDER BY fecha_creacion DESC`
      )

      res.status(200).json({
        vocabularios: vocabularios
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error fetching vocabularies:', error)
    return res.status(500).json({ error: 'Error fetching vocabularies' })
  }
}
