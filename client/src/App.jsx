import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sun, Moon, ShoppingBag, Menu, X, User, Bell, BellRing } from 'lucide-react';
import axios from 'axios';
import './index.css';

import Home from './components/Home';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import ProductDetails from './components/ProductDetails';
import Auth from './components/Auth';
import CustomerDashboard from './components/CustomerDashboard';
import Cart from './components/Cart';
import ChatWidget from './components/ChatWidget';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider, CartContext } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { useContext, useRef } from 'react';

const NotificationBell = () => {
  const { user, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user || !token) return;
    try {
      const response = await axios.get('https://ecomace.onrender.com/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      await axios.put(`https://ecomace.onrender.com/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await axios.put('https://ecomace.onrender.com/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {unreadCount > 0 ? <BellRing size={24} color="#EF4444" /> : <Bell size={24} />}
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute', top: '120%', right: '-50px', width: '320px', maxHeight: '400px', overflowY: 'auto',
          zIndex: 1000, padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}>Mark all read</button>
            )}
          </div>
          
          {safeNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No notifications yet</div>
          ) : (
            safeNotifications.map((n) => (
              <Link 
                to={n.link || '#'}
                key={n._id} 
                onClick={() => { 
                  if (!n.read) markAsRead(n._id);
                  setIsOpen(false);
                }}
                style={{ 
                  padding: '10px', 
                  borderRadius: '8px', 
                  backgroundColor: n.read ? 'transparent' : 'rgba(67, 24, 255, 0.1)',
                  border: n.read ? '1px solid var(--border-color)' : '1px solid var(--primary-accent)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  textDecoration: 'none',
                  display: 'block',
                  color: 'inherit'
                }}
              >
                <div style={{ fontSize: '0.9rem', marginBottom: '5px', fontWeight: n.read ? '400' : '500' }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  {!n.read && <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>New</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const StoreLayout = ({ theme, toggleTheme, siteSettings }) => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get('https://ecomace.onrender.com/api/settings');
        if (response.data?.banners) {
          setBanners(response.data.banners.filter(b => b.isActive !== false));
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err);
      }
    };
    fetchBanners();
  }, []);

  // Banner slider effect
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // 5 seconds
    
    return () => clearInterval(interval);
  }, [banners.length]);
  
  const getNoticeBgColor = () => {
    switch(siteSettings?.noticeColor) {
      case 'red': return '#EF4444';
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'blue': 
      default: return 'var(--primary-accent)';
    }
  };

  const hasEmoji = siteSettings?.noticeText ? /\p{Extended_Pictographic}/u.test(siteSettings.noticeText) : false;

  return (
  <div className="app-container">
    {siteSettings?.noticeText && (
      <div style={{ backgroundColor: getNoticeBgColor(), color: 'white', padding: '10px 0', fontSize: '0.9rem', fontWeight: '500', position: 'relative', zIndex: 50, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div className="notice-marquee">
          {!hasEmoji && <span>✨</span>} <span style={{ margin: '0 8px' }}>{siteSettings.noticeText}</span> {!hasEmoji && <span>✨</span>}
        </div>
      </div>
    )}
    <nav className="glass-panel navbar-container" style={{ margin: '10px 20px', padding: '8px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'sticky', top: '10px', zIndex: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="Ecomace Logo" style={{ height: '35px', objectFit: 'contain' }} />
            <h2 style={{ color: 'var(--primary-accent)', margin: 0 }}>Ecomace</h2>
          </div>
        </Link>
        
        <div className="desktop-nav-items" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Link to={(user.role === 'admin' || user.role === 'owner') ? '/admin' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-accent)' }}>
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-accent)', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {(user.role === 'admin' || user.role === 'owner') ? 'Admin Panel' : 'My Dashboard'}
              </Link>
              <button onClick={logout} style={{ background: 'var(--surface-color)', border: 'var(--glass-border)', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>Logout</button>
            </div>
          ) : (
            <Link to="/auth" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500', backgroundColor: 'var(--surface-color)', padding: '8px 15px', borderRadius: '8px', border: 'var(--glass-border)' }}>Login</Link>
          )}

          <Link to="/cart" style={{ position: 'relative', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            <ShoppingBag size={24} />
            {getCartCount() > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {getCartCount()}
              </span>
            )}
          </Link>
          <button 
            onClick={toggleTheme} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', backgroundColor: 'var(--surface-color)' }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="mobile-menu-btn" style={{ display: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {user ? (
              <Link to={(user.role === 'admin' || user.role === 'owner') ? '/admin' : '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', display: 'flex' }}>
                <User size={24} />
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500', fontSize: '14px', background: 'var(--surface-color)', padding: '5px 10px', borderRadius: '8px', border: 'var(--glass-border)' }}>Login</Link>
            )}
            


            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'relative', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={24} />
              {getCartCount() > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {getCartCount()}
                </span>
              )}
            </Link>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex' }}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu-dropdown" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)', marginTop: '10px' }}>
          {user && (
            <>
              <Link to={(user.role === 'admin' || user.role === 'owner') ? '/admin' : '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500', padding: '10px', background: 'var(--surface-color)', borderRadius: '8px' }}>
                {(user.role === 'admin' || user.role === 'owner') ? 'Admin Panel' : 'My Dashboard'}
              </Link>
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} style={{ background: 'var(--surface-color)', border: 'var(--glass-border)', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', fontWeight: '500' }}>Logout</button>
            </>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
            <span style={{fontWeight: '500'}}>Toggle Theme</span>
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%', backgroundColor: 'var(--surface-color)' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      )}
    </nav>

    {location.pathname === '/' && banners.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px', marginTop: '15px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '1200px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)' }}>
            {banners.map((banner, idx) => {
              const isActive = idx === currentBannerIndex;
              const content = (
                <img src={banner.imageUrl} alt={`Promo Banner ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              );
              
              const wrapStyle = {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive ? 1 : 0,
                visibility: isActive ? 'visible' : 'hidden',
                transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
                zIndex: isActive ? 10 : 1
              };

              return (
                <div key={idx} style={wrapStyle}>
                  {banner.targetUrl ? (
                    <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                      {content}
                    </a>
                  ) : (
                    <div style={{ width: '100%', height: '100%' }}>
                      {content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Dots Indicator — placed OUTSIDE the overflow:hidden container to prevent clipping */}
          {banners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: idx === currentBannerIndex ? 'var(--primary-accent)' : 'rgba(128, 128, 128, 0.4)',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    <main className="main-content">
      <Outlet />
    </main>
    <div style={{ textAlign: 'center', padding: '30px 20px', borderTop: '1px solid var(--glass-border)', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        {siteSettings?.footerText}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>POWERED BY</span>
        <img src="/zihan.png" alt="Powered by Zihan" style={{ height: '45px', objectFit: 'contain' }} />
      </div>
    </div>
  </div>
  );
};

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== 'admin' && user.role !== 'owner') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedCustomerRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  return children;
};

const AdminLayout = ({ theme, toggleTheme, siteSettings }) => {
  const { logout } = useContext(AuthContext);
  return (
  <div className="app-container" style={{ minHeight: '100vh' }}>
    <nav style={{ padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', borderBottom: 'var(--glass-border)' }}>
      <h2 style={{ color: 'var(--primary-accent)', margin: 0 }}>Ecomace Admin Center</h2>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>View Store</Link>
        <button onClick={logout} style={{ background: 'var(--surface-color)', border: 'var(--glass-border)', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>Logout</button>
        <button 
          onClick={toggleTheme} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '50%' }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </nav>
    <main style={{ padding: '0', flex: 1 }}>
      <ProtectedAdminRoute>
        <Outlet />
      </ProtectedAdminRoute>
    </main>
    <div style={{ textAlign: 'center', padding: '30px 20px', borderTop: '1px solid var(--glass-border)', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        {siteSettings?.footerText}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>POWERED BY</span>
        <img src="/zihan.png" alt="Powered by Zihan" style={{ height: '45px', objectFit: 'contain' }} />
      </div>
    </div>
  </div>
  );
};

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  const [siteSettings, setSiteSettings] = useState({
    footerText: '© ২০২৬ জিহান ফকির (Zihan Fakir)। সর্বস্বত্ব সংরক্ষিত।',
    telegramLink: 'https://t.me/zihanfakir',
    whatsappLink: 'https://wa.me/8801700000000'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('https://ecomace.onrender.com/api/settings');
        if (response.data) {
          setSiteSettings(prev => ({
            ...prev,
            footerText: response.data.footerText || prev.footerText,
            telegramLink: response.data.telegramLink || prev.telegramLink,
            whatsappLink: response.data.whatsappLink || prev.whatsappLink,
            noticeText: response.data.noticeText || '',
            noticeColor: response.data.noticeColor || 'blue'
          }));
        }
      } catch(err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Customer Storefront Routes */}
              <Route element={<StoreLayout theme={theme} toggleTheme={toggleTheme} siteSettings={siteSettings} />}>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<ProtectedCustomerRoute><CustomerDashboard /></ProtectedCustomerRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

            {/* Separate Admin Routes */}
            <Route path="/admin" element={<AdminLayout theme={theme} toggleTheme={toggleTheme} siteSettings={siteSettings} />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Routes>
          <ChatWidget siteSettings={siteSettings} />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
