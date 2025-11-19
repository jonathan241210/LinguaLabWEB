import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_vocabulario } = req.query

    if (!id_vocabulario) {
      return res.status(400).json({ error: 'Missing id_vocabulario parameter' })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const [unidades] = await connection.query(
        `SELECT 
          id_unidad,
          numero_unidad,
          nombre_unidad,
          palabras_ids,
          fecha_creacion,
          activo
        FROM vocabulario_unidades
        WHERE id_vocabulario_fk = ?
        ORDER BY numero_unidad ASC`,
        [id_vocabulario]
      )

      // Parse palabras_ids JSON for each unit
      const parsedUnidades = (unidades as any[]).map(unidad => ({
        ...unidad,
        palabras_ids: typeof unidad.palabras_ids === 'string' ? JSON.parse(unidad.palabras_ids) : unidad.palabras_ids
      }))

      res.status(200).json({
        unidades: parsedUnidades || []
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error fetching units:', error)
    return res.status(500).json({ error: 'Error fetching units' })
  }
}
