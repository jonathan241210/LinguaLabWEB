import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_laboratorio, published_scope } = req.body

    if (!id_laboratorio || !published_scope) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validar que el scope sea válido
    if (!['teachers', 'students', 'admin_only'].includes(published_scope)) {
      return res.status(400).json({ error: 'Invalid published_scope. Must be "teachers", "students", or "admin_only"' })
    }

    // Si no es admin_only, auto-publicar
    const publicado = published_scope !== 'admin_only'

    // Configurar visibilidad solo para students (desktop only)
    let visibleOnDesktop = null
    let visibleOnMobile = null
    
    if (published_scope === 'students') {
      visibleOnDesktop = true
      visibleOnMobile = false  // Solo desktop
    }

    const sqlQuery = `
      UPDATE actividades 
      SET published_scope = ?,
          publicado = ?,
          visible_on_desktop = COALESCE(?, visible_on_desktop),
          visible_on_mobile = COALESCE(?, visible_on_mobile)
      WHERE id_actividad = ?
    `

    await query(sqlQuery, [published_scope, publicado, visibleOnDesktop, visibleOnMobile, id_laboratorio])

    return res.status(200).json({ 
      success: true,
      message: `Laboratory visibility updated to ${published_scope === 'teachers' ? 'Teachers' : 'Admin Only'}`,
      publicado
    })
  } catch (error) {
    console.error('Error updating laboratory scope:', error)
    return res.status(500).json({ error: 'Error updating laboratory visibility' })
  }
}
