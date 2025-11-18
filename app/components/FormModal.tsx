'use client';

import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'checkbox';
  placeholder: string;
  required?: boolean;
  autoFillFrom?: string; // Campo del cual auto-rellenar
  showInfo?: boolean; // Mostrar icono de info
  infoMessage?: string; // Mensaje personalizado para el campo
  options?: SelectOption[]; // Opciones para select
  apiEndpoint?: string; // Endpoint para cargar opciones dinámicamente
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  submitButtonLabel?: string;
  successMessage?: string;
  onSuccess?: () => void;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  submitButtonLabel = 'Add',
  successMessage = 'Registration successful',
  onSuccess,
}: FormModalProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [visiblePasswords, setVisiblePasswords] = React.useState<Record<string, boolean>>({});
  const [selectOptions, setSelectOptions] = React.useState<Record<string, SelectOption[]>>({});
  const [renderOpen, setRenderOpen] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  // Controlar montaje para permitir animación de salida
  React.useEffect(() => {
    if (isOpen) {
      setRenderOpen(true);
      setIsExiting(false);
    } else if (renderOpen) {
      // Si el padre cierra externamente, reproducir salida y desmontar al finalizar
      setIsExiting(true);
      const t = setTimeout(() => setRenderOpen(false), 260);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Cargar opciones de selects desde API
  React.useEffect(() => {
    const loadSelectOptions = async () => {
      for (const field of fields) {
        if (field.type === 'select' && field.apiEndpoint) {
          try {
            const response = await fetch(field.apiEndpoint);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                // Convertir la respuesta al formato SelectOption
                const options = data.data.map((item: any) => ({
                  value: item.id_programa || item.id_nivel,
                  label: item.nombre,
                }));
                setSelectOptions(prev => ({ ...prev, [field.name]: options }));
              }
            }
          } catch (error) {
            console.error(`Error cargando opciones para ${field.name}:`, error);
          }
        } else if (field.type === 'select' && field.options) {
          // Usar opciones estáticas si se proveen
          setSelectOptions(prev => ({ ...prev, [field.name]: field.options! }));
        }
      }
    };
    
    if (isOpen) {
      loadSelectOptions();
    }
  }, [isOpen, fields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-llenar campos dependientes (ej: password desde matricula)
    let newFormData = { ...formData, [name]: value };
    
    // Si el campo editado es origen de auto-fill, actualizar sus dependientes
    const dependents = fields.filter(f => f.autoFillFrom === name);
    if (dependents.length > 0) {
      dependents.forEach(dep => {
        newFormData[dep.name] = value;
      });
    }

    // Si el campo editado es un campo con autoFillFrom (poco común), sincronizarlo desde su fuente
    const fieldConfig = fields.find(f => f.name === name);
    if (fieldConfig?.autoFillFrom && newFormData[fieldConfig.autoFillFrom]) {
      newFormData[name] = newFormData[fieldConfig.autoFillFrom];
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({});
      setShowConfirmation(false);
      // Cerrar con animación
      requestClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Volver al formulario para que el usuario pueda corregir
      setShowConfirmation(false);
      setIsSubmitting(false);
      // El error ya fue mostrado por el handler padre
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const requestClose = () => {
    setIsExiting(true);
    const t = setTimeout(() => {
      onClose();
      setRenderOpen(false);
      setIsExiting(false);
    }, 250);
    return () => clearTimeout(t);
  };

  if (!renderOpen) return null;

  return (
    <div
      className={`llw-modal-overlay ${isExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={requestClose}
    >
      {/* Modal de formulario */}
      {!showConfirmation && (
        <div
          className={`llw-modal-card ${isExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
          style={{
            backgroundColor: 'var(--color-dark-blue)',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={requestClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ff3b3b',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
              e.currentTarget.style.backgroundColor = '#ff4f4f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = '#ff3b3b';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
            }}
          >
            ✕
          </button>

          {/* Título */}
          <h2
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: '0 0 24px 0',
              paddingRight: '40px',
            }}
          >
            {title}
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fields.map(field => (
              <div key={field.name} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <label
                    style={{
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {field.label}
                  </label>
                </div>
                {field.type === 'password' ? (
                  <div style={{ position: 'relative' }}>
                    <input
                      type={visiblePasswords[field.name] ? 'text' : 'password'}
                      name={field.name}
                      placeholder=""
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      readOnly={field.autoFillFrom ? true : false}
                      className="llw-field-animate"
                      style={{
                        padding: '12px 44px 12px 16px',
                        borderRadius: '12px',
                        border: '2px solid var(--color-dark-blue)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        backgroundColor: 'white',
                        color: '#333',
                        cursor: field.autoFillFrom ? 'not-allowed' : 'text',
                        opacity: 1,
                        width: '100%',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                      }}
                    />
                    <button
                      type="button"
                      aria-label={visiblePasswords[field.name] ? 'Hide password' : 'Show password'}
                      onClick={() => setVisiblePasswords(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {visiblePasswords[field.name] ? (
                        // Eye open icon
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        // Eye closed icon
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-5.94"/>
                          <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-3.42"/>
                          <path d="M1 1l22 22"/>
                        </svg>
                      )}
                    </button>
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    className="llw-field-animate"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      color: '#333',
                      width: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <option value="">Select...</option>
                    {(selectOptions[field.name] || []).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'white', borderRadius: '12px', border: '2px solid var(--color-dark-blue)' }}>
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={formData[field.name] === '1' || formData[field.name] === 'true'}
                      onChange={(e) => {
                        handleInputChange({
                          target: {
                            name: field.name,
                            value: e.target.checked ? '1' : '0'
                          }
                        } as any);
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#333', userSelect: 'none' }}>{field.placeholder}</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder=""
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    readOnly={field.autoFillFrom ? true : false}
                    className="llw-field-animate"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      color: '#333',
                      cursor: field.autoFillFrom ? 'not-allowed' : 'text',
                      opacity: 1,
                      transition: 'all 0.2s ease',
                    }}
                  />
                )}
                {field.showInfo && formData[field.name] && (
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 193, 7, 0.9)',
                    marginTop: '4px',
                    fontStyle: 'italic',
                  }}>
                    {field.infoMessage || 'User must change password in their profile'}
                  </div>
                )}
              </div>
            ))}

            {/* Botón submit */}
            <button
              type="submit"
              style={{
                padding: '14px 24px',
                backgroundColor: 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '16px',
                transition: 'all var(--transition-normal)',
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
              {submitButtonLabel}
            </button>
          </form>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div
          className={`llw-modal-card ${isExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
          style={{
            backgroundColor: 'var(--color-dark-blue)',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '450px',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={handleCancel}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ff3b3b',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
              e.currentTarget.style.backgroundColor = '#ff4f4f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = '#ff3b3b';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
            }}
          >
            ✕
          </button>

          {/* Título */}
          <h2
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              margin: '0 0 24px 0',
              paddingRight: '40px',
            }}
          >
            Confirm data?
          </h2>

          {/* Resumen de datos */}
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {fields.map(field => {
              // Para campos select, mostrar el label en lugar del value
              let displayValue = formData[field.name] || '—';
              
              if (field.type === 'select' && formData[field.name]) {
                const selectedOption = (selectOptions[field.name] || []).find(
                  opt => String(opt.value) === String(formData[field.name])
                );
                displayValue = selectedOption?.label || formData[field.name];
              } else if (field.type === 'password') {
                displayValue = `••••••••${formData['matricula'] && formData[field.name] === formData['matricula'] ? ' (Student ID)' : ''}`;
              }

              return (
                <div
                  key={field.name}
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    {field.label}
                  </div>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    {displayValue}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-normal)',
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
            >
              Edit
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-normal)',
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
      {/* Animations */}
      <style jsx>{`
        @keyframes llw-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes llw-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes llw-pop-in {
          0% { opacity: 0; transform: translateY(15px) scale(0.94) rotate(1deg); }
          50% { opacity: 0.8; transform: translateY(-2px) scale(1.03) rotate(-0.5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes llw-pop-out {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(10px) scale(0.92) rotate(1deg); }
        }
        @keyframes llw-field-focus {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .llw-modal-overlay-enter { animation: llw-fade-in 200ms ease-out forwards; }
        .llw-modal-overlay-exit { animation: llw-fade-out 200ms ease-in forwards; }
        .llw-modal-card-enter { animation: llw-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; will-change: transform, opacity; }
        .llw-modal-card-exit { animation: llw-pop-out 250ms ease-in forwards; will-change: transform, opacity; }
        .llw-field-animate:focus { animation: llw-field-focus 200ms ease-out; }

        @media (max-width: 768px) {
          .llw-modal-card {
            width: 95% !important;
            max-width: none !important;
            padding: 24px !important;
            max-height: 95vh !important;
          }
        }
        @media (max-width: 480px) {
          .llw-modal-card {
            padding: 20px !important;
          }
          .llw-modal-card h2 {
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
