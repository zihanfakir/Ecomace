import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Zap, Download } from 'lucide-react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get('https://ecomace.onrender.com/api/products');
        // Find the specific product since we don't have a GET /:id route yet
        const found = response.data.find(p => p._id === id);
        setProduct(found);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <h2>Product Not Found</h2>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Back to Store</button>
      </div>
    );
  }

  const finalPrice = product.discount > 0 ? (product.discountType === 'flat' ? Math.max(0, product.price - product.discount) : Math.round(product.price - (product.price * (product.discount / 100)))) : product.price;
  const isOutOfStock = !product.stockKeys || product.stockKeys.length === 0;

  return (
    <div className="animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '30px' }}
      >
        <ArrowLeft size={20} /> Back to Store
      </button>

      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
          {product.discount > 0 && (
            <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
              -{product.discount}{product.discountType === 'flat' ? '৳' : '%'} OFF
            </div>
          )}
          {product.photoUrl ? (
            <img src={product.photoUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '6rem' }}>{product.icon || '🔑'}</span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0' }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isOutOfStock ? '#EF4444' : '#10B981', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {isOutOfStock ? 'Out of Stock' : `${product.stockKeys.length} In Stock`}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>Instant Digital Delivery</span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', margin: '20px 0' }}>
            {product.discount > 0 ? (
              <>
                <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>৳ {product.price}</span>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-accent)', lineHeight: '1' }}>৳ {finalPrice}</span>
              </>
            ) : (
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-accent)', lineHeight: '1' }}>৳ {product.price}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: 'var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} color="var(--primary-accent)" /> <span style={{ fontWeight: '500' }}>Instant Delivery via Email & Dashboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#10B981" /> <span style={{ fontWeight: '500' }}>100% Secure Payment & Authentic Key</span>
            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ padding: '15px', fontSize: '1.2rem', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
            disabled={isOutOfStock}
            onClick={() => {
              if(!isOutOfStock) {
                addToCart(product);
                // Optionally navigate to cart or show a toast
              }
            }}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {product.bigDescription && (
        <div className="glass-panel" style={{ marginTop: '40px', padding: '30px' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Product Description</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {product.bigDescription}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
