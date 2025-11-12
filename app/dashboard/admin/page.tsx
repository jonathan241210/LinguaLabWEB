'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAuthProtection } from '@/lib/withAuth';

interface User {
  id_usuario: number;
  nombre: string;
  rol: string;
}

function AdminDashboard() {
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
        backgroundColor: '#28a745',
        color: 'white',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>LinguaLab - Panel Administrativo</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>{user?.nombre}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#28a745',
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
            backgroundColor: '#e8f5e9',
            borderLeft: '4px solid #28a745',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <p><strong>Nombre:</strong> {user?.nombre}</p>
            <p><strong>Rol:</strong> {user?.rol}</p>
            <p><strong>ID:</strong> {user?.id_usuario}</p>
          </div>

          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Panel de administración de LinguaLab. Desde aquí podrás:
          </p>
          <ul style={{ color: '#666', lineHeight: '1.8' }}>
            <li>Gestionar usuarios (docentes, alumnos)</li>
            <li>Crear y editar juegos educativos</li>
            <li>Revisar estadísticas generales del sistema</li>
            <li>Configurar permisos y roles</li>
            <li>Monitorear actividades de la plataforma</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default withAuthProtection(AdminDashboard, 'administrador');
