/*
# APNA SAMAN — B2B wholesale ordering platform schema

1. Overview
   APNA SAMAN lets local shopkeepers register, browse a wholesale catalog,
   place Cash-on-Delivery orders, and track delivery status. An admin (the
   business owner) manages products, categories, orders, and views registered
   shops. This migration creates the full schema, RLS policies, a realtime
   publication, a storage bucket for product images, and a trigger that
   inserts a notification row whenever a new order is placed.

2. New Tables
   - shops              : Registered shopkeeper profiles (linked to auth.users).
   - categories         : Product categories (managed by admin).
   - products           : Wholesale products (managed by admin).
   - orders             : Shopkeeper orders (COD only).
   - order_items        : Line items per order.
   - admin_notifications: In-app notifications for admin when orders arrive.
   - admin_settings     : Single-row admin config (delivery fee, radius). id is text.

3. Security (RLS)
   - shops: owner-scoped CRUD; admin read-all via is_admin().
   - categories/products: public read (anon+authenticated); admin-only writes.
   - orders: owner read/write + admin read/update; shopkeeper may update own (cancel).
   - order_items: read/insert scoped via parent order ownership; admin full.
   - admin_notifications: admin only.
   - admin_settings: admin only.
   - storage bucket 'product-images': public read; admin-only write/update/delete.

4. Realtime
   - orders, admin_notifications, products, categories added to supabase_realtime.

5. Storage
   - Public bucket 'product-images' for product/category image uploads.

6. Important Notes
   - Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
   - Owner columns default to auth.uid() so client inserts omitting them succeed.
   - is_admin() checks raw_app_meta_data.role == 'admin' on the current JWT.
   - Admin account is created via Supabase Auth (email/password) and its
     app_metadata role is set to 'admin' by the admin onboarding edge function
     'apna-saman-admin-init'. The frontend admin login checks the role claim.
*/

-- ---------- helper: is_admin ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------- shops ----------
CREATE TABLE IF NOT EXISTS public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  mobile_number text NOT NULL,
  shop_address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shops_select_own_or_admin" ON public.shops;
CREATE POLICY "shops_select_own_or_admin" ON public.shops
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "shops_insert_own" ON public.shops;
CREATE POLICY "shops_insert_own" ON public.shops
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "shops_update_own" ON public.shops;
CREATE POLICY "shops_update_own" ON public.shops
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "shops_delete_own" ON public.shops;
CREATE POLICY "shops_delete_own" ON public.shops
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_public" ON public.categories;
CREATE POLICY "categories_read_public" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_write_admin" ON public.categories;
CREATE POLICY "categories_write_admin" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'piece',
  stock_status text NOT NULL DEFAULT 'in_stock',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read_public" ON public.products;
CREATE POLICY "products_read_public" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_write_admin" ON public.products;
CREATE POLICY "products_write_admin" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'COD',
  delivery_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_update_own_cancel" ON public.orders;
CREATE POLICY "orders_update_own_cancel" ON public.orders
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  unit text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  line_total numeric(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o
           WHERE o.id = order_id
           AND (o.owner_user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "order_items_insert_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_insert_own_or_admin" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o
           WHERE o.id = order_id
           AND (o.owner_user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
CREATE POLICY "order_items_update_admin" ON public.order_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_admin()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_admin()));

DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;
CREATE POLICY "order_items_delete_admin" ON public.order_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_admin()));

-- ---------- admin_notifications ----------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_admin_all" ON public.admin_notifications;
CREATE POLICY "notif_admin_all" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "notif_update_admin" ON public.admin_notifications;
CREATE POLICY "notif_update_admin" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notif_delete_admin" ON public.admin_notifications;
CREATE POLICY "notif_delete_admin" ON public.admin_notifications
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- admin_settings (single row, text id) ----------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY DEFAULT 'admin',
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  delivery_radius_km int NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_admin_all" ON public.admin_settings;
CREATE POLICY "settings_admin_all" ON public.admin_settings
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_write" ON public.admin_settings;
CREATE POLICY "settings_admin_write" ON public.admin_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_admin_update" ON public.admin_settings;
CREATE POLICY "settings_admin_update" ON public.admin_settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- trigger: new-order notification ----------
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_notifications (order_id, message)
  VALUES (NEW.id, 'New order received from a shopkeeper.');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- ---------- updated_at trigger for orders ----------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_touch ON public.orders;
CREATE TRIGGER trg_orders_touch
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- realtime ----------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner ON public.orders(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON public.admin_notifications(is_read);

-- ---------- seed default admin_settings row ----------
INSERT INTO public.admin_settings (id, delivery_fee, delivery_radius_km)
VALUES ('admin', 0, 5)
ON CONFLICT (id) DO NOTHING;

-- ---------- storage bucket for product images ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_read_public" ON storage.objects;
CREATE POLICY "product_images_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_write_admin" ON storage.objects;
CREATE POLICY "product_images_write_admin" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
CREATE POLICY "product_images_update_admin" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;
CREATE POLICY "product_images_delete_admin" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());
