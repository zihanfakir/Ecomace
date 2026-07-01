import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Package, Settings, Save, X } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: '', photoUrl: user.photoUrl || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Support Tickets State
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({ subject: '', text: '', phone: '' });
  const [replyText, setReplyText] = useState('');
  const { addToast } = useToast();

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`https://ecomace.onrender.com/api/messages/user/${user._id}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`https://ecomace.onrender.com/api/orders/user/${user._id}`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchOrders();
      fetchTickets();
    }
  }, [user]);
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage('');
    try {
      const response = await axios.put(`https://ecomace.onrender.com/api/users/${user._id}`, profileData);
      updateUser(response.data);
      setMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      setProfileData({ ...profileData, password: '' }); // clear password field
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    const phoneRegex = /^01\d{9}$/;
    if (!phoneRegex.test(newTicket.phone)) {
      addToast('Phone number is required and must be exactly 11 digits starting with 01.', 'error');
      return;
    }

    try {
      await axios.post('https://ecomace.onrender.com/api/messages', {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userPhone: newTicket.phone,
        subject: newTicket.subject,
        text: newTicket.text
      });
      setNewTicket({ subject: '', text: '', phone: '' });
      setActiveTicket(null);
      fetchTickets();
      addToast('Support ticket created', 'success');
    } catch (error) {
      addToast('Failed to create ticket', 'error');
    }
  };

    const handleReply = async (e) => {
      e.preventDefault();
      if (!replyText.trim() || !activeTicket) return;
      try {
        const res = await axios.post(`https://ecomace.onrender.com/api/messages/${activeTicket._id}/reply`, {
          sender: 'user',
          text: replyText
        });
        // Update local ticket state
        const updatedTickets = tickets.map(t => t._id === activeTicket._id ? res.data : t);
        setTickets(updatedTickets);
        setActiveTicket(res.data);
        setReplyText('');
      } catch (error) {
        addToast('Failed to send reply', 'error');
      }
    };
  
    return (
    <div className="animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Welcome, {user.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditingProfile(!isEditingProfile)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--primary-accent)', background: 'transparent', color: 'var(--primary-accent)', cursor: 'pointer' }}
        >
          {isEditingProfile ? <X size={18} /> : <Settings size={18} />} {isEditingProfile ? 'Cancel' : 'Account Settings'}
        </button>
      </div>

      {message && <div style={{ backgroundColor: message.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.includes('success') ? '#10B981' : '#EF4444', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{message}</div>}

      {isEditingProfile && (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Update Profile</h2>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
              <input type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email Address</label>
              <input type="email" required value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profile Picture URL</label>
              <input type="text" value={profileData.photoUrl} onChange={e => setProfileData({...profileData, photoUrl: e.target.value})} placeholder="https://example.com/image.png" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New Password (leave blank to keep current)</label>
              <input type="password" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
              <Save size={18} /> {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      <h2>My Purchased Keys</h2>
      
      {loading ? (
        <p>Loading your keys...</p>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
          <Package size={48} color="var(--text-secondary)" style={{ marginBottom: '20px' }} />
          <h3>No purchases yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>When you buy a premium app, your license keys will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {orders.slice().reverse().map(order => (
            <div key={order._id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Order #{order._id.replace('order_', '').substring(0, 8).toUpperCase()}</h3>
                  <span style={{
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: order.status === 'complete' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'cancel' ? 'rgba(239, 68, 68, 0.2)' : order.status === 'processing' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: order.status === 'complete' ? '#10B981' : order.status === 'cancel' ? '#EF4444' : order.status === 'processing' ? '#3B82F6' : '#F59E0B'
                  }}>
                    {order.status || 'pending'}
                  </span>
                </div>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                  Placed on: {new Date(order.createdAt).toLocaleDateString()} via {order.paymentMethod}
                </div>

                {order.status === 'cancel' ? (
                  <p style={{ color: '#EF4444' }}>This order was cancelled. Please contact support if you believe this is an error.</p>
                ) : (order.status === 'pending' || !order.status) ? (
                  <p style={{ color: '#F59E0B' }}>Your payment is currently being verified. Your keys will appear here once approved.</p>
                ) : order.status === 'processing' ? (
                  <p style={{ color: '#3B82F6' }}>Your order is currently processing. Your keys will be delivered shortly.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {order.items ? (
                      order.items.map((item, idx) => (
                        <div key={idx}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.productName} (x{item.quantity})</div>
                          {item.keys && item.keys.map((k, i) => {
                            const isLink = k.startsWith('http://') || k.startsWith('https://');
                            return (
                              <div key={i} style={{ display: 'inline-block', backgroundColor: 'var(--bg-color)', padding: '8px 15px', borderRadius: '8px', border: '1px dashed var(--primary-accent)', marginRight: '10px', marginBottom: '5px', wordBreak: 'break-all', maxWidth: '100%' }}>
                                {isLink ? (
                                  <a href={k} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-accent)', textDecoration: 'underline' }}>{k}</a>
                                ) : (
                                  <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{k}</code>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      // Legacy format support
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{order.productName}</div>
                        <div style={{ display: 'inline-block', backgroundColor: 'var(--bg-color)', padding: '8px 15px', borderRadius: '8px', border: '1px dashed var(--primary-accent)', wordBreak: 'break-all', maxWidth: '100%' }}>
                          {(order.soldKey && (order.soldKey.startsWith('http://') || order.soldKey.startsWith('https://'))) ? (
                            <a href={order.soldKey} target="_blank" rel="noopener noreferrer" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary-accent)', textDecoration: 'underline' }}>{order.soldKey}</a>
                          ) : (
                            <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{order.soldKey}</code>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-accent)', textAlign: 'right' }}>
                ৳ {order.totalPrice || order.price}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Section */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>Support & Messages</h2>
        
        <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Ticket List */}
          <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Your Tickets</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => setActiveTicket('new')}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-accent)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + New Support Ticket
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tickets.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No tickets found</p>
              ) : (
                tickets.slice().reverse().map(ticket => (
                  <div 
                    key={ticket._id} 
                    onClick={() => setActiveTicket(ticket)}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      backgroundColor: activeTicket && activeTicket._id === ticket._id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-color)',
                      border: activeTicket && activeTicket._id === ticket._id ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '0.95rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{ticket.subject}</strong>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 6px', 
                        borderRadius: '8px', 
                        backgroundColor: ticket.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        color: ticket.status === 'open' ? '#10B981' : '#6B7280',
                        textTransform: 'uppercase'
                      }}>{ticket.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Last update: {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket View Area */}
          <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden' }}>
            {!activeTicket ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Select a ticket to view or create a new one.
              </div>
            ) : activeTicket === 'new' ? (
              <div style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Ticket</h3>
                <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subject</label>
                    <input 
                      type="text" 
                      required 
                      value={newTicket.subject}
                      onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                      placeholder="e.g. Invalid Key for Windows 10"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Phone Number</label>
                    <input 
                      type="text" 
                      required 
                      value={newTicket.phone}
                      onChange={e => setNewTicket({...newTicket, phone: e.target.value})}
                      placeholder="e.g. 01700000000"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Message</label>
                    <textarea 
                      required 
                      value={newTicket.text}
                      onChange={e => setNewTicket({...newTicket, text: e.target.value})}
                      placeholder="Describe your issue..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '150px', resize: 'vertical' }} 
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '10px' }}>
                    Submit Ticket
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <h3 style={{ margin: 0 }}>{activeTicket.subject}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Created on: {new Date(activeTicket.createdAt).toLocaleString()}</div>
                </div>
                
                {/* Chat Body */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activeTicket.conversation.map((msg, idx) => (
                    <div key={idx} style={{ 
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        backgroundColor: msg.sender === 'user' ? 'var(--primary-accent)' : 'var(--bg-color)',
                        color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                        border: msg.sender === 'admin' ? '1px solid var(--border-color)' : 'none',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '5px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                        {msg.sender === 'user' ? 'You' : 'Admin'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} 
                    />
                    <button type="submit" className="btn-primary" disabled={!replyText.trim()} style={{ padding: '12px 20px' }}>
                      Send
                    </button>
                  </form>
                  {activeTicket.status === 'closed' && (
                    <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '10px', textAlign: 'center' }}>
                      This ticket is closed. Reply to reopen it.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
