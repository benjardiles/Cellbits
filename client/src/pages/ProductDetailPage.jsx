import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.js';
import { movementsApi } from '../api/movements.js';
import { stockBadgeInfo, formatDate } from '../utils/format.js';
import { MovementTypeBadge } from '../components/Bits.jsx';
import { extractApiError } from '../api/client.js';
import { QRCodeSVG } from 'qrcode.react';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [scanUrl, setScanUrl] = useState('');
  const [error, setError] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState('');
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getById(id)
      .then((p) => {
        setProduct(p);
        setScanUrl(`${window.location.origin}/scan/${p.id}`);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se encontró el producto.'));
  }, [id]);

  function loadMovements() {
    setMovementsLoading(true);
    movementsApi
      .list({ productId: id, limit: 10 })
      .then((result) => setMovements(result.items))
      .finally(() => setMovementsLoading(false));
  }

  useEffect(loadMovements, [id]);

  async function handleAdjust(type) {
    const amount = Number(delta);
    if (!amount || amount <= 0) {
      setAdjustError('Indica una cantidad mayor a 0.');
      return;
    }
    if (!reason.trim()) {
      setAdjustError('El motivo es obligatorio.');
      return;
    }
    setAdjustError('');
    try {
      const signedDelta = type === 'entrada' ? amount : -amount;
      const { product: updated } = await inventoryApi.adjustQuantity(id, { type, delta: signedDelta, reason: reason.trim() });
      setProduct(updated);
      setReason('');
      loadMovements();
    } catch (err) {
      setAdjustError(extractApiError(err).message);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await inventoryApi.remove(id);
      navigate('/inventario');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar.');
    }
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <Link to="/inventario">← Volver al inventario</Link>
      </div>
    );
  }

  if (!product) return <div className="alert">Cargando…</div>;

  const { label, tone } = stockBadgeInfo(product);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Breadcrumbs items={[{ label: 'Panel', to: '/' }, { label: 'Inventario', to: '/inventario' }, { label: product.name }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{product.name}</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            SKU: <strong>{product.sku}</strong> · {product.categoryName || 'Sin categoría'}
          </p>
        </div>
        <div className="actions">
          <Link to={`/productos/${id}/imprimir`} className="btn">Imprimir QR</Link>
          <Link to={`/productos/${id}/editar`} className="btn btn-secondary">Editar</Link>
          <button type="button" className="btn btn-secondary" onClick={handleDelete}>Eliminar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <span className={`badge badge-${tone}`}>{label}</span>
            <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700 }}>
              {product.quantity} <span className="muted" style={{ fontSize: 18, fontWeight: 400 }}>{product.unit}</span>
            </div>
          </div>

          <div>
            <label className="label">Ajustar stock</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                style={{ maxWidth: 90 }}
              />
              <input
                className="input"
                type="text"
                placeholder="Motivo (ej. compra a proveedor, venta, merma…)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-sm" onClick={() => handleAdjust('entrada')}>+ Entrada</button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleAdjust('salida')}>− Salida</button>
            </div>
            {adjustError && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{adjustError}</p>}
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Mínimo recomendado: {product.minQuantity} {product.unit}
              {product.quantity <= product.minQuantity && product.quantity > 0 ? ' · ¡Considera reabastecer!' : ''}
            </p>
          </div>

          <div>
            <label className="label">Ubicación</label>
            <p style={{ margin: 0 }}>{product.location || 'No definida'}</p>
          </div>

          <div>
            <label className="label">Notas</label>
            <p className="muted" style={{ margin: 0 }}>{product.description || 'Sin notas'}</p>
          </div>

          <div className="muted" style={{ fontSize: 13 }}>
            Creado: {formatDate(product.createdAt)}
            <br />
            Actualizado: {formatDate(product.updatedAt)}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Especificaciones</h2>
          {product.specs.length === 0 ? (
            <p className="muted">Sin especificaciones.</p>
          ) : (
            <table className="table" style={{ border: 'none' }}>
              <tbody>
                {product.specs.map((spec, index) => (
                  <tr key={index}>
                    <td className="muted" style={{ width: '40%' }}>{spec.key}</td>
                    <td><strong>{spec.value}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Código QR</h2>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
            <QRCodeSVG value={scanUrl} size={180} level="M" />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Escanéalo con el celular para ver información y stock.
          </p>
          <Link to={`/productos/${id}/imprimir`} className="btn btn-sm">Imprimir etiqueta</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Historial de movimientos</h2>
          <Link to={`/movimientos?productId=${id}`} className="muted" style={{ fontSize: 13 }}>Ver todo →</Link>
        </div>
        {movementsLoading ? (
          <p className="muted">Cargando…</p>
        ) : movements.length === 0 ? (
          <p className="muted">Sin movimientos registrados.</p>
        ) : (
          <table className="table" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="muted">{formatDate(movement.createdAt)}</td>
                  <td><MovementTypeBadge type={movement.type} /></td>
                  <td>{movement.delta > 0 ? `+${movement.delta}` : movement.delta}</td>
                  <td>{movement.reason || '—'}</td>
                  <td className="muted">{movement.username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}