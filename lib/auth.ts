import { verifyToken, TokenPayload } from '@/lib/jwt';
import { NextApiRequest, NextApiResponse } from 'next';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: TokenPayload;
}

/**
 * Middleware para verificar token JWT
 */
export async function verifyAuth(req: AuthenticatedRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7); // Remover "Bearer "
  const payload = verifyToken(token);

  if (!payload) {
    return false;
  }

  req.user = payload;
  return true;
}

/**
 * Middleware para proteger rutas que requieren autenticación
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const isAuthenticated = await verifyAuth(req);

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token inválido o expirado.',
      });
    }

    return handler(req, res);
  };
}

/**
 * Middleware para proteger rutas que requieren rol específico
 */
export function withRole(...allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const isAuthenticated = await verifyAuth(req);

      if (!isAuthenticated) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado. Token inválido o expirado.',
        });
      }

      if (!req.user || !allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Permisos insuficientes.',
        });
      }

      return handler(req, res);
    };
  };
}
