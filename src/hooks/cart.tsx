import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = JSON.parse(
        (await AsyncStorage.getItem('@goMarketplace:cart')) || '',
      );
      setProducts(cart);
    }

    loadProducts();
  }, []);

  const addStorage = useCallback(
    async (cart = products) => {
      await AsyncStorage.setItem('@goMarketplace:cart', JSON.stringify(cart));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
        }
        return product;
      });
      setProducts(newProducts);
      addStorage(newProducts);
    },
    [products, addStorage],
  );

  const addToCart = useCallback(
    async product => {
      const exitsProduct =
        products.filter(productFilter => productFilter.id === product.id)
          .length > 0;
      if (exitsProduct) {
        increment(product.id);
      } else {
        const newProducts = [...products];
        newProducts.push({ ...product, quantity: 1 });
        setProducts(newProducts);
        addStorage(newProducts);
      }
    },
    [increment, products, addStorage],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(product => {
          if (product.id === id) {
            product.quantity -= 1;
          }
          return product;
        })
        .filter(newProduct => newProduct.quantity > 0);

      setProducts(newProducts);
      addStorage(newProducts);
    },
    [products, addStorage],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
