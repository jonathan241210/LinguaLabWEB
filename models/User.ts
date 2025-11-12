import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/hash';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  rol: 'administrador' | 'docente';
  activo: boolean;
  creado: Date;
}

export interface UsuarioLogin {
  id_usuario: number;
  nombre: string;
  rol: 'administrador' | 'docente';
}

export interface UsuarioDocente extends UsuarioLogin {
  matricula: string;
}

export interface UsuarioAdmin extends UsuarioLogin {
  permisos?: any;
}

/**
 * Buscar usuario docente por matrícula
 */
export async function findDocenteByMatricula(matricula: string): Promise<UsuarioDocente | null> {
  try {
    const results: any = await query(
      `
      SELECT 
        u.id_usuario, 
        u.nombre, 
        u.rol, 
        d.matricula
      FROM usuarios u
      INNER JOIN docentes d ON u.id_usuario = d.id_usuario_docente_fk
      WHERE d.matricula = ? AND u.activo = 1
      LIMIT 1
      `,
      [matricula]
    );

    if (!Array.isArray(results) || results.length === 0) return null;

    const row = results[0];
    return {
      id_usuario: row.id_usuario,
      nombre: row.nombre,
      rol: row.rol,
      matricula: row.matricula,
    };
  } catch (error) {
    console.error('Error finding docente:', error);
    return null;
  }
}

/**
 * Buscar usuario administrador por correo
 */
export async function findAdminByEmail(correo: string): Promise<UsuarioAdmin | null> {
  try {
    const results: any = await query(
      `
      SELECT 
        u.id_usuario, 
        u.nombre, 
        u.rol,
        a.permisos
      FROM usuarios u
      INNER JOIN administradores a ON u.id_usuario = a.id_usuario_admin_fk
      WHERE u.correo = ? AND u.rol = 'administrador' AND u.activo = 1
      LIMIT 1
      `,
      [correo]
    );

    if (!Array.isArray(results) || results.length === 0) return null;

    const row = results[0];
    return {
      id_usuario: row.id_usuario,
      nombre: row.nombre,
      rol: row.rol,
      permisos: row.permisos,
    };
  } catch (error) {
    console.error('Error finding admin:', error);
    return null;
  }
}

/**
 * Obtener contraseña hash de un usuario por ID
 */
export async function getPasswordHash(id_usuario: number): Promise<string | null> {
  try {
    const results: any = await query(
      `SELECT contrasena FROM usuarios WHERE id_usuario = ? LIMIT 1`,
      [id_usuario]
    );

    if (!Array.isArray(results) || results.length === 0) return null;
    return results[0].contrasena;
  } catch (error) {
    console.error('Error getting password hash:', error);
    return null;
  }
}

/**
 * Validar credenciales de docente
 */
export async function validateDocenteCredentials(
  matricula: string,
  password: string
): Promise<UsuarioDocente | null> {
  const docente = await findDocenteByMatricula(matricula);
  if (!docente) return null;

  const storedHash = await getPasswordHash(docente.id_usuario);
  if (!storedHash) return null;

  const isValid = verifyPassword(password, storedHash);
  return isValid ? docente : null;
}

/**
 * Validar credenciales de administrador
 */
export async function validateAdminCredentials(
  correo: string,
  password: string
): Promise<UsuarioAdmin | null> {
  const admin = await findAdminByEmail(correo);
  if (!admin) return null;

  const storedHash = await getPasswordHash(admin.id_usuario);
  if (!storedHash) return null;

  const isValid = verifyPassword(password, storedHash);
  return isValid ? admin : null;
}
