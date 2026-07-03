import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, PackageOpen, Users, ShoppingCart, Clock, Package, CheckCircle2 } from 'lucide-react';

const AdminTracking = ({ products, orders, users }) => {
  // Calculate Total Sales Revenue (Approved Orders)
  const totalSales = useMemo(() => {
    return orders
      .filter(o => o.status === 'approved' || o.status === 'completed')
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  }, [orders]);

  // Calculate Pending Revenue (Pending Orders)
  const pendingRevenue = useMemo(() => {
    return orders
      .filter(o => o.status === 'pending')
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  }, [orders]);

  // Calculate Stock Value (Value of unsold items)
  const stockValue = useMemo(() => {
    return products.reduce((sum, product) => {
      const stockCount = product.stockKeys ? product.stockKeys.length : 0;
      let finalPrice = product.price;
      if (product.discount > 0) {
        if (product.discountType === 'flat') {
          finalPrice = Math.max(0, product.price - product.discount);
        } else {
          finalPrice = Math.max(0, Math.round(product.price - (product.price * (product.discount / 100))));
        }
      }
      return sum + (finalPrice * stockCount);
    }, 0);
  }, [products]);

  // Calculate Total Available Keys
  const totalStockKeys = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.stockKeys ? product.stockKeys.length : 0), 0);
  }, [products]);

  // Calculate Total Products
  const totalProducts = products.length;

  // Calculate Products In Stock (Products that have at least 1 key)
  const productsInStock = useMemo(() => {
    return products.filter(product => product.stockKeys && product.stockKeys.length > 0).length;
  }, [products]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <TrendingUp size={32} color="var(--primary-accent)" />
        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Business Tracking & Analytics</h2>
      </div>

      <div className="responsive-grid grid-3" style={{ gap: '20px', marginBottom: '40px' }}>
        {/* Total Sales */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <DollarSign size={32} color="#10B981" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Total Approved Sales</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>৳ {totalSales.toLocaleString()}</div>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #F59E0B', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <Clock size={32} color="#F59E0B" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Pending Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>৳ {pendingRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Stock Value */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <PackageOpen size={32} color="#8B5CF6" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Current Stock Value</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>৳ {stockValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #3B82F6', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <ShoppingCart size={32} color="#3B82F6" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Total Orders</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{orders.length}</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #EC4899', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
            <Users size={32} color="#EC4899" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Registered Users</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{users.length}</div>
          </div>
        </div>

        {/* Total Stock Keys */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #14B8A6', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(20, 184, 166, 0.1)' }}>
            <PackageOpen size={32} color="#14B8A6" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Total Keys in Stock</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalStockKeys}</div>
          </div>
        </div>

        {/* Total Products */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #F43F5E', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.1)' }}>
            <Package size={32} color="#F43F5E" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Total Products Listed</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalProducts}</div>
          </div>
        </div>

        {/* Products In Stock */}
        <div className="glass-panel" style={{ padding: '25px', borderLeft: '4px solid #22C55E', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <CheckCircle2 size={32} color="#22C55E" />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>Products In Stock</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{productsInStock}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTracking;
