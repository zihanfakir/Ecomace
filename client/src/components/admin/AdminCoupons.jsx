import React from 'react';
import { Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import ActionMenu from '../ActionMenu';

const AdminCoupons = ({ coupons, products, setIsCouponModalOpen, handleToggleCoupon, setCouponToDelete }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Discount Coupons</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }} onClick={() => setIsCouponModalOpen(true)}>
          <Plus size={18} /> Add Coupon
        </button>
      </div>
      
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px' }}>
        <div className="mobile-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 0.5fr', fontWeight: 'bold', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
          <div>Coupon Code</div>
          <div>Discount</div>
          <div>Applies To</div>
          <div>Usage</div>
          <div>Status</div>
          <div></div>
        </div>
        
        {coupons.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No coupons created yet.</p>
        ) : (
          coupons.map(coupon => (
            <div key={coupon._id} className="mobile-table-row" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 0.5fr', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{coupon.code}</strong>
              </div>
              <div>
                <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary-accent)', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {coupon.discountPercent}{coupon.discountType === 'flat' ? '৳' : '%'} OFF
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {coupon.applicableType === 'product' ? `Product: ${products?.find(p => p._id === coupon.applicableTo)?.name || 'Unknown'}` : coupon.applicableType === 'category' ? `Category: ${coupon.applicableTo}` : 'All Products'}
                </span>
              </div>
              <div>
                {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
              </div>
              <div>
                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', backgroundColor: coupon.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: coupon.isActive ? '#10B981' : '#EF4444' }}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ActionMenu actions={[
                  { 
                    label: coupon.isActive ? 'Deactivate' : 'Activate', 
                    icon: coupon.isActive ? <PowerOff size={16} /> : <Power size={16} />, 
                    onClick: () => handleToggleCoupon(coupon)
                  },
                  { 
                    label: 'Delete', 
                    icon: <Trash2 size={16} />, 
                    onClick: () => setCouponToDelete(coupon._id), 
                    danger: true 
                  }
                ]} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
