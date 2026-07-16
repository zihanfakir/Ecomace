import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Package, Settings, Save, X } from 'lucide-react';
import { uploadToImgBB } from '../utils/imageUtils';

const CustomerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: '', photoUrl: user.photoUrl || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');



  const { addToast } = useToast();



  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/orders/user/${user._id}`);
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchOrders();
    }
  }, [user]);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addToast('Image must be smaller than 5MB', 'error');
        return;
      }
      try {
        addToast('Uploading image...', 'info');
        const url = await uploadToImgBB(file, 800, 0.7);
        setProfileData(prev => ({ ...prev, photoUrl: url }));
        addToast('Image uploaded successfully', 'success');
      } catch (error) {
        console.error('Image upload failed', error);
        addToast('Failed to process image', 'error');
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage('');
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/users/${user._id}`, profileData);
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
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-accent)', color: 'var(--primary-accent)', padding: '5px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.8rem', marginTop: '10px', width: 'fit-content' }}>
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
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
          {orders.map(order => (
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
                    backgroundColor: order.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.2)' : order.status === 'processing' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: order.status === 'completed' ? '#10B981' : order.status === 'cancelled' ? '#EF4444' : order.status === 'processing' ? '#3B82F6' : '#F59E0B'
                  }}>
                    {order.status || 'pending'}
                  </span>
                </div>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                  Placed on: {new Date(order.createdAt).toLocaleDateString()} via {order.paymentMethod}
                </div>

                {order.status === 'cancelled' ? (
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

    </div>
  );
};

export default CustomerDashboard;
