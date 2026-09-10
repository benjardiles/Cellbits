import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesApi } from '../api/services.js';
import { inventoryApi } from '../api/inventory.js';
import { extractApiError } from '../api/client.js';
import { SERVICE_TYPE_LABELS } from '../utils/format.js';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';

const emptyPart = { productId: '', quantity: 1 };

function buildInitialForm(service) {
  if (!service) {
    return {
      type: 'reparacion',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      device: '',
      description: '',
      price: 0,
      paymentStatus: 'pendiente',
      parts: [],
    };
  }
  return {
    type: service.type,
    customerName: service.customerName,
    customerPhone: service.customerPhone || '',
    customerEmail: service.customerEmail || '',
    device: service.device || '',
    description: service.description || '',
    price: service.price,
    paymentStatus: service.paymentStatus,
    parts: [],
  };
}

export function ServiceFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(() => buildInitialForm(null));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inventoryApi
      .list({ limit: 500 })
      .then((result) => setProducts(result.items))
      .catch(() => setProducts([]));

    if (isEditing) {
      servicesApi
        .getById(id)
        .then(({ service }) => setForm(buildInitialForm(service)))
        .catch((err) => setError(extractApiError(err).message))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setPart(index, field, value) {
    setForm((prev) => {
      const parts = prev.parts.map((part, i) => (i === index ? { ...part, [field]: value } : part));
      return { ...prev, parts };
    });
  }

  function addPart() {
    setForm((prev) => ({ ...prev, parts: [...prev.parts, { ...emptyPart }] }));
  }

  function removePart(index) {
    setForm((prev) => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        const payload = {
          type: form.type,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          device: form.device,
          description: form.description,
          price: Math.round(Number(form.price)),
          paymentStatus: form.paymentStatus,
        };
        await servicesApi.update(id, payload);
        navigate(`/servicios/${id}`);
      } else {
        const payload = {
          type: form.type,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          device: form.device,
          description: form.description,
          price: Math.round(Number(form.price)),
          paymentStatus: form.paymentStatus,
          parts: form.parts
            .filter((p) => p.productId)
            .map((p) => ({ productId: p.productId, quantity: Number(p.quantity) })),
        };
        const service = await servicesApi.create(payload);
        navigate(`/servicios/${service.id}`);
      }
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="alert">Cargando servicio…</div>;

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
      <Breadcrumbs
        items={
          isEditing
            ? [{ label: 'Panel', to: '/' }, { label: 'Servicios', to: '/servicios' }, { label: form.customerName || 'Servicio', to: `/servicios/${id}` }, { label: 'Editar' }]
            : [{ label: 'Panel', to: '/' }, { label: 'Servicios', to: '/servicios' }, { label: 'Nuevo servicio' }]
        }
      />
      <div>
        <h1 style={{ marginBottom: 4 }}>{isEditing ? 'Editar servicio' : 'Nuevo servicio'}</h1>
        <p className="muted" style={{ marginTop: 0 }}>Reparación, instalación, cambio de partes o diagnóstico técnico.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 16 }}>
        <div className="form-grid">
          <div>
            <label className="label" htmlFor="type">Tipo de servicio *</label>
            <select id="type" className="select" value={form.type} onChange={(e) => setField('type', e.target.value)} required>
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="price">Precio (CLP) *</label>
            <input id="price" className="input" type="number" min="0" step="1" value={form.price} onChange={(e) => setField('price', e.target.value)} required />
          </div>

          <div>
            <label className="label" htmlFor="customerName">Cliente *</label>
            <input id="customerName" className="input" value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} required />
          </div>

          <div>
            <label className="label" htmlFor="customerPhone">Teléfono</label>
            <input id="customerPhone" className="input" value={form.customerPhone} onChange={(e) => setField('customerPhone', e.target.value)} placeholder="Para notificarle el avance" />
          </div>

          <div>
            <label className="label" htmlFor="customerEmail">Correo</label>
            <input id="customerEmail" className="input" type="email" value={form.customerEmail} onChange={(e) => setField('customerEmail', e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="device">Equipo</label>
            <input id="device" className="input" value={form.device} onChange={(e) => setField('device', e.target.value)} placeholder="Ej: iPhone 13 - pantalla rota" />
          </div>

          <div>
            <label className="label" htmlFor="paymentStatus">Estado de pago</label>
            <select id="paymentStatus" className="select" value={form.paymentStatus} onChange={(e) => setField('paymentStatus', e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          <div className="full">
            <label className="label" htmlFor="description">Notas del servicio</label>
            <textarea id="description" className="textarea" rows="3" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
        </div>

        {!isEditing && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="label" style={{ marginBottom: 0 }}>Repuestos usados (se descuentan del inventario)</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addPart}>+ Añadir repuesto</button>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {form.parts.map((part, index) => (
                <div key={index} style={{ display: 'flex', gap: 8 }}>
                  <select className="select" value={part.productId} onChange={(e) => setPart(index, 'productId', e.target.value)}>
                    <option value="">Selecciona un producto…</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) — stock: {product.quantity}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={part.quantity}
                    onChange={(e) => setPart(index, 'quantity', e.target.value)}
                    style={{ maxWidth: 90 }}
                  />
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => removePart(index)} title="Quitar">✕</button>
                </div>
              ))}
              {form.parts.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Sin repuestos vinculados. Este servicio es solo mano de obra.</p>}
            </div>
          </div>
        )}

        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar servicio'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
