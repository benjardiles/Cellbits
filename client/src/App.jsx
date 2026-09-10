import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Layout } from './components/Layout.jsx';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/scan/:id" element={<ScanPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          <Route path="/movimientos" element={<MovementsPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/servicios/nuevo" element={<ServiceFormPage />} />
          <Route path="/servicios/:id" element={<ServiceDetailPage />} />
          <Route path="/servicios/:id/editar" element={<ServiceFormPage />} />
          <Route path="/productos/nuevo" element={<ProductFormPage />} />
          <Route path="/productos/:id" element={<ProductDetailPage />} />
          <Route path="/productos/:id/editar" element={<ProductFormPage />} />
          <Route path="/productos/:id/imprimir" element={<PrintLabelPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}