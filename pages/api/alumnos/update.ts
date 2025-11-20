import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_alumno, nombre, primer_apellido, segundo_apellido, correo, matricula, contrasena } = req.body;

    // Validaciones
    if (!id_alumno) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }

    if (!primer_apellido || primer_apellido.trim() === '') {
      return res.status(400).json({ success: false, message: 'First last name cannot be empty' });
    }

    if (!correo || correo.trim() === '') {
      return res.status(400).json({ success: false, message: 'Email cannot be empty' });
    }

    if (!matricula || matricula.trim() === '') {
      return res.status(400).json({ success: false, message: 'Student ID cannot be empty' });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Obtener id_usuario del alumno
    const alumnoData: any = await query(
      'SELECT id_usuario_alumno_fk FROM alumnos WHERE id_alumno = ?',
      [id_alumno]
    );

    if (!alumnoData || alumnoData.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const id_usuario = alumnoData[0].id_usuario_alumno_fk;

    // Verificar si el correo ya existe (excepto el usuario actual)
    const existingEmail: any = await query(
      'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
      [correo, id_usuario]
    );

    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Verificar si la matrícula ya existe (excepto el alumno actual)
    const existingMatricula: any = await query(
      'SELECT id_alumno FROM alumnos WHERE matricula = ? AND id_alumno != ?',
      [matricula, id_alumno]
    );

    if (existingMatricula && existingMatricula.length > 0) {
      return res.status(400).json({ success: false, message: 'Student ID already registered' });
    }

    // Actualizar usuario
    let updateUserQuery = `
      UPDATE usuarios 
      SET nombre = ?, 
          primer_apellido = ?, 
          segundo_apellido = ?, 
          correo = ?
    `;
    let userParams: any[] = [nombre, primer_apellido, segundo_apellido || '', correo];

    // Si se proporciona contraseña, validar y actualizar
    if (contrasena && contrasena.trim() !== '') {
      const hashedPassword = await hashPassword(contrasena);
      updateUserQuery += ', contrasena = ?';
      userParams.push(hashedPassword);
    }

    updateUserQuery += ' WHERE id_usuario = ?';
    userParams.push(id_usuario);

    await query(updateUserQuery, userParams);

    // Actualizar matrícula del alumno
    await query(
      'UPDATE alumnos SET matricula = ? WHERE id_alumno = ?',
      [matricula, id_alumno]
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Student information updated successfully' 
    });

  } catch (error: any) {
    console.error('Error updating student:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating student information' 
    });
  }
}
