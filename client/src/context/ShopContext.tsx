import {

  createContext,

  useContext,

  useState,

  useEffect,

  useCallback,

  type ReactNode,

} from 'react';

import { api } from '../services/api';



export interface LocalCartItem {

  productId: string;

  quantity: number;

  size?: string;

  color?: string;

}



interface ShopContextType {

  cart: LocalCartItem[];

  favoriteIds: Set<string>;

  orderIds: string[];

  savedPhone: string;

  addToCart: (item: LocalCartItem) => void;

  updateCartQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;

  removeFromCart: (productId: string, size?: string, color?: string) => void;

  clearCart: () => void;

  toggleFavorite: (productId: string) => void;

  isFavorite: (productId: string) => boolean;

  addOrderId: (id: string) => void;

  setSavedPhone: (phone: string) => void;

  pruneCart: (validProductIds: Set<string>) => void;

  cartCount: number;

}



const ShopContext = createContext<ShopContextType | null>(null);



const CART_KEY = 'oshop_cart';

const FAV_KEY = 'oshop_favorites';

const ORDERS_KEY = 'oshop_order_ids';

const PHONE_KEY = 'oshop_phone';



function cartKey(productId: string, size?: string, color?: string) {

  return `${productId}|${size || ''}|${color || ''}`;

}



function loadJson<T>(key: string, fallback: T): T {

  try {

    const raw = localStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;

  } catch {

    return fallback;

  }

}



export function ShopProvider({ children }: { children: ReactNode }) {

  const [cart, setCart] = useState<LocalCartItem[]>(() => loadJson(CART_KEY, []));

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(

    () => new Set(loadJson<string[]>(FAV_KEY, []))

  );

  const [orderIds, setOrderIds] = useState<string[]>(() => loadJson(ORDERS_KEY, []));

  const [savedPhone, setSavedPhoneState] = useState(() => localStorage.getItem(PHONE_KEY) || '+996 ');



  useEffect(() => {

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

  }, [cart]);



  useEffect(() => {

    localStorage.setItem(FAV_KEY, JSON.stringify([...favoriteIds]));

  }, [favoriteIds]);



  useEffect(() => {

    localStorage.setItem(ORDERS_KEY, JSON.stringify(orderIds));

  }, [orderIds]);



  const addToCart = useCallback((item: LocalCartItem) => {

    setCart((prev) => {

      const key = cartKey(item.productId, item.size, item.color);

      const idx = prev.findIndex(

        (c) => cartKey(c.productId, c.size, c.color) === key

      );

      if (idx >= 0) {

        const next = [...prev];

        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };

        return next;

      }

      return [...prev, item];

    });

  }, []);



  const updateCartQuantity = useCallback(

    (productId: string, quantity: number, size?: string, color?: string) => {

      const key = cartKey(productId, size, color);

      setCart((prev) =>

        prev.map((c) =>

          cartKey(c.productId, c.size, c.color) === key ? { ...c, quantity } : c

        )

      );

    },

    []

  );



  const removeFromCart = useCallback(

    (productId: string, size?: string, color?: string) => {

      const key = cartKey(productId, size, color);

      setCart((prev) =>

        prev.filter((c) => cartKey(c.productId, c.size, c.color) !== key)

      );

    },

    []

  );



  const clearCart = useCallback(() => setCart([]), []);



  const toggleFavorite = useCallback((productId: string) => {

    setFavoriteIds((prev) => {

      const next = new Set(prev);

      if (next.has(productId)) next.delete(productId);

      else next.add(productId);

      return next;

    });

  }, []);



  const isFavorite = useCallback(

    (productId: string) => favoriteIds.has(productId),

    [favoriteIds]

  );



  const addOrderId = useCallback((id: string) => {

    setOrderIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));

  }, []);



  const setSavedPhone = useCallback((phone: string) => {

    setSavedPhoneState(phone);

    localStorage.setItem(PHONE_KEY, phone);

  }, []);



  const pruneCart = useCallback((validProductIds: Set<string>) => {

    setCart((prev) => {

      const next = prev.filter((c) => validProductIds.has(c.productId));

      return next.length === prev.length ? prev : next;

    });

  }, []);



  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);



  return (

    <ShopContext.Provider

      value={{

        cart,

        favoriteIds,

        orderIds,

        savedPhone,

        addToCart,

        updateCartQuantity,

        removeFromCart,

        clearCart,

        toggleFavorite,

        isFavorite,

        addOrderId,

        setSavedPhone,

        pruneCart,

        cartCount,

      }}

    >

      {children}

    </ShopContext.Provider>

  );

}



export function useShop() {

  const ctx = useContext(ShopContext);

  if (!ctx) throw new Error('useShop must be used within ShopProvider');

  return ctx;

}



export async function checkStock(productId: string, size?: string): Promise<number> {

  const params = size ? `?size=${encodeURIComponent(size)}` : '';

  const data = await api.get<{ available: number }>(`/products/stock/${productId}${params}`);

  return data.available;

}

