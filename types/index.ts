// types/index.ts

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  discount: number;
  tags: string[];
  hasOptions: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  productId: string;
  type: 'spice' | 'sauce' | 'size' | 'extra';
  name: string;
  options: string[];
  required: boolean;
  maxSelections: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: Record<string, string>;
  cartKey: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Filters {
  vegetarian: boolean;
  spicy: boolean;
  discount: boolean;
  popular: boolean;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  image?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'cash' | 'online';
  orderNote?: string;
  address?: Address;
  phone?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatus {
  status: Order['status'];
  timestamp: string;
  note?: string;
}

export interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  popularProducts: {
    product: Product;
    orderCount: number;
    revenue: number;
  }[];
  recentOrders: Order[];
  dailyStats: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

// Store types for Zustand
export interface CartStore {
  items: CartItem[];
  addItem: (product: Product, options?: Record<string, string>) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  hasOptions: boolean;
  isActive: boolean;
}

export interface OrderForm {
  paymentMethod: 'card' | 'cash' | 'online';
  orderNote?: string;
  address?: Address;
  phone?: string;
}