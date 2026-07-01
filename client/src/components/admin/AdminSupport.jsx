import React from 'react';
import { Send } from 'lucide-react';

const AdminSupport = ({ tickets, activeTicket, setActiveTicket, replyText, setReplyText, handleReplyTicket, handleCloseTicket }) => {
  return (
    <div>
      <h2 style={{ marginBottom: '30px' }}>Support Tickets</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        {/* Ticket List */}
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px', overflow: 'hidden' }}>
          {tickets.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No support tickets.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tickets.map(ticket => (
                <div 
                  key={ticket._id} 
                  onClick={() => setActiveTicket(ticket)}
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    backgroundColor: activeTicket?._id === ticket._id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                        {ticket.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1rem' }}>{ticket.userName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.userEmail}</span>
                      </div>
                    </div>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: ticket.status === 'open' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: ticket.status === 'open' ? '#F59E0B' : '#10B981'
                    }}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{ticket.subject}</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {ticket.conversation?.[0]?.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Ticket View */}
        {activeTicket && (
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{activeTicket.subject}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  From: {activeTicket.userName} ({activeTicket.userEmail})<br/>
                  Phone: {activeTicket.userPhone}
                </div>
              </div>
              {activeTicket.status === 'open' && (
                <button 
                  onClick={() => handleCloseTicket(activeTicket._id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #F59E0B', backgroundColor: 'transparent', color: '#F59E0B', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Mark as Closed
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {activeTicket.conversation?.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'admin' ? 'var(--primary-accent)' : 'var(--bg-color)',
                  color: msg.sender === 'admin' ? 'white' : 'var(--text-primary)',
                  padding: '12px 15px',
                  borderRadius: '12px',
                  maxWidth: '80%',
                  border: msg.sender === 'user' ? '1px solid var(--border-color)' : 'none'
                }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  <span style={{ fontSize: '0.7rem', color: msg.sender === 'admin' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', display: 'block', marginTop: '5px', textAlign: 'right' }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleReplyTicket} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input 
                type="text" 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                placeholder="Type your reply..." 
                disabled={activeTicket.status === 'closed'}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
              />
              <button type="submit" className="btn-primary" disabled={!replyText.trim() || activeTicket.status === 'closed'} style={{ padding: '12px 20px' }}>
                <Send size={18} />
              </button>
            </form>
            {activeTicket.status === 'closed' && (
              <p style={{ textAlign: 'center', color: '#EF4444', fontSize: '0.9rem', margin: 0 }}>This ticket is closed.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
