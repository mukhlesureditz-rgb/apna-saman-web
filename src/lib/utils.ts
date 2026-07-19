import type { OrderStatus, StockStatus } from './types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? 's' : ''} ago`;
  return formatDate(iso);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; dot: string }
> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  delivered: { label: 'Delivered', color: 'bg-brand-100 text-brand-800', dot: 'bg-brand-600' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-ink-200 text-ink-700', dot: 'bg-ink-500' },
};

export const STOCK_STATUS_META: Record<StockStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'bg-brand-100 text-brand-800' },
  low_stock: { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
};

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
