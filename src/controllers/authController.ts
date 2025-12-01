import { validateDocenteCredentials, validateAdminCredentials } from '@/src/models/User';
import { generateAccessToken, generateTokenPair } from '@/lib/jwt';

export interface LoginRequest {
  userIdentifier: string; // matricula para docentes, nombre para admins
  password: string;
  role?: 'docente' | 'administrador'; // opcional: si no viene se detecta automáticamente
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id_usuario: number;
    nombre: string;
    rol: string;
    matricula?: string;
  };
}

/**
 * Manejar login de docente
 */
export async function loginDocente(matricula: string, password: string): Promise<LoginResponse> {
  try {
    const docente = await validateDocenteCredentials(matricula, password);

    if (!docente) {
      return {
        success: false,
        message: 'Matrícula o contraseña incorrecta',
      };
    }

    // Generar access y refresh tokens
    const { accessToken, refreshToken } = generateTokenPair({
      id_usuario: docente.id_usuario,
      rol: docente.rol,
      nombre: docente.nombre,
    });

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      accessToken,
      refreshToken,
      user: {
        id_usuario: docente.id_usuario,
        nombre: docente.nombre,
        rol: docente.rol,
        matricula: docente.matricula,
        correo: docente.correo,
      },
    };
  } catch (error) {
    console.error('Error in loginDocente:', error);
    return {
      success: false,
      message: 'Error al procesar el inicio de sesión',
    };
  }
}

/**
 * Manejar login de administrador
 */
export async function loginAdmin(correo: string, password: string): Promise<LoginResponse> {
  try {
    const admin = await validateAdminCredentials(correo, password);

    if (!admin) {
      return {
        success: false,
        message: 'Correo o contraseña incorrecta',
      };
    }

    // Generar access y refresh tokens
    const { accessToken, refreshToken } = generateTokenPair({
      id_usuario: admin.id_usuario,
      rol: admin.rol,
      nombre: admin.nombre,
    });

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      accessToken,
      refreshToken,
      user: {
        id_usuario: admin.id_usuario,
        nombre: admin.nombre,
        rol: admin.rol,
      },
    };
  } catch (error) {
    console.error('Error in loginAdmin:', error);
    return {
      success: false,
      message: 'Error al procesar el inicio de sesión',
    };
  }
}

/**
 * Procesar login genérico
 */
export async function handleLogin(request: LoginRequest): Promise<LoginResponse> {
  if (!request.userIdentifier || !request.password) {
    return {
      success: false,
      message: 'Usuario y contraseña son requeridos',
    };
  }

  // Si el rol viene explícito, usarlo
  if (request.role === 'docente') {
    return loginDocente(request.userIdentifier, request.password);
  } else if (request.role === 'administrador') {
    return loginAdmin(request.userIdentifier, request.password);
  }

  // Si no viene rol, intentamos detectar: primero probar como docente (por matrícula),
  // si falla, probar como administrador (por nombre).
  const tryDocente = await loginDocente(request.userIdentifier, request.password);
  if (tryDocente.success) return tryDocente;

  const tryAdmin = await loginAdmin(request.userIdentifier, request.password);
  if (tryAdmin.success) return tryAdmin;

  return {
    success: false,
    message: 'Credenciales incorrectas',
  };
}
