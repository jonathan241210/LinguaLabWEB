'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAuthProtection } from '@/lib/withAuth';

interface User {
  id_usuario: number;
  nombre: string;
  rol: string;
  matricula?: string;
}

function DocenteDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Cargar datos del usuario desde localStorage
  if (!user) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Error al parsear
      }
    }
  }

  const handleLogout = async () => {
    try {
      // Primero limpiar localStorage ANTES de llamar al logout
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Luego notificar al servidor
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Redirigir con pequeño delay para asegurar limpieza
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar redirección incluso si hay error
      router.push('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-light)' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: 'var(--color-dark-blue)',
        color: 'white',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>LinguaLab</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Dashboard Docente</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', opacity: 0.9 }}>Bienvenido</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{user?.nombre || 'Usuario'}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              boxShadow: 'var(--shadow-md)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green-light)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ padding: '40px 30px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'var(--color-white)',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <h2 style={{ marginTop: 0, color: 'var(--color-dark-blue)', fontSize: '32px', fontWeight: 'bold' }}>
            Bienvenido, {user?.nombre}
          </h2>
          
          {/* Card de información del usuario */}
          <div style={{
            padding: '24px',
            backgroundColor: 'linear-gradient(135deg, rgba(46, 168, 83, 0.1) 0%, rgba(46, 168, 83, 0.05) 100%)',
            borderLeft: '4px solid var(--color-primary-green)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '30px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray-dark)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Matrícula</p>
                <p style={{ margin: 0, color: 'var(--color-dark-blue)', fontSize: '16px', fontWeight: 'bold' }}>{user?.matricula || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray-dark)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Rol</p>
                <p style={{ margin: 0, color: 'var(--color-dark-blue)', fontSize: '16px', fontWeight: 'bold' }}>{user?.rol || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 8px 0', color: 'var(--color-gray-dark)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>ID Usuario</p>
                <p style={{ margin: 0, color: 'var(--color-dark-blue)', fontSize: '16px', fontWeight: 'bold' }}>{user?.id_usuario || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Descripción y funcionalidades */}
          <p style={{ color: 'var(--color-gray-dark)', lineHeight: '1.8', marginBottom: '20px', fontSize: '16px' }}>
            Este es tu panel de control como docente. Desde aquí tendrás acceso a todas las herramientas necesarias para gestionar tu enseñanza.
          </p>
          
          {/* Grid de funcionalidades */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {[
              { icon: '📚', title: 'Gestionar Grupos', desc: 'Crea y organiza tus grupos de estudiantes' },
              { icon: '✓', title: 'Asignar Actividades', desc: 'Distribuye tareas y trabajos a tus alumnos' },
              { icon: '📊', title: 'Revisar Progreso', desc: 'Monitorea el desempeño de tus estudiantes' },
              { icon: '🎮', title: 'Crear Juegos', desc: 'Diseña juegos educativos interactivos' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--background-neutral)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e5e7eb',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-dark-blue)', fontSize: '18px', fontWeight: 'bold' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, color: 'var(--color-gray-dark)', fontSize: '14px' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuthProtection(DocenteDashboard, 'docente');
