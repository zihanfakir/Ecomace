import React, { useContext, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product, delayIndex = 0 }) => {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className={`glass-panel product-card animate-slide-up animate-stagger-${Math.min(delayIndex + 1, 6)}`} 
      style={{ padding: '0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
    >
      {product.discount > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#EF4444', color: 'white', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
          -{product.discount}{product.discountType === 'flat' ? '৳' : '%'} OFF
        </div>
      )}
      
      <div 
        onClick={() => navigate(`/product/${product._id}`)}
        style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
      >
        {product.photoUrl && !imgError ? (
          <img 
            src={product.photoUrl} 
            alt={product.name} 
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: '3rem' }}>{product.icon || '📦'}</span>
        )}
      </div>

      <div className="product-card-content">
        <div onClick={() => navigate(`/product/${product._id}`)} style={{ cursor: 'pointer' }}>
          <h3 className="product-card-title">{product.name}</h3>
          <p className="product-card-desc">{product.description}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: '8px' }}>
          <div>
            {product.discount > 0 ? (
              <>
                <div className="product-price-strike">৳ {product.price}</div>
                <div className="product-price-large">৳ {product.discountType === 'flat' ? Math.max(0, product.price - product.discount) : Math.max(0, Math.round(product.price - (product.price * (product.discount / 100))))}</div>
              </>
            ) : (
              <div className="product-price-large">৳ {product.price}</div>
            )}
            <div className="product-stock-text" style={{ color: (!product.stockKeys || product.stockKeys.length === 0) ? '#EF4444' : 'var(--text-secondary)' }}>
              {(!product.stockKeys || product.stockKeys.length === 0) ? 'Out of Stock' : `${product.stockKeys.length} In Stock`}
            </div>
          </div>
          <button 
            className="btn-primary product-cart-btn" 
            style={{ 
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
