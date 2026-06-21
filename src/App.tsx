import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Lazy load pages for code splitting (named exports wrapped to default)
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Tournaments = lazy(() => import('./pages/Tournaments').then(m => ({ default: m.Tournaments })));
const Rankings = lazy(() => import('./pages/Rankings').then(m => ({ default: m.Rankings })));
const StoreFinder = lazy(() => import('./pages/StoreFinder').then(m => ({ default: m.StoreFinder })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Academy = lazy(() => import('./pages/Academy').then(m => ({ default: m.Academy })));
const NewsFeed = lazy(() => import('./pages/NewsFeed').then(m => ({ default: m.NewsFeed })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-beyblade-electricCyan animate-spin"></div>
    </div>
    <p className="text-[10px] font-black text-beyblade-electricCyan uppercase tracking-widest animate-pulse">Cargando Arena...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/stores" element={<StoreFinder />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/news" element={<NewsFeed />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        
        {/* PWA Install Banner trigger */}
        <PWAInstallBanner />
      </AppLayout>
    </Router>
  );
};

export default App;
