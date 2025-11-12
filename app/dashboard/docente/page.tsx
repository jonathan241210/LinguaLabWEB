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
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>LinguaLab - Dashboard Docente</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>{user?.nombre}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#007bff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Bienvenido, {user?.nombre}</h2>
          
          <div style={{
            padding: '20px',
            backgroundColor: '#e7f3ff',
            borderLeft: '4px solid #007bff',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <p><strong>Matrícula:</strong> {user?.matricula}</p>
            <p><strong>Rol:</strong> {user?.rol}</p>
            <p><strong>ID:</strong> {user?.id_usuario}</p>
          </div>

          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Este es tu panel de control como docente. Desde aquí podrás:
          </p>
          <ul style={{ color: '#666', lineHeight: '1.8' }}>
            <li>Crear y gestionar grupos</li>
            <li>Asignar actividades a los alumnos</li>
            <li>Revisar el progreso de tus estudiantes</li>
            <li>Crear juegos educativos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default withAuthProtection(DocenteDashboard, 'docente');
