import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

// Accept JSON data with vocabulary entries array
// Structure: { nivel, archivo_original, contenido: [{palabra, significado, nivel}] }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { nivel, contenido, archivo_original, units_structure } = req.body

    if (!nivel) {
      return res.status(400).json({ error: 'Missing required field: nivel' })
    }

    if (!contenido || !Array.isArray(contenido) || contenido.length === 0) {
      return res.status(400).json({ error: 'Contenido must be a non-empty array' })
    }

    const filename = archivo_original || 'vocabulary.pdf'

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Save both the flattened array and the units structure
      const contenidoToSave = units_structure && units_structure.length > 0 
        ? units_structure  // Save the complete structure with units
        : contenido        // Fallback to flat array
      
      const [result] = await connection.query(
        `INSERT INTO vocabulario (nivel, contenido, archivo_original)
         VALUES (?, ?, ?)`,
        [nivel, JSON.stringify(contenidoToSave), filename]
      )

      const insertId = (result as any).insertId

      res.status(200).json({
        message: 'Vocabulary saved successfully',
        vocabulario: {
          id_vocabulario: insertId,
          nivel: nivel,
          contenido: contenidoToSave,
          archivo_original: filename
        },
        entries: contenido.length
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error saving vocabulary:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

