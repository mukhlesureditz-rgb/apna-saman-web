import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/ui/Toast';
import { ShopLayout } from './components/layout/ShopLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RequireShop, RequireAdmin, RedirectIfAuthed } from './components/guards/RequireShop';

import { ShopLogin } from './pages/auth/ShopLogin';
import { ShopRegister } from './pages/auth/ShopRegister';
import { AdminLogin } from './pages/auth/AdminLogin';

import { Home } from './pages/shop/Home';
import { Categories } from './pages/shop/Categories';
import { Cart } from './pages/shop/Cart';
import { Orders } from './pages/shop/Orders';
import { OrderDetails } from './pages/shop/OrderDetails';
import { Profile } from './pages/shop/Profile';

import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminOrderDetails } from './pages/admin/AdminOrderDetails';
import { AdminShops } from './pages/admin/AdminShops';
import { AdminSettings } from './pages/admin/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <Routes>
              {/* Auth */}
              <Route element={<RedirectIfAuthed to="/" />}>
                <Route path="/login" element={<ShopLogin />} />
                <Route path="/register" element={<ShopRegister />} />
                <Route path="/admin/login" element={<AdminLogin />} />
              </Route>

              {/* Shopkeeper app */}
              <Route element={<RequireShop />}>
                <Route element={<ShopLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetails />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Admin app */}
              <Route element={<RequireAdmin />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
                  <Route path="/admin/shops" element={<AdminShops />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
