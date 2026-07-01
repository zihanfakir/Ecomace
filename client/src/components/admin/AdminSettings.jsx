import React from 'react';
import { Save, Plus, Trash2, Power, PowerOff, X } from 'lucide-react';
import ActionMenu from '../ActionMenu';

const AdminSettings = ({ 
  user, profileData, setProfileData, handleUpdateProfile, profileLoading, message,
  paymentMethods, setPaymentMethods, banners, handleUpdateBanner, handleAddBanner, handleRemoveBanner,
  siteTextSettings, setSiteTextSettings, handleUpdatePaymentSettings, paymentSettingsLoading 
}) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '30px' }}>Settings</h2>
      
      {message && <div style={{ backgroundColor: message.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.includes('success') ? '#10B981' : '#EF4444', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Profile Settings */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Admin Profile</h3>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px' }}>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
                <input type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email Address</label>
                <input type="email" required value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Photo URL (Optional)</label>
                <input type="text" value={profileData.photoUrl} onChange={e => setProfileData({...profileData, photoUrl: e.target.value})} placeholder="https://example.com/image.png" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OR Upload Image:</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New Password (leave blank to keep current)</label>
                <input type="password" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                <Save size={18} /> {profileLoading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Payment Methods</h3>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Set your receiving account numbers for manual payments.</p>
            <form onSubmit={handleUpdatePaymentSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>bKash Number</label>
                <input type="text" value={paymentMethods.bkash} onChange={e => setPaymentMethods({...paymentMethods, bkash: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nagad Number</label>
                <input type="text" value={paymentMethods.nagad} onChange={e => setPaymentMethods({...paymentMethods, nagad: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rocket Number</label>
                <input type="text" value={paymentMethods.rocket} onChange={e => setPaymentMethods({...paymentMethods, rocket: e.target.value})} placeholder="e.g. 01700000000-1" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upay Number</label>
                <input type="text" value={paymentMethods.upay} onChange={e => setPaymentMethods({...paymentMethods, upay: e.target.value})} placeholder="e.g. 01700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bybit UID / Email</label>
                <input type="text" value={paymentMethods.bybit} onChange={e => setPaymentMethods({...paymentMethods, bybit: e.target.value})} placeholder="e.g. user@example.com or 12345678" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Binance Pay ID</label>
                <input type="text" value={paymentMethods.binance} onChange={e => setPaymentMethods({...paymentMethods, binance: e.target.value})} placeholder="e.g. 123456789" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={paymentSettingsLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                <Save size={18} /> {paymentSettingsLoading ? 'Saving...' : 'Save Payment Accounts'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>General Site Settings</h2>
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Footer Copyright Text</label>
            <input type="text" value={siteTextSettings?.footerText || ''} onChange={e => setSiteTextSettings({...siteTextSettings, footerText: e.target.value})} placeholder="© 2026 Your Name. All rights reserved." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Telegram Support Link / Username</label>
            <input type="text" value={siteTextSettings?.telegramLink || ''} onChange={e => setSiteTextSettings({...siteTextSettings, telegramLink: e.target.value})} placeholder="https://t.me/yourusername" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>WhatsApp Support Link / Number</label>
            <input type="text" value={siteTextSettings?.whatsappLink || ''} onChange={e => setSiteTextSettings({...siteTextSettings, whatsappLink: e.target.value})} placeholder="https://wa.me/8801700000000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
          </div>
          <button onClick={handleUpdatePaymentSettings} className="btn-primary" disabled={paymentSettingsLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', alignSelf: 'flex-start' }}>
            <Save size={18} /> {paymentSettingsLoading ? 'Saving...' : 'Save General Settings'}
          </button>
        </div>
      </div>
      
      {/* Website Banners Section */}
      <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Website Banners (Below Top Bar)</h2>
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '30px', borderRadius: '12px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
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
              <div key={banner.id || index} style={{ padding: '20px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Image Preview */}
                <div style={{ width: '150px', height: '80px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No Image</span>
                  )}
                </div>
                
                {/* Inputs stacked nicely */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                  <div>
                    <input type="text" value={banner.imageUrl} onChange={e => handleUpdateBanner(banner.id || index, 'imageUrl', e.target.value)} placeholder="Image URL (e.g. https://example.com/banner.png)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <input type="text" value={banner.targetUrl} onChange={e => handleUpdateBanner(banner.id || index, 'targetUrl', e.target.value)} placeholder="Target Link (e.g. https://example.com/promo)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {/* Status Indicator & Actions Menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', backgroundColor: banner.isActive !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: banner.isActive !== false ? '#10B981' : '#EF4444' }}>
                    {banner.isActive !== false ? 'Active' : 'Hidden'}
                  </span>
                  
                  <ActionMenu actions={[
                    { 
                      label: banner.isActive !== false ? 'Hide Banner' : 'Show Banner', 
                      icon: banner.isActive !== false ? <PowerOff size={16} /> : <Power size={16} />, 
                      onClick: () => handleUpdateBanner(banner.id || index, 'isActive', banner.isActive === false)
                    },
                    { 
                      label: 'Remove Banner', 
                      icon: <Trash2 size={16} />, 
                      onClick: () => handleRemoveBanner(banner.id || index), 
                      danger: true 
                    }
                  ]} />
                </div>
              </div>
            ))}
            
            <button onClick={handleUpdatePaymentSettings} className="btn-primary" disabled={paymentSettingsLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', alignSelf: 'flex-start' }}>
              <Save size={18} /> {paymentSettingsLoading ? 'Saving...' : 'Save Banners Configuration'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
