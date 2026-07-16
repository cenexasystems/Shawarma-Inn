export const ADMIN_ORDER_STATUSES = [
  'pending', 'processing', 'completed', 'cancelled',
];

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', processing: 'Processing',
  completed: 'Completed', cancelled: 'Cancelled',
};

export const COLORS = ['#ef8f2f', '#dc2626', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'in_transit': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

export const emptyMenuItem = {
  name: '',
  price: '',
  category: '',
  image_url: '',
  is_bestseller: false,
  is_active: true,
};

export const emptyCategory = {
  name: '',
  display_order: '0',
  is_active: true,
};

export const emptyCoupon = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  expiry_date: '',
  usage_limit: '',
};
