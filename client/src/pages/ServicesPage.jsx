import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesApi } from '../api/services.js';
import { ServiceStatusBadge, PaymentStatusBadge } from '../components/Bits.jsx';
import { serviceTypeLabel, formatMoney, formatDate, SERVICE_STATUS_LABELS } from '../utils/format.js';
import { extractApiError } from '../api/client.js';

const PAGE_SIZE = 20;

export function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => ({ search, status, paymentStatus, offset }), [search, status, paymentStatus, offset]);

  useEffect(() => {
    setLoading(true);
    setError('');
    servicesApi
      .list({
        search: query.search || undefined,
        status: query.status || undefined,
        paymentStatus: query.paymentStatus || undefined,
        limit: PAGE_SIZE,
        offset: query.offset,
      })
      .then((result) => {
        setServices(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(extractApiError(err).message))
      .finally(() => setLoading(false));
  }, [query]);

  function handleSearch(value) {
    setSearch(value);
    setOffset(0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Servicios</h1>
          <p className="muted" style={{ marginTop: 0 }}>{total} servicio{total === 1 ? '' : 's'}</p>
        </div>
        <Link to="/servicios/nuevo" className="btn">+ Nuevo servicio</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Buscar por cliente, equipo o teléfono…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select className="select" style={{ maxWidth: 200 }} value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
          <option value="">Todos los estados</option>
          {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="select" style={{ maxWidth: 160 }} value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setOffset(0); }}>
          <option value="">Todos los pagos</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="alert">Cargando servicios…</div>
      ) : services.length === 0 ? (
        <div className="card empty-state">
          <p>No hay servicios para mostrar.</p>
          <Link to="/servicios/nuevo" className="btn">Registrar el primero</Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Precio</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/servicios/${service.id}`)}>
                <td>
                  <strong>{service.customerName}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{service.customerPhone || '—'}</div>
                </td>
                <td className="muted">{service.device || '—'}</td>
                <td>{serviceTypeLabel(service.type)}</td>
                <td><ServiceStatusBadge status={service.status} /></td>
                <td><PaymentStatusBadge paymentStatus={service.paymentStatus} /></td>
                <td>{formatMoney(service.price)}</td>
                <td className="muted">{formatDate(service.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
          <button type="button" className="btn btn-sm btn-secondary" disabled={currentPage <= 1} onClick={() => setOffset((currentPage - 2) * PAGE_SIZE)}>
            Anterior
          </button>
          <span className="muted">Página {currentPage} de {totalPages}</span>
          <button type="button" className="btn btn-sm btn-secondary" disabled={currentPage >= totalPages} onClick={() => setOffset(currentPage * PAGE_SIZE)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
