export interface MenuItem {
  id: string | number;
  slug?: string;
  name: string;
  emoji?: string; // legacy
  desc?: string;
  description?: string; // legacy
  price: number;
  rating: number;
  category: string;
  image?: string;
  bestseller?: boolean;
  isVeg?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  imageUrl?: string;
  image?: string;
  mapUrl?: string;
  maps?: string;
  badge?: string;
  instagram?: string;
  isFlagship?: boolean;
  flagship?: boolean;
}

export interface VideoTestimonial {
  branchId: string;
  branchName: string;
  customerName: string;
  quote: string;
  videoUrl: string | null;
  posterUrl: string | null;
}

export interface Review {
  id: string;
  author: string;
  role?: string;
  rating: number;
  text: string;
  date: string;
  avatarUrl: string;
}

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  gst: number;
  total: number;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string | number) => void;
  updateQty: (id: string | number, qty: number) => void;
  clearCart: () => void;
  buildWhatsAppUrl: (phone: string) => string;
}
