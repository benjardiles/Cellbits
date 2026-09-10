import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.js';
import { servicesApi } from '../api/services.js';
import { StockBadge, StatCard, ServiceStatusBadge, PaymentStatusBadge } from '../components/Bits.jsx';
import { formatDate, formatMoney, serviceTypeLabel } from '../utils/format.js';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [servicesData, setServicesData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    inventoryApi
      .dashboard()
      .then(setData)
      .catch(() => setError('No se pudo cargar el panel.'));
    servicesApi
      .dashboard()
      .then(setServicesData)
      .catch(() => setServicesData(null));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="alert">Cargando panel…</div>;

  const { totals, lowStockProducts, recentProducts } = data;
  const serviceTotals = servicesData?.totals;
  const activeServices = serviceTotals
    ? serviceTotals.totalServices - (serviceTotals.byStatus.entregado ?? 0) - (serviceTotals.byStatus.cancelado ?? 0)
    : 0;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Panel</h1>
        <p className="muted" style={{ marginTop: 0 }}>Resumen del inventario.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Productos" value={totals.totalProducts} />
        <StatCard label="Unidades totales" value={totals.totalUnits} />
        <StatCard label="Stock bajo / agotado" value={totals.lowStock} tone={totals.lowStock > 0 ? 'warning' : 'success'} />
      </div>

      {serviceTotals && (
        <div>
          <h2 style={{ fontSize: 16 }}>Servicios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatCard label="Servicios activos" value={activeServices} />
            <StatCard label="Pagos pendientes" value={`${serviceTotals.pendingPaymentCount} · ${formatMoney(serviceTotals.pendingPaymentTotal)}`} tone={serviceTotals.pendingPaymentCount > 0 ? 'warning' : 'success'} />
            <StatCard label="Ingresos hoy" value={formatMoney(serviceTotals.paidTodayTotal)} />
            <StatCard label="Ingresos del mes" value={formatMoney(serviceTotals.paidMonthTotal)} />
          </div>
        </div>
      )}

      {servicesData?.recentServices?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, marginTop: 0 }}>Servicios recientes</h2>
            <Link to="/servicios" className="muted" style={{ fontSize: 13 }}>Ver todos →</Link>
          </div>
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {servicesData.recentServices.map((service) => (
                <tr key={service.id}>
                  <td><Link to={`/servicios/${service.id}`}>{service.customerName}</Link></td>
                  <td className="muted">{serviceTypeLabel(service.type)}</td>
                  <td><ServiceStatusBadge status={service.status} /></td>
                  <td><PaymentStatusBadge paymentStatus={service.paymentStatus} /></td>
                  <td>{formatMoney(service.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Productos por reabastecer</h2>
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.id}>
                  <td><Link to={`/productos/${product.id}`}>{product.name}</Link></td>
                  <td className="muted">{product.location || '—'}</td>
                  <td>{product.quantity} {product.unit}</td>
                  <td>{product.minQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Agregados recientemente</h2>
        {recentProducts.length === 0 ? (
          <p className="muted">Aún no hay productos. <Link to="/productos/nuevo">Añade el primero.</Link></p>
        ) : (
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => (
                <tr key={product.id}>
                  <td><Link to={`/productos/${product.id}`}>{product.name}</Link></td>
                  <td className="muted">{product.sku}</td>
                  <td className="muted">{product.location || '—'}</td>
                  <td>{product.quantity} {product.unit}</td>
                  <td><StockBadge product={product} /></td>
                  <td className="muted">{formatDate(product.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}