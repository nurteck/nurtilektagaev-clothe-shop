import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Feed from './pages/Feed/Feed';
import Catalog from './pages/Catalog/Catalog';
import ProductPage from './pages/Product/ProductPage';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Favorites from './pages/Favorites/Favorites';
import Orders from './pages/Orders/Orders';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminBanners from './pages/Admin/Banners';
import AdminHomeNav from './pages/Admin/HomeNav';
import AdminOrders from './pages/Admin/Orders';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="feed" element={<Feed />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="orders" element={<Orders />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="home-nav" element={<AdminHomeNav />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
    </Routes>
  );
}
