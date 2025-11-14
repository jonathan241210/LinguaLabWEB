'use client';

import { useState } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';

function AlumnosDashboard() {
  const [activeMenu, setActiveMenu] = useState('home');

  return (
    <DashboardLayout
      title="Alumnos"
      activeMenu={activeMenu}
      onMenuItemClick={setActiveMenu}
      roleType="alumno"
    >
      <div style={{ padding: '24px' }}>
        <h1 style={{ color: 'var(--color-dark-blue)', fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>
          Dashboard de Alumnos
        </h1>
        <p style={{ color: 'var(--color-gray-dark)', fontSize: '14px', marginBottom: '24px' }}>
          Aquí irá el contenido personalizado del panel de alumnos
        </p>

        {/* Grid de funcionalidades para alumnos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {[
            { icon: '📖', title: 'Mis Cursos', desc: 'Ve tus cursos y materias inscritos' },
            { icon: '✓', title: 'Mis Tareas', desc: 'Consulta y entrega tus actividades' },
            { icon: '📊', title: 'Mi Progreso', desc: 'Revisa tu desempeño académico' },
            { icon: '🎮', title: 'Juegos Educativos', desc: 'Participa en juegos interactivos' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '24px',
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e5e7eb',
                transition: 'all var(--transition-normal)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.borderColor = 'var(--color-primary-green)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
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
    </DashboardLayout>
  );
}

export default withAuthProtection(AlumnosDashboard, 'alumno');
