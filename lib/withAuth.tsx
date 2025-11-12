import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTokenRefresh } from './useTokenRefresh';

/**
 * HOC para proteger páginas que requieren autenticación
 * Redirige a /login si no hay token válido
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'docente' | 'administrador'
) {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Activar renovación automática de tokens
    useTokenRefresh();

    useEffect(() => {
      // Verificar si hay token y usuario en localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      try {
        const user = JSON.parse(userStr);

        // Si se requiere un rol específico, verificar que coincida
        if (requiredRole && user.rol !== requiredRole) {
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
      } catch {
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
    }, [router, requiredRole]);

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <p>Cargando...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Redirigiendo...
    }

    return <Component {...props} />;
  };
}
