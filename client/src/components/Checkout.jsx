import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Tag, Copy } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { cart, getCartTotal, clearCart } = useContext(CartContext);
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [paymentDetails, setPaymentDetails] = useState({ accountInfo: '', transactionId: '' });
  const [customerDetails, setCustomerDetails] = useState({ email: user?.email || '', phone: '', note: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [adminPaymentAccounts, setAdminPaymentAccounts] = useState({ bkash: '', nagad: '', rocket: '', upay: '', bybit: '', binance: '' });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Number copied to clipboard!', 'success');
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('https://ecomace.onrender.com/api/settings');
        if (response.data?.paymentMethods) {
          setAdminPaymentAccounts(response.data.paymentMethods);
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) {
      addToast('Please login to continue checkout', 'info');
      navigate('/auth', { state: { from: '/checkout' } });
    }
  }, [user, navigate, addToast]);

  useEffect(() => {
    setCouponDiscount(0);
    setCouponCode('');
  }, [cart]);

  const getUnitPrice = (product) => {
    let price = product.price;
    if (product.discount > 0) {
      if (product.discountType === 'flat') {
        price = Math.max(0, product.price - product.discount);
      } else {
        price = Math.round(product.price - (product.price * (product.discount / 100)));
        price = Math.max(0, price);
      }
    }
    return price;
  };

  if (cart.length === 0 && !isSuccess) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
        <h2>Your Cart is Empty</h2>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/cart')}>Back to Cart</button>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await axios.post('https://ecomace.onrender.com/api/coupons/validate', { code: couponCode });
      const coupon = res.data;
      
      let applicableSubtotal = 0;
      
      if (coupon.applicableType === 'product') {
        const applicableItems = cart.filter(item => item.product._id === coupon.applicableTo);
        if (applicableItems.length === 0) {
          throw new Error('This coupon is not valid for the items in your cart');
        }
        applicableSubtotal = applicableItems.reduce((acc, item) => {
          return acc + (getUnitPrice(item.product) * item.quantity);
        }, 0);
      } else if (coupon.applicableType === 'category') {
        const applicableItems = cart.filter(item => item.product.category === coupon.applicableTo);
        if (applicableItems.length === 0) {
          throw new Error('This coupon is not valid for the items in your cart');
        }
        applicableSubtotal = applicableItems.reduce((acc, item) => {
          return acc + (getUnitPrice(item.product) * item.quantity);
        }, 0);
      } else {
        applicableSubtotal = getCartTotal();
      }



      let discount = 0;
      if (coupon.discountType === 'flat') {
        discount = Math.min(coupon.discountPercent, applicableSubtotal);
      } else {
        discount = Math.round(applicableSubtotal * (coupon.discountPercent / 100));
      }
      // Never allow any discount to exceed the applicable subtotal
      discount = Math.min(discount, applicableSubtotal);
      
      setCouponDiscount(discount);
      addToast(`Coupon applied! ${res.data.discountType === 'flat' ? '৳' : ''}${res.data.discountPercent}${res.data.discountType === 'flat' ? '' : '%'} off.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Invalid Coupon', 'error');
      setCouponDiscount(0);
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentDetails.accountInfo || !paymentDetails.transactionId || !customerDetails.email || !customerDetails.phone) {
      addToast('Please fill out all required details (Email, Phone, Payment info)', 'error');
      return;
    }

    if (['bkash', 'nagad', 'upay'].includes(paymentMethod)) {
      const regex = /^01\d{9}$/;
      if (!regex.test(paymentDetails.accountInfo)) {
        addToast(`${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Mobile Number must be exactly 11 digits and start with 01.`, 'error');
        return;
      }
    } else if (paymentMethod === 'rocket') {
      const rocketRegex = /^01\d{9,10}$/; // 11 or 12 digits for rocket
      if (!rocketRegex.test(paymentDetails.accountInfo)) {
        addToast('Rocket Mobile Number must be 11 or 12 digits and start with 01.', 'error');
        return;
      }
    }
    
    setIsProcessing(true);
    try {
      const response = await axios.post(`https://ecomace.onrender.com/api/orders/checkout`, {
        cartItems: cart,
        customerDetails,
        paymentMethod,
        paymentDetails,
        couponCode: couponDiscount > 0 ? couponCode : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderResult(response.data.order);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to process checkout', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getCartTotal();
  const finalPrice = subtotal - couponDiscount;

  if (isSuccess && orderResult) {
    return (
      <div className="animate-fade-in glass-panel" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '800px', margin: '40px auto' }}>
        <CheckCircle2 size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Order Placed Successfully!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '1.1rem' }}>
          Your order has been received and is currently <strong style={{ color: '#F59E0B' }}>Pending Approval</strong>.
          <br /><br />
          We are verifying your payment. Once approved by our admins, your keys/accounts will be available in your Customer Dashboard.
        </p>
        
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        <button className="btn-secondary" style={{ marginLeft: '15px' }} onClick={() => navigate('/')}>Back to Store</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '20px' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Checkout</h1>

      <div className="responsive-grid grid-2">
        {/* Order Summary & Customer Details */}
        <div>
          <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Order Summary</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>{item.product.name} (x{item.quantity})</div>
                  <div>৳ {getUnitPrice(item.product) * item.quantity}</div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal</span>
              <span>৳ {subtotal}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#EF4444' }}>
                <span>Coupon Discount</span>
                <span>- ৳ {couponDiscount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', paddingTop: '20px', borderTop: 'var(--glass-border)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-accent)' }}>৳ {finalPrice}</span>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Promo Code" 
                value={couponCode} 
                onChange={e => setCouponCode(e.target.value)} 
                disabled={couponDiscount > 0}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'var(--glass-border)', background: couponDiscount > 0 ? 'rgba(0,0,0,0.1)' : 'var(--bg-color)', color: 'var(--text-primary)', opacity: couponDiscount > 0 ? 0.7 : 1 }} 
              />
              {couponDiscount > 0 ? (
                <button type="button" onClick={handleRemoveCoupon} style={{ padding: '10px 15px', borderRadius: '8px', background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>Remove</button>
              ) : (
                <button type="button" onClick={handleApplyCoupon} style={{ padding: '10px 15px', borderRadius: '8px', background: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={16}/> Apply</button>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: '20px' }}>Customer Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="email" placeholder="Email Address *" required value={customerDetails.email} onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              <input type="tel" placeholder="Phone Number *" required value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              <textarea placeholder="Order Note (Optional)" rows={3} value={customerDetails.note} onChange={e => setCustomerDetails({...customerDetails, note: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>Payment Method</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'bkash' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="bkash" checked={paymentMethod === 'bkash'} onChange={() => {setPaymentMethod('bkash'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>bKash Mobile Banking</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'nagad' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="nagad" checked={paymentMethod === 'nagad'} onChange={() => {setPaymentMethod('nagad'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>Nagad Mobile Banking</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'rocket' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="rocket" checked={paymentMethod === 'rocket'} onChange={() => {setPaymentMethod('rocket'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>Rocket Mobile Banking</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'upay' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="upay" checked={paymentMethod === 'upay'} onChange={() => {setPaymentMethod('upay'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>Upay Mobile Banking</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'bybit' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="bybit" checked={paymentMethod === 'bybit'} onChange={() => {setPaymentMethod('bybit'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>Bybit Pay (Crypto)</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: 'var(--glass-border)', borderRadius: '12px', cursor: 'pointer', backgroundColor: paymentMethod === 'binance' ? 'var(--surface-color)' : 'transparent', transition: 'all 0.3s' }}>
              <input type="radio" name="payment" value="binance" checked={paymentMethod === 'binance'} onChange={() => {setPaymentMethod('binance'); setPaymentDetails({ accountInfo: '', transactionId: '' });}} />
              <div style={{ fontWeight: '600' }}>Binance Pay</div>
            </label>
          </div>

          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ marginBottom: '10px' }}>Verify Payment</h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Please send exactly ৳ {finalPrice} to our {paymentMethod} account: <br />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <strong style={{ color: 'var(--primary-accent)', fontSize: '1.2rem', display: 'inline-block' }}>
                  {adminPaymentAccounts[paymentMethod] || 'Not Set - Please contact support'}
                </strong>
                {adminPaymentAccounts[paymentMethod] && (
                  <button type="button" onClick={() => handleCopy(adminPaymentAccounts[paymentMethod])} style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <input 
              type="text" 
              placeholder={['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod) ? `Your ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Number` : `Your ${paymentMethod === 'bybit' ? 'Bybit' : 'Binance'} UID / Email`} 
              required 
              value={paymentDetails.accountInfo} 
              onChange={e => setPaymentDetails({...paymentDetails, accountInfo: e.target.value})} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
            />
            
            <input 
              type="text" 
              placeholder="Transaction ID (TrxID)" 
              required 
              value={paymentDetails.transactionId} 
              onChange={e => setPaymentDetails({...paymentDetails, transactionId: e.target.value})} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
            />

            <button 
              type="submit"
              className="btn-primary" 
              style={{ width: '100%', opacity: isProcessing ? 0.7 : 1, marginTop: '10px' }} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Confirm & Pay ৳ ${finalPrice}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
