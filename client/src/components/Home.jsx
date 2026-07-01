import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to remove typing lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    product.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
          <h2 style={{ borderLeft: '4px solid var(--primary-accent)', paddingLeft: '10px', margin: 0 }}>Featured Products</h2>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 45px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="products-grid">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="skeleton skeleton-card"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-panel animate-slide-up" style={{ padding: '40px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px' }}>No Products Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search criteria!</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product._id} product={product} delayIndex={index % 6} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
