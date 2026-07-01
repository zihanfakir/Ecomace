import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Tag, Package, X, History, Save, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', keys: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: '', discountType: 'percent', usageLimit: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  
  // Settings state
  const [paymentMethods, setPaymentMethods] = useState({ bkash: '', nagad: '', rocket: '', upay: '', bybit: '', binance: '' });
  const [banners, setBanners] = useState([]);
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', password: '', photoUrl: user?.photoUrl || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Custom Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchUsers();
    fetchOrders();
    fetchCoupons();
    fetchTickets();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/settings');
      if (response.data?.paymentMethods) {
        setPaymentMethods(response.data.paymentMethods);
      }
      if (response.data?.banners) {
        setBanners(response.data.banners);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/messages');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`https://ecomace.onrender.com/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update order status', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await axios.delete(`https://ecomace.onrender.com/api/orders/${orderToDelete}`);
      setOrderToDelete(null);
      fetchOrders();
      addToast('Order deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete order', 'error');
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('https://ecomace.onrender.com/api/coupons', newCoupon);
      setIsCouponModalOpen(false);
      setNewCoupon({ code: '', discountPercent: '', discountType: 'percent' });
      fetchCoupons();
      addToast('Coupon created successfully', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to add coupon', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    try {
      await axios.put(`https://ecomace.onrender.com/api/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      fetchCoupons();
      addToast(`Coupon ${!coupon.isActive ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (error) {
      addToast('Failed to update coupon', 'error');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await axios.delete(`https://ecomace.onrender.com/api/coupons/${couponToDelete}`);
      setCouponToDelete(null);
      fetchCoupons();
      addToast('Coupon deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete coupon', 'error');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingProductId) {
        // Edit existing product
        await axios.put(`https://ecomace.onrender.com/api/products/${editingProductId}`, newProduct, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Add new product
        await axios.post('https://ecomace.onrender.com/api/products', newProduct, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      setIsModalOpen(false);
      setEditingProductId(null);
      setNewProduct({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', keys: '' });
      fetchProducts();
      addToast(editingProductId ? 'Product updated successfully' : 'Product added successfully', 'success');
    } catch (error) {
      addToast(editingProductId ? 'Failed to edit product' : 'Failed to add product', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`https://ecomace.onrender.com/api/products/${productToDelete}`);
      setProductToDelete(null);
      fetchProducts();
      addToast('Product deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete product', 'error');
    }
  };

  const handleEditClick = (product) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      bigDescription: product.bigDescription || '',
      price: product.price,
      icon: product.icon || '🔑',
      photoUrl: product.photoUrl || '',
      discount: product.discount || '',
      discountType: product.discountType || 'percent',
      keys: product.stockKeys ? product.stockKeys.join('\n') : ''
    });
    setEditingProductId(product._id);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setNewProduct({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', keys: '' });
    setIsModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage('');
    try {
      const response = await axios.put(`https://ecomace.onrender.com/api/users/${user._id}`, profileData);
      updateUser(response.data);
      setMessage('Admin profile updated successfully!');
      setProfileData({ ...profileData, password: '' }); // clear password field
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePaymentSettings = async (e) => {
    e.preventDefault();
    setPaymentSettingsLoading(true);
    try {
      await axios.put('https://ecomace.onrender.com/api/settings', { paymentMethods, banners });
      addToast('Settings updated successfully!', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setPaymentSettingsLoading(false);
    }
  };

  const handleAddBanner = () => {
    setBanners([...banners, { id: Date.now().toString() + Math.random().toString(36).substring(7), imageUrl: '', targetUrl: '', isActive: true }]);
  };

  const handleUpdateBanner = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleRemoveBanner = (id) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    try {
      const res = await axios.post(`https://ecomace.onrender.com/api/messages/${activeTicket._id}/reply`, {
        sender: 'admin',
        text: replyText
      });
      // Update local state
      const updatedTickets = tickets.map(t => t._id === activeTicket._id ? res.data : t);
      setTickets(updatedTickets);
      setActiveTicket(res.data);
      setReplyText('');
    } catch (error) {
      addToast('Failed to send reply', 'error');
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const res = await axios.put(`https://ecomace.onrender.com/api/messages/${ticketId}/status`, { status: 'closed' });
      const updatedTickets = tickets.map(t => t._id === ticketId ? res.data : t);
      setTickets(updatedTickets);
      setActiveTicket(res.data);
      addToast('Ticket marked as closed', 'success');
    } catch (error) {
      addToast('Failed to close ticket', 'error');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`https://ecomace.onrender.com/api/users/${userId}`, { role: newRole });
      addToast('User role updated successfully', 'success');
      fetchUsers(); // Refresh the list
    } catch (error) {
      addToast('Failed to update user role', 'error');
    }
  };

  return (
    <div className="animate-fade-in dashboard-container">
      
      {/* Add Product Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-color)', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{editingProductId ? 'Edit Product' : 'Add License/Account Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
              <input list="product-names" type="text" placeholder="Product Name (e.g. Canva Pro 1 Month)" required value={newProduct.name} onChange={e => {
                const val = e.target.value;
                const existingProd = products.find(p => p.name === val);
                if(existingProd && !editingProductId) {
                  setNewProduct(prev => ({ ...prev, name: val, description: existingProd.description, bigDescription: existingProd.bigDescription, price: existingProd.price, discount: existingProd.discount, discountType: existingProd.discountType, photoUrl: existingProd.photoUrl, icon: existingProd.icon }));
                } else {
                  setNewProduct({...newProduct, name: val});
                }
              }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              <datalist id="product-names">
                {[...new Set(products.map(p => p.name))].map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
              <input type="text" placeholder="Short Description" required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Big Description (For Product Page)</label>
                <textarea 
                  rows={4}
                  placeholder="Detailed description, features, instructions..."
                  value={newProduct.bigDescription} 
                  onChange={e => setNewProduct({...newProduct, bigDescription: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', width: '100%', flexWrap: 'wrap' }}>
                <input type="number" placeholder="Price (৳)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{ flex: '1 1 120px', minWidth: 0, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                <div style={{ flex: '2 1 200px', display: 'flex', gap: '5px', minWidth: 0 }}>
                  <input type="number" placeholder="Discount" value={newProduct.discount} onChange={e => setNewProduct({...newProduct, discount: e.target.value})} style={{ flex: 2, minWidth: 0, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  <select value={newProduct.discountType} onChange={e => setNewProduct({...newProduct, discountType: e.target.value})} style={{ flex: 1, minWidth: 0, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}>
                    <option value="percent">%</option>
                    <option value="flat">৳</option>
                  </select>
                </div>
              </div>

              <input type="text" placeholder="Product Photo URL (e.g. logo link)" value={newProduct.photoUrl} onChange={e => setNewProduct({...newProduct, photoUrl: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Icon Emoji (Fallback, e.g. 🎨)" value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Keys / Accounts Stock (One per line)</label>
                <textarea 
                  required 
                  rows={5}
                  placeholder={`example1@gmail.com:pass123\nABCD-EFGH-1234-5678`}
                  value={newProduct.keys} 
                  onChange={e => setNewProduct({...newProduct, keys: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box' }} 
                />
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '10px' }}>
                {isLoading ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {isCouponModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Create Coupon</h2>
              <button onClick={() => setIsCouponModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
            </div>
            <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Coupon Code (e.g. EID25)" required value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} style={{ padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="number" placeholder="Discount Value" required value={newCoupon.discountPercent} onChange={e => setNewCoupon({...newCoupon, discountPercent: e.target.value})} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                <select value={newCoupon.discountType} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                  <option value="percent">%</option>
                  <option value="flat">৳</option>
                </select>
              </div>
              <input type="number" placeholder="Usage Limit (Optional, e.g. 100)" value={newCoupon.usageLimit} onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '10px' }}>
                {isLoading ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '30px', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
              <X size={32} color="#EF4444" />
            </div>
            <h2 style={{ marginBottom: '10px' }}>Delete Product?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setProductToDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleDeleteProduct} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '30px', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
              <X size={32} color="#EF4444" />
            </div>
            <h2 style={{ marginBottom: '10px' }}>Delete Order?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Are you sure you want to delete this order? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setOrderToDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleDeleteOrder} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Coupon Confirmation Modal */}
      {couponToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '30px', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
              <X size={32} color="#EF4444" />
            </div>
            <h2 style={{ marginBottom: '10px' }}>Delete Coupon?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Are you sure you want to delete this coupon? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setCouponToDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleDeleteCoupon} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="glass-panel dashboard-sidebar" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: 'bold', overflow: 'hidden' }}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'A'
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user?.name || 'Admin'}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Admin Panel</div>
          </div>
        </div>
        
        <h3 style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '3px solid var(--primary-accent)' }}>Admin Menu</h3>
        
        <button onClick={() => setActiveTab('products')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'products' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'products' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Package size={18} /> Products
        </button>
        <button onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'users' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'users' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Users size={18} /> Users
        </button>
        <button onClick={() => setActiveTab('coupons')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'coupons' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'coupons' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Tag size={18} /> Coupons
        </button>
        <button onClick={() => setActiveTab('history')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'history' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <History size={18} /> Order History
        </button>
        <button onClick={() => setActiveTab('messages')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'messages' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'messages' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <MessageSquare size={18} /> Messages
        </button>
        <button onClick={() => setActiveTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'settings' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'settings' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Settings size={18} /> Settings
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel dashboard-content" style={{ padding: '30px' }}>
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>Manage Digital Licenses</h2>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }} onClick={handleOpenAddModal}>
                <Plus size={18} /> Add New Product
              </button>
            </div>
            
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px' }}>
              <div className="mobile-table-header" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr', fontWeight: 'bold', paddingBottom: '15px', borderBottom: 'var(--glass-border)', marginBottom: '15px' }}>
                <div>Image/Icon</div>
                <div>Product Name</div>
                <div>Stock</div>
                <div>Price</div>
                <div>Actions</div>
              </div>
              
              {products.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No products found. Add one!</p>
              ) : (
                products.map(product => (
                  <div key={product._id} className="mobile-table-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
                      {product.photoUrl ? <img src={product.photoUrl} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : product.icon}
                    </div>
                    <div>
                      {product.name}
                      {product.discount > 0 && <span style={{ marginLeft: '10px', fontSize: '0.75rem', backgroundColor: '#EF4444', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>-{product.discount}{product.discountType === 'flat' ? '৳' : '%'}</span>}
                    </div>
                    <div>
                      <span style={{ backgroundColor: 'rgba(57, 184, 255, 0.2)', color: 'var(--secondary-accent)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {product.stockKeys?.length || 0} left
                      </span>
                    </div>
                    <div>
                      {product.discount > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: '5px' }}>৳ {product.price}</span>
                          <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>৳ {product.discountType === 'flat' ? Math.max(0, product.price - product.discount) : Math.round(product.price - (product.price * (product.discount / 100)))}</span>
                        </>
                      ) : (
                        `৳ ${product.price}`
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleEditClick(product)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--primary-accent)', backgroundColor: 'transparent', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                      <button onClick={() => setProductToDelete(product._id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '30px' }}>Manage Users</h2>
            
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
              <div className="mobile-table-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1.5fr) minmax(120px, 1fr)', gap: '15px', fontWeight: 'bold', paddingBottom: '15px', borderBottom: 'var(--glass-border)', marginBottom: '15px', minWidth: '800px' }}>
                <div>User</div>
                <div>Contact Details</div>
                <div>Stats</div>
                <div>Role</div>
                <div>Joined</div>
              </div>
              
              {users.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No users found.</p>
              ) : (
                users.map(user => {
                  const userOrders = orders.filter(o => o.userId === user._id || (o.customerDetails && o.customerDetails.email === user.email));
                  const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalPrice || o.price) || 0), 0);
                  
                  return (
                  <div key={user._id} className="mobile-table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1.5fr) minmax(120px, 1fr)', gap: '15px', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)', minWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user._id.substring(0,8)}...</div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: 'var(--text-primary)' }}>{user.email}</div>
                      {/* Using the latest ticket or order for phone number since phone isn't in user schema natively */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                         {userOrders.find(o => o.customerDetails?.phone)?.customerDetails.phone || 'No Phone Added'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{userOrders.length} Orders</div>
                      <div style={{ fontSize: '0.85rem', color: '#10B981' }}>৳ {totalSpent} Spent</div>
                    </div>

                    <div>
                      <select 
                        value={user.role || 'customer'} 
                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        disabled={user.email === 'admin@ecomace.com'}
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: '8px', 
                          backgroundColor: user.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(57, 184, 255, 0.1)', 
                          color: user.role === 'admin' ? '#10B981' : 'var(--secondary-accent)', 
                          border: `1px solid ${user.role === 'admin' ? '#10B981' : 'var(--secondary-accent)'}`,
                          outline: 'none', 
                          cursor: user.email === 'admin@ecomace.com' ? 'not-allowed' : 'pointer', 
                          fontWeight: 'bold',
                          textTransform: 'capitalize' 
                        }}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{new Date(user.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(user.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2>Manage Coupons</h2>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }} onClick={() => setIsCouponModalOpen(true)}>
                <Plus size={18} /> Add Coupon
              </button>
            </div>
            
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px' }}>
              <div className="mobile-table-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', fontWeight: 'bold', paddingBottom: '15px', borderBottom: 'var(--glass-border)', marginBottom: '15px' }}>
                <div>Code</div>
                <div>Discount</div>
                <div>Limit</div>
                <div>Status</div>
                <div>Action</div>
              </div>
              
              {coupons.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No coupons created yet.</p>
              ) : (
                coupons.map(coupon => (
                  <div key={coupon._id} className="mobile-table-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary-accent)' }}>{coupon.code}</div>
                    <div>{coupon.discountType === 'flat' ? `৳${coupon.discountPercent}` : `${coupon.discountPercent}%`} Off</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {coupon.usageLimit ? `${coupon.usageCount || 0} / ${coupon.usageLimit}` : 'Unlimited'}
                    </div>
                    <div>
                      <span style={{ 
                        backgroundColor: coupon.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: coupon.isActive ? '#10B981' : '#EF4444', 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' 
                      }}>
                        {coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggleCoupon(coupon)} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${coupon.isActive ? '#EF4444' : '#10B981'}`, backgroundColor: 'transparent', color: coupon.isActive ? '#EF4444' : '#10B981', cursor: 'pointer', fontSize: '0.8rem' }}>
                        {coupon.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => setCouponToDelete(coupon._id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #EF4444', backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 style={{ marginBottom: '30px' }}>Order History (Sales)</h2>
            
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px' }}>
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No orders found.</p>
              ) : (
                orders.slice().reverse().map(order => (
                  <div key={order._id} className="mobile-table-row" style={{ padding: '15px 0', borderBottom: '1px solid var(--border-color)', gridTemplateColumns: '1fr 1.5fr 2fr 1fr', gap: '15px', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleTimeString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>ID: {order._id.replace('order_', '').substring(0, 8).toUpperCase()}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: '500' }}>{order.userId === 'guest' ? 'Guest' : order.userId}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        Email: {order.customerDetails?.email || 'N/A'}<br/>
                        Phone: {order.customerDetails?.phone || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>via {order.paymentMethod}</div>
                      {order.paymentDetails && order.paymentDetails.accountInfo && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', marginTop: '2px' }}>
                          Acc: {order.paymentDetails.accountInfo} | TrxID: {order.paymentDetails.transactionId}
                        </div>
                      )}
                      {order.customerDetails?.note && (
                        <div style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '5px', fontStyle: 'italic', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          Note: {order.customerDetails.note}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {order.items ? (
                        order.items.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '10px' }}>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.productName} (x{item.quantity})</div>
                            {item.keys.map((k, i) => (
                              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--primary-accent)', fontFamily: 'monospace', paddingLeft: '10px', borderLeft: '2px solid var(--border-color)', marginTop: '2px', wordBreak: 'break-all' }}>{k}</div>
                            ))}
                          </div>
                        ))
                      ) : (
                        // Legacy single item format support
                        <>
                          <div style={{ fontWeight: '500' }}>{order.productName || 'Unknown Product'}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--primary-accent)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{order.soldKey}</div>
                        </>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#10B981', fontSize: '1.2rem' }}>
                        ৳ {order.totalPrice || order.price}
                      </div>
                      {order.couponApplied && (
                        <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '5px' }}>
                          Coupon: {order.couponApplied.code} (-৳ {order.couponApplied.discountAmount})
                        </div>
                      )}
                      
                      <div style={{ marginTop: '10px' }}>
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

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <select 
                          value={order.status || 'pending'} 
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer', fontWeight: '500' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="complete">Complete</option>
                          <option value="cancel">Cancel</option>
                        </select>
                        <button onClick={() => setOrderToDelete(order._id)} style={{ padding: '8px 12px', fontSize: '0.85rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="animate-fade-in responsive-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <div className="glass-panel" style={{ padding: '20px', minHeight: '500px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Support Tickets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tickets.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No tickets found</p>
                ) : (
                  tickets.slice().reverse().map(ticket => (
                    <div 
                      key={ticket._id} 
                      onClick={() => setActiveTicket(ticket)}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        backgroundColor: activeTicket && activeTicket._id === ticket._id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-color)',
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
                        {ticket.userEmail}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
              {!activeTicket ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  Select a ticket to view
                </div>
              ) : (
                <>
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{activeTicket.subject}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        From: {activeTicket.userName} ({activeTicket.userEmail})
                        {activeTicket.userPhone && activeTicket.userPhone !== 'N/A' && <span> | Phone: {activeTicket.userPhone}</span>}
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
                  
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {activeTicket.conversation.map((msg, idx) => (
                      <div key={idx} style={{ 
                        alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.sender === 'admin' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                          backgroundColor: msg.sender === 'admin' ? 'var(--primary-accent)' : 'var(--bg-color)',
                          color: msg.sender === 'admin' ? 'white' : 'var(--text-primary)',
                          border: msg.sender === 'user' ? '1px solid var(--border-color)' : 'none',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '5px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                          {msg.sender === 'admin' ? 'You (Admin)' : activeTicket.userName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                    <form onSubmit={handleReplyTicket} style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        disabled={activeTicket.status === 'closed'}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} 
                      />
                      <button type="submit" className="btn-primary" disabled={!replyText.trim() || activeTicket.status === 'closed'} style={{ padding: '12px 20px' }}>
                        Send
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ marginBottom: '30px' }}>Admin Account Settings</h2>
            
            {message && <div style={{ backgroundColor: message.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.includes('success') ? '#10B981' : '#EF4444', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}

            <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', maxWidth: '500px' }}>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Admin Name</label>
                  <input type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Admin Email Address</label>
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
                  <Save size={18} /> {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Payment Accounts / Addresses</h2>
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', maxWidth: '500px' }}>
              <form onSubmit={handleUpdatePaymentSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>bKash Number</label>
                  <input type="text" value={paymentMethods.bkash} onChange={e => setPaymentMethods({...paymentMethods, bkash: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nagad Number</label>
                  <input type="text" value={paymentMethods.nagad} onChange={e => setPaymentMethods({...paymentMethods, nagad: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rocket Number</label>
                  <input type="text" value={paymentMethods.rocket} onChange={e => setPaymentMethods({...paymentMethods, rocket: e.target.value})} placeholder="e.g. 01700000000-1" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upay Number</label>
                  <input type="text" value={paymentMethods.upay} onChange={e => setPaymentMethods({...paymentMethods, upay: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bybit Pay (Email or UID)</label>
                  <input type="text" value={paymentMethods.bybit} onChange={e => setPaymentMethods({...paymentMethods, bybit: e.target.value})} placeholder="e.g. user@example.com or 12345678" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Binance Pay ID / UID</label>
                  <input type="text" value={paymentMethods.binance} onChange={e => setPaymentMethods({...paymentMethods, binance: e.target.value})} placeholder="e.g. 123456789" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <button type="submit" className="btn-primary" disabled={paymentSettingsLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                  <Save size={18} /> {paymentSettingsLoading ? 'Saving...' : 'Save Payment Accounts'}
                </button>
              </form>
            </div>
            
            <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Website Banners (Below Top Bar)</h2>
            <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', maxWidth: '800px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Add image banners that link to specific URLs.</p>
                <button onClick={handleAddBanner} className="btn-primary" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={16} /> Add Banner
                </button>
              </div>

              {banners.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No banners configured yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {banners.map((banner, index) => (
                    <div key={banner.id || index} style={{ padding: '20px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      <div style={{ width: '150px', height: '80px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No Image</span>
                        )}
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Image URL</label>
                          <input type="text" value={banner.imageUrl} onChange={e => handleUpdateBanner(banner.id || index, 'imageUrl', e.target.value)} placeholder="https://example.com/banner.png" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Target Link (Optional)</label>
                          <input type="text" value={banner.targetUrl} onChange={e => handleUpdateBanner(banner.id || index, 'targetUrl', e.target.value)} placeholder="https://example.com/promo" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                        <button onClick={() => handleRemoveBanner(banner.id || index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                          <X size={16} /> Remove
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <input type="checkbox" checked={banner.isActive !== false} onChange={e => handleUpdateBanner(banner.id || index, 'isActive', e.target.checked)} style={{ cursor: 'pointer' }} />
                          Active
                        </label>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleUpdatePaymentSettings} className="btn-primary" disabled={paymentSettingsLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                    <Save size={18} /> {paymentSettingsLoading ? 'Saving...' : 'Save Banners Configuration'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
