import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit3, Trash2, Loader2, Upload, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category, Product, StockStatus } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';
import { SmartImage } from '../../components/ui/SmartImage';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { uploadImage } from '../../lib/upload';
import { formatINR, STOCK_STATUS_META, cn } from '../../lib/utils';

const STOCK_OPTIONS: StockStatus[] = ['in_stock', 'low_stock', 'out_of_stock'];
const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'dozen', 'box', 'packet', 'bottle', 'bag'];

export function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
    ]);
    setProducts((pRes.data ?? []) as Product[]);
    setCategories((cRes.data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    setDeleting(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast('Product deleted', 'success');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Products</h1>
          <p className="text-sm text-ink-500">{products.length} products in catalog</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          className="input pl-11"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first wholesale product to the catalog."
            action={
              <button className="btn-primary" onClick={openAdd}>
                <Plus size={18} /> Add Product
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="card p-3 flex gap-3 animate-fade-in">
              <SmartImage
                src={p.image_url}
                alt={p.name}
                className="h-20 w-20 shrink-0"
                fallbackClassName="h-20 w-20 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-ink-900 text-sm line-clamp-1">{p.name}</h3>
                  <Badge className={STOCK_STATUS_META[p.stock_status].color}>
                    {STOCK_STATUS_META[p.stock_status].label}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  {p.category?.name ?? 'Uncategorized'} • Per {p.unit}
                </p>
                <p className="mt-1 font-extrabold text-brand-700">{formatINR(p.price)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-ink-100 text-ink-700 text-xs font-semibold hover:bg-ink-200"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="grid place-items-center px-2.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        categories={categories}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete this product?"
        message="This will permanently remove the product from your catalog."
        onConfirm={confirmDelete}
        onClose={() => !deleting && setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
}

function ProductForm({ open, onClose, product, categories, onSaved }: FormProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'piece',
    stock_status: 'in_stock' as StockStatus,
    category_id: '',
    is_active: true,
    image_url: '' as string | null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product ? String(product.price) : '',
      unit: product?.unit ?? 'piece',
      stock_status: product?.stock_status ?? 'in_stock',
      category_id: product?.category_id ?? '',
      is_active: product?.is_active ?? true,
      image_url: product?.image_url ?? null,
    });
  }, [open, product]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'products');
      setForm((f) => ({ ...f, image_url: url }));
      toast('Image uploaded', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast('Product name is required', 'error');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast('Enter a valid price', 'error');
      return;
    }
    if (categories.length > 0 && !form.category_id) {
      toast('Select a category', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      unit: form.unit,
      stock_status: form.stock_status,
      category_id: form.category_id || null,
      is_active: form.is_active,
      image_url: form.image_url,
    };
    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(product ? 'Product updated' : 'Product added', 'success');
    onSaved();
  };

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title={product ? 'Edit Product' : 'Add Product'}>
      <div className="space-y-4">
        {/* Image */}
        <div>
          <label className="label">Product Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-full h-36 rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 transition-colors overflow-hidden grid place-items-center"
          >
            {form.image_url ? (
              <>
                <img src={form.image_url} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className="chip bg-white/90 text-ink-700">
                    <Upload size={12} /> Change
                  </span>
                </div>
              </>
            ) : uploading ? (
              <Loader2 className="animate-spin text-brand-600" size={24} />
            ) : (
              <div className="flex flex-col items-center gap-1 text-ink-400">
                <Upload size={26} />
                <span className="text-xs font-semibold">Tap to upload image</span>
              </div>
            )}
          </button>
        </div>

        <div>
          <label className="label">Product Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Aashirvaad Atta 10kg"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[72px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Unit</label>
            <select
              className="input"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Stock Status</label>
            <select
              className="input"
              value={form.stock_status}
              onChange={(e) => setForm((f) => ({ ...f, stock_status: e.target.value as StockStatus }))}
            >
              {STOCK_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STOCK_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="h-4 w-4 rounded accent-brand-600"
          />
          <span className="text-sm font-semibold text-ink-700">Active (visible to shopkeepers)</span>
        </label>

        <button className="btn-primary w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? 'Saving…' : product ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </Modal>
  );
}


