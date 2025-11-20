import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_docente, nombre, primer_apellido, segundo_apellido, correo, matricula, contrasena } = req.body;

    // Validaciones
    if (!id_docente) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
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
      return res.status(400).json({ success: false, message: 'Employee ID cannot be empty' });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Obtener id_usuario del docente
    const docenteData: any = await query(
      'SELECT id_usuario_docente_fk FROM docentes WHERE id_docente = ?',
      [id_docente]
    );

    if (!docenteData || docenteData.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const id_usuario = docenteData[0].id_usuario_docente_fk;

    // Verificar si el correo ya existe (excepto el usuario actual)
    const existingEmail: any = await query(
      'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
      [correo, id_usuario]
    );

    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Verificar si la matrícula ya existe (excepto el docente actual)
    const existingMatricula: any = await query(
      'SELECT id_docente FROM docentes WHERE matricula = ? AND id_docente != ?',
      [matricula, id_docente]
    );

    if (existingMatricula && existingMatricula.length > 0) {
      return res.status(400).json({ success: false, message: 'Employee ID already registered' });
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

    // Actualizar matrícula del docente
    await query(
      'UPDATE docentes SET matricula = ? WHERE id_docente = ?',
      [matricula, id_docente]
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Teacher information updated successfully' 
    });

  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error updating teacher information' 
    });
  }
}
