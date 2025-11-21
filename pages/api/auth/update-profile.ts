import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { verifyAccessToken } from '@/lib/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Obtener token del header
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verificar token
    const decoded = verifyAccessToken(token)
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    const { nombre, primer_apellido, segundo_apellido, correo } = req.body

    if (!nombre || !primer_apellido || !correo) {
      return res.status(400).json({ message: 'Name, first last name, and email are required' })
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Verificar si el correo ya existe (excepto el del usuario actual)
    const existingUser = await query(
      'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
      [correo, decoded.id_usuario]
    )

    if (existingUser && (existingUser as any[]).length > 0) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    // Actualizar usuario
    await query(
      'UPDATE usuarios SET nombre = ?, primer_apellido = ?, segundo_apellido = ?, correo = ? WHERE id_usuario = ?',
      [nombre, primer_apellido, segundo_apellido || null, correo, decoded.id_usuario]
    )

    // Obtener datos actualizados
    const updatedUser = await query(
      'SELECT id_usuario, nombre, primer_apellido, segundo_apellido, correo, rol FROM usuarios WHERE id_usuario = ?',
      [decoded.id_usuario]
    )

    if (!updatedUser || (updatedUser as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: (updatedUser as any[])[0]
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
