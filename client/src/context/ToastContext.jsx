import React, { createContext, useState, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-color)',
              border: `1px solid ${toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '300px',
              backdropFilter: 'blur(10px)',
              transform: 'translateX(0)',
              transition: 'all 0.3s ease'
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle color="#10B981" size={24} />
            ) : toast.type === 'error' ? (
              <AlertCircle color="#EF4444" size={24} />
            ) : (
              <AlertCircle color="var(--primary-accent)" size={24} />
            )}
            
            <span style={{ color: 'var(--text-primary)', flex: 1, fontWeight: '500' }}>
              {toast.message}
            </span>
            
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0', display: 'flex' }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
