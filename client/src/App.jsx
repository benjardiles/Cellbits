import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Layout } from './components/Layout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { InventoryPage } from './pages/InventoryPage.jsx';
import { MovementsPage } from './pages/MovementsPage.jsx';
import { ProductFormPage } from './pages/ProductFormPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { PrintLabelPage } from './pages/PrintLabelPage.jsx';
import { ScanPage } from './pages/ScanPage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { ServiceFormPage } from './pages/ServiceFormPage.jsx';
import { ServiceDetailPage } from './pages/ServiceDetailPage.jsx';

// Las rutas internas antes vivían en la raíz (/inventario, /login...). Se
// redirigen a /app/... para no romper marcadores ni enlaces ya compartidos.
function LegacyRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/app${pathname}${search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Sitio público para clientes */}
      <Route path="/" element={<LandingPage />} />

      {/* El QR impreso en las etiquetas apunta aquí: no mover */}
      <Route path="/scan/:id" element={<ScanPage />} />

      {/* Sistema interno para trabajadores */}
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="movimientos" element={<MovementsPage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="servicios/nuevo" element={<ServiceFormPage />} />
          <Route path="servicios/:id" element={<ServiceDetailPage />} />
          <Route path="servicios/:id/editar" element={<ServiceFormPage />} />
          <Route path="productos/nuevo" element={<ProductFormPage />} />
          <Route path="productos/:id" element={<ProductDetailPage />} />
          <Route path="productos/:id/editar" element={<ProductFormPage />} />
          <Route path="productos/:id/imprimir" element={<PrintLabelPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Route>

      {['/login', '/inventario', '/movimientos', '/servicios/*', '/productos/*'].map((path) => (
        <Route key={path} path={path} element={<LegacyRedirect />} />
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
