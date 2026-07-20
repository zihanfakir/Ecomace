import React, { createContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Refresh cart prices
  const refreshCart = async () => {
      if (cart.length === 0) return;
      try {
        const refreshedCart = await Promise.all(cart.map(async (item) => {
          try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace-9ntk.vercel.app'}/api/products/${item.product._id}`);
            return { ...item, product: res.data };
          } catch (err) {
            // If product deleted or failed to fetch, keep old or remove? Let's just keep old for now.
            return item;
          }
        }));
        // Only update if something actually changed to prevent infinite loops if prices are same, 
        // but since it's on mount it's fine to just set it once.
        setCart(refreshedCart);
      } catch (err) {
        console.error('Failed to refresh cart prices', err);
      }
    };
    
  // Refresh cart prices on load
  useEffect(() => {
    // Run once on mount if cart has items
    if (cart.length > 0) {
      refreshCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const addToCart = async (product) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace-9ntk.vercel.app'}/api/products/${product._id}`);
      const liveProduct = res.data;
      const maxStock = liveProduct.stockKeys?.length || 0;

      const existingItem = cart.find((item) => item.product._id === product._id);
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (currentQty >= maxStock) {
        addToast('Not enough stock available!', 'error');
        return;
      }

      if (existingItem) {
        setCart(cart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, product: liveProduct }
            : item
        ));
      } else {
        setCart([...cart, { product: liveProduct, quantity: 1 }]);
      }
      addToast('Added to cart!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to add to cart', 'error');
    }
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const updateQuantity = async (productId, amount) => {
    const itemToUpdate = cart.find(item => item.product._id === productId);
    if (!itemToUpdate) return;
    
    const newQty = itemToUpdate.quantity + amount;
    
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product._id !== productId));
      return;
    }
    
    try {
      if (amount > 0) {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace-9ntk.vercel.app'}/api/products/${productId}`);
        const liveProduct = res.data;
        const maxStock = liveProduct.stockKeys?.length || 0;
        
        if (newQty > maxStock) {
          addToast('Not enough stock available!', 'error');
          return;
        }
      }
      
      setCart(cart.map((item) => 
        item.product._id === productId ? { ...item, quantity: newQty } : item
      ));
    } catch (err) {
      console.error(err);
      addToast('Failed to update quantity', 'error');
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      let finalPrice = item.product.price;
      if (item.product.discount > 0) {
        if (item.product.discountType === 'flat') {
          finalPrice = Math.max(0, item.product.price - item.product.discount);
        } else {
          finalPrice = Math.round(item.product.price - (item.product.price * (item.product.discount / 100)));
          finalPrice = Math.max(0, finalPrice);
        }
      }
      return total + finalPrice * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};
