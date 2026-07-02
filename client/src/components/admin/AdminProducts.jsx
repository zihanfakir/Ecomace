import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';
import ActionMenu from '../ActionMenu';

const AdminProducts = ({ products, handleEditClick, setProductToDelete, handleOpenAddModal, handleSetCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    let matchesStock = true;
    const stockCount = product.stockKeys?.length || 0;
    
    if (stockFilter === 'in_stock') matchesStock = stockCount > 0;
    else if (stockFilter === 'out_of_stock') matchesStock = stockCount === 0;
    else if (stockFilter === 'low_stock') matchesStock = stockCount > 0 && stockCount <= 5;
    else if (stockFilter === 'high_stock') matchesStock = stockCount > 5;

    return matchesSearch && matchesStock;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Manage Digital Licenses</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }} onClick={handleOpenAddModal}>
          <Plus size={18} /> Add New Product
        </button>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search products by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>
        <select 
          value={stockFilter} 
          onChange={(e) => setStockFilter(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', minWidth: '150px' }}
        >
          <option value="all">All Products</option>
          <option value="in_stock">In Stock (&gt;0)</option>
          <option value="low_stock">Low Stock (1-5)</option>
          <option value="high_stock">High Stock (&gt;5)</option>
          <option value="out_of_stock">Out of Stock (0)</option>
        </select>
      </div>
      
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px' }}>
        <div className="mobile-table-header" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr', fontWeight: 'bold', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: '15px' }}>
          <div>Image/Icon</div>
          <div>Product Name</div>
          <div>Stock</div>
          <div>Price</div>
          <div>Actions</div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No products found.</p>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="mobile-table-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr 0.5fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', flexShrink: 0 }}>
                {product.photoUrl ? <img src={product.photoUrl} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : product.icon}
              </div>
              <div>
                {product.name}
                {product.category && product.category !== 'Uncategorized' && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> {product.category}
                  </div>
                )}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ActionMenu actions={[
                  { label: 'Edit Product', icon: <Edit size={16} />, onClick: () => handleEditClick(product) },
                  { label: 'Set Category', icon: <Tag size={16} />, onClick: () => handleSetCategory(product) },
                  { label: 'Delete Product', icon: <Trash2 size={16} />, onClick: () => setProductToDelete(product._id), danger: true }
                ]} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
