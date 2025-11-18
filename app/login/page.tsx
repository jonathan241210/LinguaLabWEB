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

  // Check de sesión al cargar la página
  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
          const meResponse = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meResponse.ok && isMounted) {
            const data = await meResponse.json();
            const role = data.user?.rol;
            if (role === 'docente') {
              router.push('/dashboard/docente');
              return;
            } else if (role === 'administrador') {
              router.push('/dashboard/admin');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    checkExistingSession();
    return () => {
      isMounted = false;
    };
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

      if (data.success && data.accessToken) {
        // Guardar token y usuario en localStorage con las claves correctas
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir inmediatamente
        if (data.user?.rol === 'docente') {
          router.push('/dashboard/docente');
        } else if (data.user?.rol === 'administrador') {
          router.push('/dashboard/admin');
        }
      } else {
        setError(data.message || 'Error al iniciar sesión');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--color-dark-blue) 0%, var(--color-dark-blue-darker) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <svg className="animate-spin" style={{ height: '48px', width: '48px', color: 'var(--color-primary-green)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style={{ color: 'white', fontSize: '18px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="llw-login-container" style={{ minHeight: '100vh', backgroundColor: 'var(--color-white)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes shimmerButton {
          0%, 100% {
            box-shadow: 0 8px 20px rgba(46, 168, 83, 0.4);
          }
          50% {
            box-shadow: 0 12px 30px rgba(46, 168, 83, 0.7);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.7s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.7s ease-out;
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }

        .animate-float-up {
          animation: floatUp 3s ease-in-out infinite;
        }

        .animate-shimmer-button {
          animation: shimmerButton 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        input::placeholder {
          color: var(--color-gray-medium);
        }

        input:focus::placeholder {
          color: #9ca3af;
        }

        /* Estilos responsivos */
        @media (max-width: 1024px) {
          .llw-login-left {
            width: 40% !important;
            padding: 32px !important;
          }
          .llw-login-right {
            width: 60% !important;
            padding: 32px 48px !important;
          }
          .llw-login-title {
            font-size: 44px !important;
          }
          .llw-login-logo {
            width: 120px !important;
            height: 120px !important;
          }
        }
        @media (max-width: 768px) {
          .llw-login-container {
            flex-direction: column !important;
          }
          .llw-login-left, .llw-login-right {
            width: 100% !important;
            padding: 32px !important;
          }
          .llw-login-left {
            padding: 24px !important;
          }
          .llw-login-title {
            font-size: 36px !important;
          }
          .llw-login-subtitle {
            font-size: 16px !important;
          }
          .llw-login-logo {
            width: 100px !important;
            height: 100px !important;
            margin-bottom: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .llw-login-left {
            padding: 20px !important;
          }
          .llw-login-right {
            padding: 24px 20px !important;
          }
          .llw-login-title {
            font-size: 32px !important;
          }
          .llw-login-subtitle {
            font-size: 14px !important;
          }
          .llw-login-logo {
            width: 80px !important;
            height: 80px !important;
          }
          .llw-login-form-title {
            font-size: 32px !important;
          }
        }
      `}</style>

      {/* Sección izquierda - Blanca con logo y texto */}
      <div className="llw-login-left animate-fade-in" style={{ width: '42%', backgroundColor: 'var(--color-white)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', position: 'relative' }}>
        {/* Logo */}
        <div className="llw-login-logo animate-bounce-in" style={{ marginBottom: '64px' }}>
          <div 
            style={{
              width: '160px',
              height: '160px',
              background: 'linear-gradient(to bottom right, var(--color-primary-green), var(--color-primary-green-medium), var(--color-primary-green-dark))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-green)',
            }}
          >
            <img
              src="/logo1.png"
              alt="LinguaLab Logo"
              className="animate-float-up"
              style={{ objectFit: 'contain', width: '160px', height: '160px' }}
            />
          </div>
        </div>

        {/* Texto */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-slide-in-left">
          <h1 className="llw-login-title" style={{ fontSize: '56px', fontWeight: 'bold', color: 'var(--color-dark-blue)', margin: 0, lineHeight: 1.2 }}>LinguaLab</h1>
          <p className="llw-login-subtitle" style={{ fontSize: '20px', color: 'var(--color-gray-dark)', margin: 0, fontWeight: 500 }}>
            Plataforma de gestión educativa
          </p>
        </div>
      </div>

      {/* Sección derecha - Azul oscuro con formulario */}
      <div className="llw-login-right animate-slide-in-right" style={{ width: '58%', background: 'linear-gradient(135deg, var(--color-dark-blue) 0%, var(--color-dark-blue-darker) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 64px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: '448px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Encabezado */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="llw-login-form-title" style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--color-white)', margin: 0, lineHeight: 1.2 }}>Welcome!</h2>
            <p style={{ fontSize: '20px', color: '#d1d5db', margin: 0, fontWeight: 300 }}>Inicia sesión en LinguaLab</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Input Usuario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb', display: 'block' }}>Usuario</label>
              <input
                type="text"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                placeholder="1723110111 o admin@example.com"
                style={{
                  width: '100%',
                  padding: '12px 32px',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-dark-blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '16px',
                  transition: 'all var(--transition-normal)',
                  boxShadow: 'var(--shadow-lg)',
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'auto',
                }}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Input Contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb', display: 'block' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                style={{
                  width: '100%',
                  padding: '12px 32px',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-dark-blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '16px',
                  transition: 'all var(--transition-normal)',
                  boxShadow: 'var(--shadow-lg)',
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'auto',
                }}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '16px 32px',
                color: '#fee2e2',
                textAlign: 'center',
                fontWeight: 500,
              }} className="animate-bounce">
                ⚠️ {error}
              </div>
            )}

            {/* Botón Login */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 32px',
                background: 'linear-gradient(to right, var(--color-primary-green), var(--color-primary-green-dark))',
                color: 'var(--color-white)',
                fontWeight: 'bold',
                fontSize: '16px',
                borderRadius: 'var(--radius-full)',
                transition: 'all var(--transition-normal)',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-primary-green-light), var(--color-primary-green-dark))';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, var(--color-primary-green), var(--color-primary-green-dark))';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              className="animate-shimmer-button"
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Iniciando...</span>
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
