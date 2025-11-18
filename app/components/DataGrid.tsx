'use client';

import React from 'react';

interface FilterConfig {
  type: 'search' | 'select';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
  flex?: string;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

interface DataGridProps {
  title: string;
  totalItems: number;
  itemName: string; // e.g., "Student", "Group"
  itemNamePlural?: string; // e.g., "Students", "Groups"
  legend?: {
    items: Array<{
      color: string;
      label: string;
    }>;
  };
  filters?: FilterConfig[];
  actions?: ActionButton[];
  children: React.ReactNode; // Grid content
  gridCols?: string; // CSS grid template columns
}

export default function DataGrid({
  title,
  totalItems,
  itemName,
  itemNamePlural,
  legend,
  filters = [],
  actions = [],
  children,
  gridCols = 'repeat(auto-fill, minmax(300px, 1fr))'
}: DataGridProps) {
  const pluralName = itemNamePlural || `${itemName}s`;

  return (
    <div style={{ 
      border: '3px solid var(--color-dark-blue)', 
      borderRadius: '12px', 
      padding: '24px', 
      backgroundColor: 'white' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-blue)', margin: 0 }}>
          {title}
        </h2>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: 'var(--color-primary-green)', 
          color: 'white', 
          borderRadius: '10px', 
          fontSize: '15px', 
          fontWeight: 700, 
          boxShadow: '0 3px 10px rgba(46,168,83,0.3)' 
        }}>
          Total: {totalItems} {totalItems === 1 ? itemName : pluralName}
        </div>
      </div>

      {/* Legend */}
      {legend && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb' 
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            {itemName} Status:
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
            {legend.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px', 
          flexWrap: 'wrap', 
          justifyContent: 'flex-end'
        }}>
          {actions.map((action, index) => (
            <button 
              key={index}
              type="button" 
              onClick={action.onClick}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: action.variant === 'secondary' ? 'rgba(255,255,255,0.1)' : 'var(--color-primary-green)', 
                color: action.variant === 'secondary' ? 'var(--color-dark-blue)' : 'white', 
                border: action.variant === 'secondary' ? '2px solid var(--color-dark-blue)' : 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                transition: 'all 0.25s' 
              }} 
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)'; 
              }} 
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'none'; 
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px', 
          flexWrap: 'wrap', 
          alignItems: 'center' 
        }}>
          {filters.map((filter, index) => (
            <React.Fragment key={index}>
              {filter.type === 'search' ? (
                <input 
                  type="text" 
                  placeholder={filter.placeholder || 'Search...'} 
                  value={filter.value} 
                  onChange={(e) => filter.onChange(e.target.value)}
                  style={{ 
                    flex: filter.flex || '1 1 250px', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '2px solid var(--color-dark-blue)', 
                    fontSize: '13px', 
                    outline: 'none' 
                  }} 
                />
              ) : (
                <select 
                  value={filter.value} 
                  onChange={(e) => filter.onChange(e.target.value)}
                  style={{ 
                    flex: filter.flex || '0 0 140px', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '2px solid var(--color-dark-blue)', 
                    fontSize: '13px', 
                    outline: 'none', 
                    cursor: 'pointer', 
                    backgroundColor: 'white' 
                  }}
                >
                  {filter.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Grid Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: gridCols, 
        gap: '16px' 
      }}>
        {children}
      </div>
    </div>
  );
}