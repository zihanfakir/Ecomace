import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="animate-fade-in glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Looks like you haven't added anything to your cart yet.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>Shopping Cart</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '30px' }}>
        {cart.map((item) => {
          let finalPrice = item.product.price;
          if (item.product.discount > 0) {
            if (item.product.discountType === 'flat') {
              finalPrice = Math.max(0, item.product.price - item.product.discount);
            } else {
              finalPrice = Math.round(item.product.price - (item.product.price * (item.product.discount / 100)));
            }
          }

          return (
            <div key={item.product._id} className="glass-panel mobile-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {item.product.photoUrl ? <img src={item.product.photoUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>{item.product.icon || '📦'}</span>}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{item.product.name}</h3>
                  <div style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>৳ {finalPrice} each</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', padding: '5px', borderRadius: '8px' }}>
                  <button onClick={() => updateQuantity(item.product._id, -1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', padding: '5px' }}><Minus size={16} /></button>
                  <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', padding: '5px' }}><Plus size={16} /></button>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', minWidth: '80px', textAlign: 'right' }}>
                  ৳ {finalPrice * item.quantity}
                </div>
                <button onClick={() => removeFromCart(item.product._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel mobile-col-center" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Total:</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>৳ {getCartTotal()}</div>
        </div>
        <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/checkout')}>
          Proceed to Checkout <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Cart;
