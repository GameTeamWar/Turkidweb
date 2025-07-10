// types/index.ts - Updated with multi-category support

// Product option types from admin types
export interface ProductOption {
  label: string;
  values: any;
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  choices: ProductChoice[];
}

export interface ProductChoice {
  id: string;
  name: string;
  price?: number; // Ek ücret
}

// Updated Product interface with multi-category support
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  categories: string[]; // Artık array - birden çok kategori
  category?: string; // Geriye uyumluluk için
  discount: number;
  tags: string[];
  hasOptions: boolean;
  options: ProductOption[];
  stock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  note: any;
  note: ReactNode;
  deliveryAddress: any;
  deliveryAddress: any;
  deliveryAddress: any;
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'cash' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderNote?: string;
  adminNote?: string;
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Filter types
export interface ProductFilters {
  search: string;
  category: string;
  isActive?: boolean;
  hasStock?: boolean;
  hasDiscount?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface OrderFilters {
  search: string;
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  paymentMethod?: Order['paymentMethod'];
  dateFrom: string;
  dateTo: string;
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
  categories: string[]; // Artık array
  image: string;
  tags: string[];
  hasOptions: boolean;
  options: ProductOption[];
  stock?: number;
  isActive: boolean;
}

export interface OrderForm {
  paymentMethod: 'card' | 'cash' | 'online';
  orderNote?: string;
  address?: {
    fullAddress: string;
  };
  phone?: string;
}