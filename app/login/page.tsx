'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al cargar la página, verificar si ya hay sesión activa
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Si hay token, intentar renovarlo para asegurar que sigue siendo válido
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.accessToken) {
              localStorage.setItem('token', refreshData.accessToken);
              
              // Token renovado exitosamente, redirigir al dashboard
              if (user.rol === 'docente') {
                router.push('/dashboard/docente');
              } else {
                router.push('/dashboard/admin');
              }
              return;
            }
          }
        } catch (err) {
          // Token o sesión inválida
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // No hay sesión válida, mostrar login
      setLoading(false);
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIdentifier, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar access token en localStorage
        // Refresh token viene en httpOnly cookie (automático)
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir según el rol devuelto por el servidor
        if (data.user?.rol === 'docente') {
          router.push('/dashboard/docente');
        } else {
          router.push('/dashboard/admin');
        }
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '30px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>LinguaLab</h1>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          {/* Campo de entrada (Matrícula o Correo) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              Matrícula (Docente) o Correo (Admin)
            </label>
            <input
              type="text"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              placeholder={'Ej: 1723110111 o admin@example.com'}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                color: '#000',
              }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Campo de contraseña */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                color: '#000',
              }}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Mostrar error */}
          {error && (
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', color: '#999', fontSize: '12px' }}>
          © 2025 LinguaLab. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
