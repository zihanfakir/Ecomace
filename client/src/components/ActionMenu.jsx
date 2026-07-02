import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

const ActionMenu = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }} 
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '5px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: '0',
          top: '100%',
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 100,
          minWidth: '150px',
          display: 'flex',
          flexDirection: 'column',
          padding: '5px'
        }}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                action.onClick();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 15px',
                textAlign: 'left',
                cursor: 'pointer',
                color: action.danger ? '#EF4444' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '5px',
                fontSize: '0.9rem',
                width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
