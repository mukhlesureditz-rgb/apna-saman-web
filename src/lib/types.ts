export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Shop {
  id: string;
  owner_user_id: string;
  shop_name: string;
  owner_name: string;
  mobile_number: string;
  shop_address: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  unit: string;
  stock_status: StockStatus;
  is_active: boolean;
  created_at: string;
  category?: Category | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  unit: string | null;
  price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  shop_id: string | null;
  owner_user_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  shop?: Shop | null;
}

export interface AdminNotification {
  id: string;
  order_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminSettings {
  id: string;
  delivery_fee: number;
  delivery_radius_km: number;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
