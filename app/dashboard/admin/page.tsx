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
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/login');
    }
  };

  const stats = [
    { label: 'Labs', value: '4', icon: '🧪' },
    { label: 'Groups', value: '4', icon: '👥' },
    { label: 'Students', value: '150', icon: '👨‍🎓' },
    { label: 'Teachers', value: '1', icon: '👨‍🏫' },
  ];

  const tools = [
    { label: 'Create a new group', icon: '➕', action: 'create-group' },
    { label: 'Add a teacher', icon: '➕', action: 'add-teacher' },
    { label: 'Create a new lab', icon: '➕', action: 'create-lab' },
    { label: 'Add new vocabulary', icon: '➕', action: 'add-vocab' },
  ];

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'labs', label: 'Labs', icon: '🧪' },
    { id: 'groups', label: 'Groups', icon: '👥' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
    { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-light)', display: 'flex', position: 'relative' }}>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .menu-item {
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 8px;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid transparent;
          margin: 8px 0;
        }

        .menu-item:hover {
          background-color: rgba(46, 168, 83, 0.2);
          border-left-color: var(--color-primary-green);
        }

        .menu-item.active {
          background-color: var(--color-primary-green);
          color: white;
          border-left-color: var(--color-primary-green-dark);
        }

        .stat-card {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          padding: 24px;
          text-align: center;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          border: 1px solid #e5e7eb;
        }

        .stat-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
          border-color: var(--color-primary-green);
        }

        .tool-button {
          background: var(--color-white);
          border: 2px solid #e5e7eb;
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 120px;
        }

        .tool-button:hover {
          border-color: var(--color-primary-green);
          background-color: rgba(46, 168, 83, 0.05);
          transform: scale(1.02);
          box-shadow: var(--shadow-md);
        }

        .tool-button:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Sidebar */}
      <div 
        className="animate-slide-in-left"
        style={{
          width: '280px',
          backgroundColor: '#2c1f4a',
          color: 'white',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo y Título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <img
            src="/logo1.png"
            alt="LinguaLab"
            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', opacity: 0.7 }}>Principal</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>Administrador</p>
          </div>
        </div>

        {/* Menú */}
        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '16px', letterSpacing: '1px' }}>
            Menú<br />Main
          </p>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              style={{
                backgroundColor: activeMenu === item.id ? 'var(--color-primary-green)' : 'transparent',
                color: activeMenu === item.id ? 'white' : '#e5e7eb',
                borderLeftColor: activeMenu === item.id ? 'var(--color-primary-green-dark)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: activeMenu === item.id ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Botón Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
            boxShadow: 'var(--shadow-md)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Logout
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div 
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              ⚙️
            </button>
          </div>
          
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green-light)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✓ {user?.nombre}
          </button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {/* Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-card animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{stat.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-dark-blue)', marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-gray-dark)', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Sección TOOLS */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark-blue)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tools
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="tool-button animate-slide-in-right"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => console.log(`Action: ${tool.action}`)}
                >
                  <span style={{ fontSize: '28px' }}>{tool.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-blue)', textAlign: 'center' }}>
                    {tool.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuthProtection(AdminDashboard, 'administrador');
