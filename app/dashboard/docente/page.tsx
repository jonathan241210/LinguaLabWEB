'use client';

import { useState } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';

function DocenteDashboard() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [selectedGroup, setSelectedGroup] = useState('1');

  const groups = [
    { id: '1', name: 'Inglés I', section: 'Contaduría 11', students: 11 },
    { id: '2', name: 'Inglés I', section: 'Sistemas 12', students: 12 },
    { id: '3', name: 'Inglés II', section: 'Enfermería 22', students: 22 },
    { id: '4', name: 'Inglés II', section: 'Industrias 21', students: 21 },
  ];

  const flaskIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3h8v3H8z" />
      <path d="M8 6h8v8c0 2-1 4-4 4s-4-2-4-4V6z" />
      <line x1="8" y1="18" x2="16" y2="18" />
      <line x1="9" y1="18" x2="15" y2="20" />
    </svg>
  );

  const peopleIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <DashboardLayout
      title="Docentes"
      activeMenu={activeMenu}
      onMenuItemClick={setActiveMenu}
      roleType="docente"
    >
      <div style={{ padding: '24px' }}>
        {/* Contenedor principal con borde */}
        <div style={{
          border: '3px solid var(--color-dark-blue)',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: 'var(--color-white)',
        }}>
          {/* Sección de Grupos */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ color: 'var(--color-dark-blue)', fontSize: '16px', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase' }}>
              Groups
            </h2>

            {/* Fila con tarjeta de cantidad y tarjetas de grupos */}
            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              alignItems: 'center',
              border: '3px solid var(--color-dark-blue)',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'var(--color-white)',
              minHeight: '140px',
            }}>
              {/* Tarjeta de cantidad */}
              <div style={{
                padding: '24px 20px',
                backgroundColor: 'var(--color-white)',
                border: '3px solid var(--color-dark-blue)',
                borderRadius: '12px',
                minWidth: '160px',
                textAlign: 'center',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <h3 style={{ margin: '0', color: 'var(--color-dark-blue)', fontSize: '48px', fontWeight: 'bold' }}>
                  {groups.length}
                </h3>
                <p style={{ margin: '8px 0 0 0', color: 'var(--color-dark-blue)', fontSize: '14px', fontWeight: '600' }}>
                  Groups
                </p>
              </div>

              {/* Tarjetas de grupos */}
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  style={{
                    padding: '20px 16px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '130px',
                    flexShrink: 0,
                    height: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{group.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '4px' }}>{group.section}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sección de grupo seleccionado y acciones */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
          }}>
            {/* Información del grupo seleccionado */}
            {selectedGroupData && (
              <div style={{
                padding: '24px 20px',
                backgroundColor: 'var(--color-white)',
                border: '3px solid var(--color-dark-blue)',
                borderRadius: '12px',
                minWidth: '220px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-dark-blue)', fontSize: '18px', fontWeight: '600' }}>
                  {selectedGroupData.name}
                </h3>
                <p style={{ margin: 0, color: 'var(--color-dark-blue)', fontSize: '14px' }}>
                  {selectedGroupData.section}
                </p>
              </div>
            )}

            {/* Botones de acciones */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              flex: 1,
            }}>
              {['Promedio general', 'Recomendaciones'].map(action => (
                <button
                  key={action}
                  style={{
                    padding: '16px 24px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    minHeight: '50px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Sección de herramientas */}
          <div>
            <h3 style={{ color: 'var(--color-dark-blue)', fontSize: '14px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
              Herramientas
            </h3>
            <div style={{
              display: 'flex',
              gap: '14px',
            }}>
              {[
                { label: 'Labs', icon: flaskIcon },
                { label: 'Activities', icon: peopleIcon },
              ].map(tool => (
                <button
                  key={tool.label}
                  style={{
                    padding: '16px 28px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '50px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuthProtection(DocenteDashboard, 'docente');
