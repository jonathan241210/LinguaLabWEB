import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/hash'
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

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Obtener usuario actual
    const users = await query(
      'SELECT id_usuario, contrasena FROM usuarios WHERE id_usuario = ?',
      [decoded.id_usuario]
    )

    if (!users || (users as any[]).length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = (users as any[])[0]

    // Verificar contraseña actual
    const isPasswordValid = verifyPassword(currentPassword, user.contrasena)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword)

    // Actualizar contraseña
    await query(
      'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [hashedPassword, decoded.id_usuario]
    )

    res.status(200).json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
