import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Tag, Package, X, History, Save, MessageSquare, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { useToast } from '../context/ToastContext';
import AdminProducts from './admin/AdminProducts';
import AdminUsers from './admin/AdminUsers';
import AdminCoupons from './admin/AdminCoupons';
import AdminOrders from './admin/AdminOrders';
import AdminSupport from './admin/AdminSupport';
import AdminSettings from './admin/AdminSettings';
import AdminTracking from './admin/AdminTracking';
import ActionMenu from './ActionMenu';
import { uploadToImgBB } from '../utils/imageUtils';

const AdminDashboard = () => {
  const { user, token, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', category: 'Uncategorized', keys: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: '', discountType: 'percent', usageLimit: '', applicableType: 'all', applicableTo: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  
  // Category Modal State
  const [categoryModalProduct, setCategoryModalProduct] = useState(null);
  const [categoryModalInput, setCategoryModalInput] = useState('');
  
  // Settings state
  const [paymentMethods, setPaymentMethods] = useState({ bkash: '', nagad: '', rocket: '', upay: '', bybit: '', binance: '' });
  const [banners, setBanners] = useState([]);
  const [siteTextSettings, setSiteTextSettings] = useState({
    footerText: '© ২০২৬ জিহান ফকির (Zihan Fakir)। সর্বস্বত্ব সংরক্ষিত।',
    telegramLink: 'https://t.me/zihanfakir',
    whatsappLink: 'https://wa.me/8801700000000',
    noticeText: '',
    noticeColor: 'blue'
  });
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

    // Polling for new orders every 15 seconds
    const interval = setInterval(() => {
      fetchOrdersSilently();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrdersSilently = async () => {
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/orders');
      setOrders(prevOrders => {
        const newData = Array.isArray(response.data) ? response.data : [];
        if (prevOrders.length > 0 && newData.length > prevOrders.length) {
           addToast('🔔 New Order Received!', 'success');
           try {
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(e => {});
           } catch(e) {}
        }
        return newData;
      });
    } catch (error) {
      console.error('Error polling orders:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/settings', config);
      if (response.data?.paymentMethods) {
        setPaymentMethods(response.data.paymentMethods);
      }
      if (response.data?.banners) {
        setBanners(response.data.banners);
      }
      if (response.data?.footerText !== undefined || response.data?.telegramLink !== undefined || response.data?.whatsappLink !== undefined || response.data?.noticeText !== undefined) {
        setSiteTextSettings({
          footerText: response.data.footerText !== undefined ? response.data.footerText : '© ২০২৬ জিহান ফকির (Zihan Fakir)। সর্বস্বত্ব সংরক্ষিত।',
          telegramLink: response.data.telegramLink !== undefined ? response.data.telegramLink : 'https://t.me/zihanfakir',
          whatsappLink: response.data.whatsappLink !== undefined ? response.data.whatsappLink : 'https://wa.me/8801700000000',
          noticeText: response.data.noticeText || '',
          noticeColor: response.data.noticeColor || 'blue'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/products', config);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/users', config);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/orders', config);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/coupons', config);
      setCoupons(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
      const response = await axios.get('https://ecomace.onrender.com/api/messages', config);
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`https://ecomace.onrender.com/api/orders/${orderId}/status`, { status });
      fetchOrders();
      fetchProducts();
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
      fetchProducts();
      addToast('Order deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete order', 'error');
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (newCoupon.discountType === 'percent' && Number(newCoupon.discountPercent) > 100) {
      addToast('Percentage discount cannot exceed 100%', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('https://ecomace.onrender.com/api/coupons', newCoupon);
      setIsCouponModalOpen(false);
      setNewCoupon({ code: '', discountPercent: '', discountType: 'percent', usageLimit: '', applicableType: 'all', applicableTo: '' });
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
    if (newProduct.keys && newProduct.keys.includes('HIDDEN_KEY')) {
      addToast('Cannot save! Your session is unauthorized to see real keys. Please refresh the page.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      if (editingProductId) {
        // Edit existing product
        await axios.put(`https://ecomace.onrender.com/api/products/${editingProductId}`, newProduct, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : undefined
          }
        });
      } else {
        // Add new product
        await axios.post('https://ecomace.onrender.com/api/products', newProduct, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : undefined
          }
        });
      }
      setIsModalOpen(false);
      setEditingProductId(null);
      setNewProduct({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', category: 'Uncategorized', keys: '' });
      fetchProducts();
      addToast(editingProductId ? 'Product updated successfully' : 'Product added successfully', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || (editingProductId ? 'Failed to edit product' : 'Failed to add product');
      addToast(errorMsg, 'error');
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
      category: product.category || 'Uncategorized',
      keys: product.stockKeys ? product.stockKeys.join('\n') : ''
    });
    setEditingProductId(product._id);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setNewProduct({ name: '', description: '', bigDescription: '', price: '', icon: '🔑', photoUrl: '', discount: '', discountType: 'percent', category: 'Uncategorized', keys: '' });
    setIsModalOpen(true);
  };

  const handleSetCategory = (product) => {
    setCategoryModalProduct(product);
    setCategoryModalInput(product.category === 'Uncategorized' ? '' : (product.category || ''));
  };

  const submitCategoryModal = async () => {
    if (!categoryModalProduct) return;
    try {
      // H-4: Only send the category field — avoid stale client-state overwriting server stock
      await axios.put(`https://ecomace.onrender.com/api/products/${categoryModalProduct._id}`, { 
        category: categoryModalInput || 'Uncategorized'
      }, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined
        }
      });
      fetchProducts();
      addToast('Category updated successfully', 'success');
      setCategoryModalProduct(null);
    } catch (error) {
      addToast('Failed to update category', 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage('');
    try {
      // H-2: Strip empty password before sending to avoid unnecessary over-the-wire exposure
      const payload = { ...profileData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      const response = await axios.put(`https://ecomace.onrender.com/api/users/${user._id}`, payload);
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
    e?.preventDefault();
    setPaymentSettingsLoading(true);
    try {
      await axios.put('https://ecomace.onrender.com/api/settings', { 
        paymentMethods, banners, 
        footerText: siteTextSettings.footerText, 
        telegramLink: siteTextSettings.telegramLink,
        whatsappLink: siteTextSettings.whatsappLink,
        noticeText: siteTextSettings.noticeText,
        noticeColor: siteTextSettings.noticeColor
      });
      addToast('Settings updated successfully', 'success');
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
      await axios.put(`https://ecomace.onrender.com/api/users/${userId}`, { role: newRole, requesterId: user._id });
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{editingProductId ? 'Edit Product' : 'Add License/Account Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
              <input list="product-names" type="text" placeholder="Product Name (e.g. Canva Pro 1 Month)" required value={newProduct.name} onChange={e => {
                const val = e.target.value;
                const existingProd = products.find(p => p.name === val);
                if(existingProd && !editingProductId) {
                  setNewProduct(prev => ({ ...prev, name: val, description: existingProd.description, category: existingProd.category || 'Uncategorized', bigDescription: existingProd.bigDescription, price: existingProd.price, discount: existingProd.discount, discountType: existingProd.discountType, photoUrl: existingProd.photoUrl, icon: existingProd.icon }));
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
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <input list="category-names" type="text" placeholder="Category (e.g. Software, Games)" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                <datalist id="category-names">
                  {[...new Set(products.map(p => p.category || 'Uncategorized'))].map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>
              
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Product Photo URL (or upload)" value={newProduct.photoUrl} onChange={e => setNewProduct({...newProduct, photoUrl: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-accent)', color: 'white', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
                  Upload
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          addToast('Uploading product image...', 'info');
                          const url = await uploadToImgBB(file, 800, 0.7);
                          // M-1: Functional updater avoids stale closure over newProduct
                          setNewProduct(prev => ({...prev, photoUrl: url}));
                          addToast('Image uploaded successfully', 'success');
                        } catch (error) {
                          console.error('Image upload failed', error);
                          const errorMsg = error.response?.data?.message || error.message || 'Failed to upload image';
                          addToast(errorMsg, 'error');
                        }
                      }
                    }}
                  />
                </label>
              </div>
              <input type="text" placeholder="Icon Emoji (Fallback, e.g. 🎨)" value={newProduct.icon} onChange={e => setNewProduct({...newProduct, icon: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Keys / Links / Accounts Stock (One per line)</label>
                <textarea 
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
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
              <div style={{ display: 'flex', gap: '5px' }}>
                <select value={newCoupon.applicableType} onChange={e => setNewCoupon({...newCoupon, applicableType: e.target.value, applicableTo: ''})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                  <option value="all">All Products</option>
                  <option value="category">Specific Category</option>
                  <option value="product">Specific Product</option>
                </select>
                {newCoupon.applicableType === 'category' && (
                  <select value={newCoupon.applicableTo} onChange={e => setNewCoupon({...newCoupon, applicableTo: e.target.value})} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required>
                    <option value="">Select Category</option>
                    {[...new Set(products.map(p => p.category))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                {newCoupon.applicableType === 'product' && (
                  <select value={newCoupon.applicableTo} onChange={e => setNewCoupon({...newCoupon, applicableTo: e.target.value})} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required>
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                )}
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ textAlign: 'center' }}>
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ textAlign: 'center' }}>
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
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ textAlign: 'center' }}>
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
        
        <button onClick={() => { setActiveTab('tracking'); setMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'tracking' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'tracking' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <TrendingUp size={18} /> Tracking & Analytics
        </button>
        <button onClick={() => { setActiveTab('products'); setMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'products' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'products' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Package size={18} /> Products
        </button>
        <button onClick={() => { setActiveTab('users'); setMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'users' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'users' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Users size={18} /> Users
        </button>
        <button onClick={() => { setActiveTab('coupons'); setMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'coupons' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'coupons' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Tag size={18} /> Coupons
        </button>
        <button onClick={() => { setActiveTab('history'); setMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'history' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <History size={18} /> Order History
        </button>
        
        <button onClick={() => setActiveTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', border: 'none', background: activeTab === 'settings' ? 'var(--primary-accent)' : 'transparent', color: activeTab === 'settings' ? '#fff' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
          <Settings size={18} /> Settings
        </button>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel dashboard-content" style={{ padding: '30px' }}>
        {activeTab === 'tracking' && (
          <AdminTracking 
            products={products}
            orders={orders}
            users={users}
          />
        )}
        {activeTab === 'products' && (
          <AdminProducts 
            products={products} 
            handleEditClick={handleEditClick} 
            setProductToDelete={setProductToDelete} 
            handleOpenAddModal={handleOpenAddModal} 
            handleSetCategory={handleSetCategory}
          />
        )}
        {activeTab === 'users' && (
          <AdminUsers 
            users={users} 
            orders={orders} 
            handleUpdateRole={handleUpdateRole} 
            currentUser={user}
          />
        )}
        {activeTab === 'coupons' && (
          <AdminCoupons 
            coupons={coupons} 
            products={products}
            setIsCouponModalOpen={setIsCouponModalOpen} 
            handleToggleCoupon={handleToggleCoupon} 
            setCouponToDelete={setCouponToDelete} 
          />
        )}
        {activeTab === 'history' && (
          <AdminOrders 
            orders={orders} 
            handleUpdateOrderStatus={handleUpdateOrderStatus} 
            setOrderToDelete={setOrderToDelete} 
            user={user}
          />
        )}
        
        {activeTab === 'settings' && (
          <AdminSettings 
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            handleUpdateProfile={handleUpdateProfile}
            profileLoading={profileLoading}
            message={message}
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            banners={banners}
            handleUpdateBanner={handleUpdateBanner}
            handleAddBanner={handleAddBanner}
            handleRemoveBanner={handleRemoveBanner}
            siteTextSettings={siteTextSettings}
            setSiteTextSettings={setSiteTextSettings}
            handleUpdatePaymentSettings={handleUpdatePaymentSettings}
            paymentSettingsLoading={paymentSettingsLoading}
          />
        )}
      </div>
      {/* Category Input Modal */}
      {categoryModalProduct && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-panel modal-content" style={{ position: 'relative' }}>
            <button onClick={() => setCategoryModalProduct(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Set Category</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem' }}>Enter category for: <strong>{categoryModalProduct.name}</strong></p>
            
            <input 
              type="text" 
              value={categoryModalInput} 
              onChange={(e) => setCategoryModalInput(e.target.value)}
              placeholder="e.g. 💻 Software" 
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') submitCategoryModal(); }}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setCategoryModalProduct(null)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={submitCategoryModal} className="btn-primary" style={{ padding: '10px 20px' }}>Save Category</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;