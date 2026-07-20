import React, { useState, useEffect } from 'react';
import { Trash2, Search, Filter, Edit, X } from 'lucide-react';
import ActionMenu from '../ActionMenu';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const AdminOrders = ({ orders, handleUpdateOrderStatus, setOrderToDelete, user, fetchOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrderKeys, setEditingOrderKeys] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const { addToast } = useToast();

  const handleSaveKeys = async () => {
    try {
      setIsSavingKeys(true);
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL || 'https://ecomace-9ntk.vercel.app'}/api/orders/${editingOrderKeys}/keys`, { items: editedItems }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Order keys updated successfully', 'success');
      setEditingOrderKeys(null);
      if (fetchOrders) fetchOrders();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update keys', 'error');
    } finally {
      setIsSavingKeys(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  const filteredOrders = orders.filter(order => {
    // BUG-034 FIX: Also search by customer name, not just ID and email
    const matchesSearch = (
      order._id.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      (order.customerDetails?.email || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (order.customerDetails?.phone || '').includes(debouncedSearch)
    );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h2 style={{ marginBottom: '30px' }}>Order History</h2>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search orders by ID or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ position: 'relative', flex: '0 1 200px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', cursor: 'pointer', boxSizing: 'border-box' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
        <div className="mobile-table-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(150px, 1fr) minmax(100px, 1fr) 50px', gap: '15px', fontWeight: 'bold', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px', minWidth: '850px' }}>
          <div>Order ID</div>
          <div>Customer</div>
          <div>Items</div>
          <div>Status</div>
          <div>Total</div>
          <div></div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No orders found.</p>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="mobile-table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(200px, 2fr) minmax(150px, 1fr) minmax(100px, 1fr) 50px', gap: '15px', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)', minWidth: '850px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <br />
                <strong style={{ fontSize: '0.9rem' }}>#{order._id.substring(order._id.length - 6).toUpperCase()}</strong>
              </div>
              
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{order.customerDetails?.email || 'N/A'}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{order.customerDetails?.phone || 'N/A'}</span>
                <br />
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-accent)' }}>{order.paymentMethod?.toUpperCase() || 'N/A'} {order.paymentMethod === 'binance' || order.paymentMethod === 'bybit' ? '' : '- ' + (order.paymentDetails?.transactionId || 'N/A')}</span>
              </div>
              
              <div style={{ fontSize: '0.85rem' }}>
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>{item.quantity}x</span> {item.productName || item.name || 'Unknown Item'}
                    </div>
                    {item.keys && item.keys.length > 0 && (
                      <div style={{ marginLeft: '10px', marginTop: '2px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        Keys: {item.keys.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <select 
                  value={order.status} 
                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                  style={{ 
                    padding: '6px 10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)', 
                    backgroundColor: (order.status === 'completed' || order.status === 'approved') ? 'rgba(16, 185, 129, 0.1)' : order.status === 'processing' ? 'rgba(59, 130, 246, 0.1)' : order.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    color: (order.status === 'completed' || order.status === 'approved') ? '#10B981' : order.status === 'processing' ? '#3B82F6' : order.status === 'pending' ? '#F59E0B' : '#EF4444',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '130px'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                ৳ {order.totalPrice || order.price || 0}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ActionMenu actions={[
                  {
                    label: 'Edit Keys/Links',
                    icon: <Edit size={16} />,
                    onClick: () => {
                      setEditingOrderKeys(order._id);
                      setEditedItems(order.items.map(item => ({ ...item, keysStr: item.keys ? item.keys.join('\n') : '' })));
                    }
                  },
                  ...(user?.role === 'owner' ? [{ 
                    label: 'Delete Order', 
                    icon: <Trash2 size={16} />, 
                    onClick: () => setOrderToDelete(order._id), 
                    danger: true 
                  }] : [])
                ]} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Keys Modal */}
      {editingOrderKeys && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Edit Order Keys</h2>
              <button onClick={() => setEditingOrderKeys(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {editedItems.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary-accent)' }}>{item.productName} (x{item.quantity})</div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Keys / Links (One per line)</label>
                  <textarea 
                    rows={4}
                    value={item.keysStr}
                    onChange={(e) => {
                      const newItems = [...editedItems];
                      newItems[idx].keysStr = e.target.value;
                      newItems[idx].keys = e.target.value.split('\n').map(k => k.trim()).filter(k => k);
                      setEditedItems(newItems);
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setEditingOrderKeys(null)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleSaveKeys} className="btn-primary" disabled={isSavingKeys} style={{ padding: '10px 20px' }}>
                {isSavingKeys ? 'Saving...' : 'Save Keys'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
