'use client';

import React from 'react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder: string;
  required?: boolean;
  autoFillFrom?: string; // Campo del cual auto-rellenar
  showInfo?: boolean; // Mostrar icono de info
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  submitButtonLabel?: string;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  submitButtonLabel = 'Add',
}: FormModalProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-llenar campos dependientes (ej: password desde matricula)
    let newFormData = { ...formData, [name]: value };
    
    const fieldConfig = fields.find(f => f.name === name);
    if (fieldConfig?.autoFillFrom) {
      const sourceField = fields.find(f => f.name === fieldConfig.autoFillFrom);
      if (sourceField && newFormData[fieldConfig.autoFillFrom]) {
        newFormData[name] = newFormData[fieldConfig.autoFillFrom];
      }
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
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div
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
      onClick={onClose}
    >
      {/* Modal de formulario */}
      {!showConfirmation && (
        <div
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
            onClick={onClose}
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
                  {field.showInfo && (
                    <div
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 193, 7, 0.9)',
                        color: '#333',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'help',
                        marginLeft: '4px',
                      }}
                      title="El docente debe cambiar su contraseña en su perfil"
                    >
                      !
                    </div>
                  )}
                </div>
                <input
                  type={field.type}
                  name={field.name}
                  placeholder=""
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  readOnly={field.autoFillFrom ? true : false}
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
                  }}
                />
                {field.showInfo && formData[field.name] && (
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 193, 7, 0.9)',
                    marginTop: '4px',
                    fontStyle: 'italic',
                  }}>
                    El docente debe cambiar su contraseña en su perfil
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
            ¿Confirmar datos?
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
            {fields.map(field => (
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
                  {field.type === 'password' ? '••••••••' : formData[field.name] || '—'}
                </div>
              </div>
            ))}
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
              Editar
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
              {isSubmitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
