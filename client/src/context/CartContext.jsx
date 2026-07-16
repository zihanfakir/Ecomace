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

  const addToCart = async (product) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/products/${product._id}`);
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
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://ecomace.onrender.com'}/api/products/${productId}`);
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
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
