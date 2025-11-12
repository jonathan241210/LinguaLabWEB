import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_CAMBIAR_';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_refresh_secreto_CAMBIAR_';

export interface TokenPayload {
  id_usuario: number;
  rol: 'administrador' | 'docente';
  nombre: string;
  exp: number;
  type?: 'access' | 'refresh';
}

function createToken(payload: Omit<TokenPayload, 'exp'>, secret: string, expiresIn: number): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    exp: now + expiresIn,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyTokenWithSecret(token: string, secret: string): TokenPayload | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generar access token (15 minutos)
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'exp' | 'type'>, expiresIn: number = 900): string {
  return createToken({ ...payload, type: 'access' }, ACCESS_SECRET, expiresIn);
}

/**
 * Generar refresh token (1 día)
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'exp' | 'type'>, expiresIn: number = 86400): string {
  return createToken({ ...payload, type: 'refresh' }, REFRESH_SECRET, expiresIn);
}

/**
 * Verificar access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  return verifyTokenWithSecret(token, ACCESS_SECRET);
}

/**
 * Verificar refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  return verifyTokenWithSecret(token, REFRESH_SECRET);
}

/**
 * Generar ambos tokens (para login)
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'exp' | 'type'>) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verificar token genérico (para middleware)
 */
export function verifyToken(token: string): TokenPayload | null {
  return verifyAccessToken(token);
}
