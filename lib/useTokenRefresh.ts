import { useEffect, useRef } from 'react';

/**
 * Hook para renovar el access token automáticamente antes de que expire
 * El access token expira en 15 minutos (900 segundos)
 * Se renueva 2 minutos antes (a los 13 minutos = 780 segundos)
 */
export function useTokenRefresh() {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.accessToken) {
              localStorage.setItem('token', data.accessToken);
            }
          } else if (response.status === 401) {
            // Refresh token expiró, redirigir a login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
    };
  }, []);
}
