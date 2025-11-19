import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sqlQuery = `
      SELECT 
        id_juego AS id_plantilla,
        nombre,
        tipo_juego,
        descripcion,
        icono,
        tipo_icono,
        nivel_sugerido AS nivel_dificultad_sugerido,
        palabras_minimas,
        palabras_maximas,
        instrucciones_template,
        dificultad
      FROM juegos
      WHERE es_plantilla = TRUE
      ORDER BY nombre ASC
    `

    const plantillas = await query(sqlQuery)

    return res.status(200).json({ 
      success: true,
      plantillas: plantillas || []
    })
  } catch (error) {
    console.error('Error fetching plantillas:', error)
    return res.status(500).json({ error: 'Error fetching game templates' })
  }
}
