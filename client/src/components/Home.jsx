import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://ecomace.onrender.com/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="hero-title" style={{ marginBottom: '15px', background: 'linear-gradient(to right, var(--primary-accent), var(--secondary-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem' }}>
          Digital Products Hub
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 20px' }}>
          Discover and download premium digital assets instantly. Build faster with our top-tier templates and kits.
        </p>
        <button 
          className="btn-primary" 
          style={{ padding: '10px 25px', fontSize: '1rem' }}
          onClick={() => {
            document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Browse Catalog
        </button>
      </div>

      <div id="products-section">
        <h2 style={{ marginBottom: '20px', borderLeft: '4px solid var(--primary-accent)', paddingLeft: '10px' }}>Featured Products</h2>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading products...</p>
        ) : products.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px' }}>No Products Available</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Go to the Admin Panel to add some digital products!</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
