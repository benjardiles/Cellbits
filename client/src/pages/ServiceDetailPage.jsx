import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { servicesApi } from '../api/services.js';
import { ServiceStatusBadge, PaymentStatusBadge, MovementTypeBadge } from '../components/Bits.jsx';
import { serviceTypeLabel, formatMoney, formatDate, SERVICE_STATUS_LABELS } from '../utils/format.js';
import { extractApiError } from '../api/client.js';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [parts, setParts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [nextStatus, setNextStatus] = useState('');
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  function load() {
    servicesApi
      .getById(id)
      .then(({ service: s, parts: p, notifications: n }) => {
        setService(s);
        setParts(p);
        setNotifications(n);
        setNextStatus(s.status);
      })
      .catch((err) => setError(extractApiError(err).message));
  }

  useEffect(load, [id]);

  async function handleStatusUpdate() {
    setStatusError('');
    if (nextStatus === service.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await servicesApi.updateStatus(id, nextStatus);
      setService(updated);
      load();
    } catch (err) {
      setStatusError(extractApiError(err).message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar el servicio de "${service.customerName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await servicesApi.remove(id);
      navigate('/servicios');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <Link to="/servicios">← Volver a servicios</Link>
      </div>
    );
  }

  if (!service) return <div className="alert">Cargando…</div>;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Breadcrumbs items={[{ label: 'Panel', to: '/' }, { label: 'Servicios', to: '/servicios' }, { label: service.customerName }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{service.customerName}</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            {serviceTypeLabel(service.type)} · {service.device || 'Sin equipo especificado'}
          </p>
        </div>
        <div className="actions">
          <Link to={`/servicios/${id}/editar`} className="btn btn-secondary">Editar</Link>
          <button type="button" className="btn btn-secondary" onClick={handleDelete}>Eliminar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <ServiceStatusBadge status={service.status} /> <PaymentStatusBadge paymentStatus={service.paymentStatus} />
            <div style={{ marginTop: 10, fontSize: 32, fontWeight: 700 }}>{formatMoney(service.price)}</div>
          </div>

          <div>
            <label className="label">Actualizar estado</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button type="button" className="btn btn-sm" disabled={updatingStatus || nextStatus === service.status} onClick={handleStatusUpdate}>
                {updatingStatus ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
            {statusError && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{statusError}</p>}
          </div>

          <div>
            <label className="label">Contacto</label>
            <p style={{ margin: 0 }}>{service.customerPhone || 'Sin teléfono'}</p>
            <p className="muted" style={{ margin: 0 }}>{service.customerEmail || 'Sin correo'}</p>
          </div>

          <div>
            <label className="label">Notas</label>
            <p className="muted" style={{ margin: 0 }}>{service.description || 'Sin notas'}</p>
          </div>

          <div className="muted" style={{ fontSize: 13 }}>
            Recibido: {formatDate(service.createdAt)}
            <br />
            Última actualización: {formatDate(service.updatedAt)}
            {service.paidAt && <><br />Pagado: {formatDate(service.paidAt)}</>}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Repuestos usados</h2>
          {parts.length === 0 ? (
            <p className="muted">Este servicio no consumió repuestos del inventario.</p>
          ) : (
            <table className="table" style={{ border: 'none' }}>
              <tbody>
                {parts.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <Link to={`/productos/${movement.productId}`}>{movement.productName}</Link>
                      <div className="muted" style={{ fontSize: 12 }}>{movement.productSku}</div>
                    </td>
                    <td><MovementTypeBadge type={movement.type} /></td>
                    <td>{movement.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Notificaciones al cliente</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -8 }}>
            Se registran por cada cambio de estado. El envío real por WhatsApp/correo aún no está conectado.
          </p>
          {notifications.length === 0 ? (
            <p className="muted">Sin notificaciones registradas.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="badge badge-warning">Pendiente de envío</span>
                    <span className="muted" style={{ fontSize: 12 }}>{formatDate(n.createdAt)}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
