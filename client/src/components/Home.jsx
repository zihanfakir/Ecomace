import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categoryOrder, setCategoryOrder] = useState([]);

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
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/products`);
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/settings`);
        if (response.data && response.data.categoryOrder) {
          setCategoryOrder(response.data.categoryOrder);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchProducts();
    fetchSettings();
  }, []);

  const categories = React.useMemo(() => {
    const dynamicCategories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];
    return dynamicCategories.sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [products, categoryOrder]);

  const getCategoryIcon = (cat) => {
    // If the category already contains an emoji, don't add a default one
    const hasEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(cat);
    if (hasEmoji) return '';

    const lcat = cat.toLowerCase();
    if (lcat === 'all') return '✨';
    if (lcat.includes('software')) return '💻';
    if (lcat.includes('game')) return '🎮';
    if (lcat.includes('sub')) return '📺';
    if (lcat.includes('tool')) return '🛠️';
    if (lcat.includes('design')) return '🎨';
    if (lcat.includes('music') || lcat.includes('audio')) return '🎵';
    if (lcat.includes('video')) return '🎥';
    if (lcat.includes('book') || lcat.includes('pdf')) return '📚';
    if (lcat.includes('course')) return '🎓';
    return '📦';
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            product.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = activeCategory === 'All' || (product.category || 'Uncategorized') === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const aOut = !a.stockKeys || a.stockKeys.length === 0;
      const bOut = !b.stockKeys || b.stockKeys.length === 0;
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      return 0;
    });
  }, [products, debouncedSearch, activeCategory]);

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
          <h2>Featured Products</h2>
          <div style={{ position: 'relative', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '30px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="categories-container" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 5px 20px 5px', marginBottom: '20px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((category, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(category)}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '30px',
                border: activeCategory === category ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--border-color)',
                background: activeCategory === category 
                  ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' 
                  : 'var(--surface-color)',
                color: activeCategory === category ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: activeCategory === category ? '600' : '500',
                boxShadow: activeCategory === category ? '0 8px 20px rgba(67, 24, 255, 0.3)' : '0 4px 10px rgba(0,0,0,0.02)',
                backdropFilter: 'blur(10px)',
                transform: 'scale(1)'
              }}
            >
              {getCategoryIcon(category) && (
                <span style={{ fontSize: '1.2rem' }}>{getCategoryIcon(category)}</span>
              )}
              {category}
            </button>
          ))}
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
