import React, { createContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

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

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product._id === product._id);
      if (existingItem) {
        // Prevent adding more than stock available
        const maxStock = product.stockKeys?.length || 0;
        if (existingItem.quantity >= maxStock) {
          addToast('Not enough stock available!', 'error');
          return prevCart;
        }
        addToast('Added to cart!', 'success');
        return prevCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      addToast('Added to cart!', 'success');
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product._id === productId) {
          const newQty = item.quantity + amount;
          const maxStock = item.product.stockKeys?.length || 0;
          if (newQty > 0 && newQty <= maxStock) {
            return { ...item, quantity: newQty };
          }
        }
        return item;
      });
    });
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
