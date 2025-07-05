// types/admin.ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  userSpecific?: string; // email of specific user
  categories?: string[]; // applicable categories
  products?: string[]; // applicable products
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    product: any;
    sales: number;
    revenue: number;
  }[];
  recentOrders: any[];
  userStats: {
    newUsers: number;
    activeUsers: number;
    returningUsers: number;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][]; // polygon coordinates
  isActive: boolean;
  minOrderAmount: number;
  averageDeliveryTime: number; // in minutes
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
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

// types/admin.ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
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

export interface Coupon {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  userSpecific?: string; // email of specific user
  categories?: string[]; // applicable categories
  products?: string[]; // applicable products
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    product: any;
    sales: number;
    revenue: number;
  }[];
  recentOrders: any[];
  userStats: {
    newUsers: number;
    activeUsers: number;
    returningUsers: number;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: [number, number][]; // polygon coordinates
  isActive: boolean;
  minOrderAmount: number;
  averageDeliveryTime: number; // in minutes
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  totalOrders: number;
  totalSpent: number;
  addresses: any[];
  createdAt: string;
  updatedAt: string;
}