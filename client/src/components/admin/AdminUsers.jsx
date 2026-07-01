import React, { useState } from 'react';
import ActionMenu from '../ActionMenu';
import { UserCheck, UserX, Search } from 'lucide-react';

const AdminUsers = ({ users, orders, handleUpdateRole, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <h2 style={{ marginBottom: '30px' }}>Manage Users</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', minWidth: '150px' }}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
        <div className="mobile-table-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) 50px', gap: '15px', fontWeight: 'bold', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px', minWidth: '800px' }}>
          <div>User</div>
          <div>Contact Details</div>
          <div>Stats</div>
          <div>Role</div>
          <div></div>
        </div>
        
        {filteredUsers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No users found.</p>
        ) : (
          filteredUsers.map(user => {
            const userOrders = orders.filter(o => o.userId === user._id || (o.customerDetails && o.customerDetails.email === user.email));
            const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalPrice || o.price) || 0), 0);
            
            return (
            <div key={user._id} className="mobile-table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) 50px', gap: '15px', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)', minWidth: '800px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <strong style={{ display: 'block' }}>{user.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user._id.substring(0, 8)}...</span>
                </div>
              </div>
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div>{user.email}</div>
                {user.phone && <div>{user.phone}</div>}
              </div>
              
              <div style={{ fontSize: '0.9rem' }}>
                <div>Orders: {userOrders.length}</div>
                <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>Spent: ৳ {totalSpent}</div>
              </div>
              
              <div>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  backgroundColor: user.role === 'owner' ? 'rgba(245, 158, 11, 0.2)' : user.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  color: user.role === 'owner' ? '#F59E0B' : user.role === 'admin' ? '#10B981' : 'var(--primary-accent)'
                }}>
                  {user.role}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {(currentUser?.role === 'admin' && user.role === 'owner') ? null : (
                  <ActionMenu actions={[
                    ...(currentUser?.role === 'owner' ? [
                      ...(user.role !== 'owner' ? [{
                        label: 'Make Owner',
                        icon: <UserCheck size={16} />,
                        onClick: () => handleUpdateRole(user._id, 'owner')
                      }] : []),
                      ...(user.role !== 'admin' ? [{
                        label: 'Make Admin',
                        icon: <UserCheck size={16} />,
                        onClick: () => handleUpdateRole(user._id, 'admin')
                      }] : []),
                      ...(user.role !== 'customer' ? [{
                        label: 'Make Customer',
                        icon: <UserX size={16} />,
                        onClick: () => handleUpdateRole(user._id, 'customer')
                      }] : [])
                    ] : [
                      { 
                        label: user.role === 'admin' ? 'Remove Admin' : 'Make Admin', 
                        icon: user.role === 'admin' ? <UserX size={16} /> : <UserCheck size={16} />, 
                        onClick: () => handleUpdateRole(user._id, user.role === 'admin' ? 'customer' : 'admin')
                      }
                    ])
                  ]} />
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
