import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para renovar el access token automáticamente antes de que expire
 * y cerrar sesión si el token es inválido
 */
export function useTokenRefresh() {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Función para cerrar sesión
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    };

    // Interceptor global para detectar errores 401
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si obtenemos 401 en cualquier petición (excepto login/refresh), cerrar sesión
      if (response.status === 401) {
        const url = args[0].toString();
        if (!url.includes('/api/auth/login') && !url.includes('/api/auth/refresh')) {
          console.log('Token expirado o inválido - cerrando sesión');
          logout();
        }
      }
      
      return response;
    };

    const scheduleRefresh = () => {
      // Si no hay token, no hacer nada
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // Programar refresh: cada 13 minutos (780 segundos)
      // El access token expira en 15 min (900 sec), así renovamos 2 min antes
      const REFRESH_INTERVAL = 780000; // 13 minutos en ms

      refreshIntervalRef.current = setInterval(async () => {
        try {
          const response = await originalFetch('/api/auth/refresh', {
            method: 'POST',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.accessToken) {
              localStorage.setItem('token', data.accessToken);
              console.log('Token renovado automáticamente');
            }
          } else if (response.status === 401) {
            // Refresh token expiró, redirigir a login
            console.log('Refresh token expirado - cerrando sesión');
            logout();
          }
        } catch (error) {
          console.error('Error refrescando token:', error);
        }
      }, REFRESH_INTERVAL);
    };

    scheduleRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      // Restaurar fetch original al desmontar
      window.fetch = originalFetch;
    };
  }, []);
}
