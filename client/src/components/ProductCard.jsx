import React, { useContext } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  return (
    <div className="glass-panel product-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {product.discount > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#EF4444', color: 'white', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
          -{product.discount}{product.discountType === 'flat' ? '৳' : '%'} OFF
        </div>
      )}
      
      <div 
        onClick={() => navigate(`/product/${product._id}`)}
        style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
      >
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '3rem' }}>{product.icon || '📦'}</span>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
        <div onClick={() => navigate(`/product/${product._id}`)} style={{ cursor: 'pointer' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{product.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{product.description}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: '10px' }}>
          <div>
            {product.discount > 0 ? (
              <>
                <div style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>৳ {product.price}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>৳ {product.discountType === 'flat' ? Math.max(0, product.price - product.discount) : Math.round(product.price - (product.price * (product.discount / 100)))}</div>
              </>
            ) : (
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>৳ {product.price}</div>
            )}
            <div style={{ fontSize: '0.8rem', color: (!product.stockKeys || product.stockKeys.length === 0) ? '#EF4444' : 'var(--text-secondary)', marginTop: '2px' }}>
              {(!product.stockKeys || product.stockKeys.length === 0) ? 'Out of Stock' : `${product.stockKeys.length} In Stock`}
            </div>
          </div>
          <button 
            className="btn-primary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              opacity: (!product.stockKeys || product.stockKeys.length === 0) ? 0.5 : 1, 
              cursor: (!product.stockKeys || product.stockKeys.length === 0) ? 'not-allowed' : 'pointer' 
            }}
            disabled={!product.stockKeys || product.stockKeys.length === 0}
            onClick={() => {
              if (product.stockKeys && product.stockKeys.length > 0) {
                addToCart(product);
              }
            }}
          >
            <ShoppingCart size={16} /> {(!product.stockKeys || product.stockKeys.length === 0) ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
