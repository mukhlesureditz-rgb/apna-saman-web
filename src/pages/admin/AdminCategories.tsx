import { useEffect, useRef, useState } from 'react';
import { Plus, Edit3, Trash2, Loader2, Upload, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';
import { SmartImage } from '../../components/ui/SmartImage';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { uploadImage } from '../../lib/upload';
import { slugify } from '../../lib/utils';

export function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [cRes, pRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('category_id'),
    ]);
    const cats = (cRes.data ?? []) as Category[];
    setCategories(cats);
    const map: Record<string, number> = {};
    (pRes.data ?? []).forEach((p: any) => {
      if (p.category_id) map[p.category_id] = (map[p.category_id] ?? 0) + 1;
    });
    setCounts(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    setDeleting(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast('Category deleted', 'success');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Categories</h1>
          <p className="text-sm text-ink-500">{categories.length} categories</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={LayoutGrid}
            title="No categories yet"
            description="Create categories to organize your products."
            action={
              <button className="btn-primary" onClick={() => setFormOpen(true)}>
                <Plus size={18} /> Add Category
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="card p-3 flex items-center gap-3 animate-fade-in">
              <SmartImage
                src={c.image_url}
                alt={c.name}
                className="h-16 w-16 shrink-0"
                fallbackClassName="h-16 w-16 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink-900 line-clamp-1">{c.name}</h3>
                <p className="text-xs text-ink-500">{counts[c.id] ?? 0} products</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-100 text-ink-700 text-xs font-semibold hover:bg-ink-200"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="grid place-items-center px-2.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete this category?"
        message="Products in this category will become uncategorized. This cannot be undone."
        onConfirm={confirmDelete}
        onClose={() => !deleting && setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

function CategoryForm({
  open,
  onClose,
  category,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sort_order: '0',
    image_url: '' as string | null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: category?.name ?? '',
      sort_order: category ? String(category.sort_order) : '0',
      image_url: category?.image_url ?? null,
    });
  }, [open, category]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'categories');
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
      toast('Category name is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.name.trim()),
      sort_order: Number(form.sort_order) || 0,
      image_url: form.image_url,
    };
    const { error } = category
      ? await supabase.from('categories').update(payload).eq('id', category.id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(category ? 'Category updated' : 'Category added', 'success');
    onSaved();
  };

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title={category ? 'Edit Category' : 'Add Category'}>
      <div className="space-y-4">
        <div>
          <label className="label">Category Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-full h-32 rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 transition-colors overflow-hidden grid place-items-center"
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
                <Upload size={24} />
                <span className="text-xs font-semibold">Tap to upload image</span>
              </div>
            )}
          </button>
        </div>

        <div>
          <label className="label">Category Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Groceries"
          />
        </div>

        <div>
          <label className="label">Sort Order</label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? 'Saving…' : category ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </Modal>
  );
}
