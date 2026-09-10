import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { movementsApi } from '../api/movements.js';
import { MovementTypeBadge } from '../components/Bits.jsx';
import { formatDate } from '../utils/format.js';
import { extractApiError } from '../api/client.js';

const PAGE_SIZE = 20;

export function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('productId') || '';
  const serviceId = searchParams.get('serviceId') || '';
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => ({ search, type, productId, serviceId, offset }), [search, type, productId, serviceId, offset]);

  useEffect(() => {
    setLoading(true);
    setError('');
    movementsApi
      .list({
        search: query.search || undefined,
        type: query.type || undefined,
        productId: query.productId || undefined,
        serviceId: query.serviceId || undefined,
        limit: PAGE_SIZE,
        offset: query.offset,
      })
      .then((result) => {
        setMovements(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(extractApiError(err).message))
      .finally(() => setLoading(false));
  }, [query]);

  function handleSearch(value) {
    setSearch(value);
    setOffset(0);
  }

  function handleTypeChange(value) {
    setType(value);
    setOffset(0);
  }

  function clearProductFilter() {
    setSearchParams({});
    setOffset(0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>Movimientos</h1>
        <p className="muted" style={{ marginTop: 0 }}>{total} movimiento{total === 1 ? '' : 's'} registrados.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Buscar por nombre o SKU de producto…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select className="select" style={{ maxWidth: 160 }} value={type} onChange={(e) => handleTypeChange(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
          <option value="ajuste">Ajuste</option>
        </select>
        {productId && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={clearProductFilter}>
            Quitar filtro de producto ✕
          </button>
        )}
        {serviceId && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={clearProductFilter}>
            Quitar filtro de servicio ✕
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="alert">Cargando movimientos…</div>
      ) : movements.length === 0 ? (
        <div className="card empty-state">
          <p>No hay movimientos para mostrar.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Servicio</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td className="muted">{formatDate(movement.createdAt)}</td>
                <td>
                  <Link to={`/productos/${movement.productId}`}>{movement.productName}</Link>
                  <div className="muted" style={{ fontSize: 13 }}>{movement.productSku}</div>
                </td>
                <td><MovementTypeBadge type={movement.type} /></td>
                <td>{movement.delta > 0 ? `+${movement.delta}` : movement.delta}</td>
                <td>{movement.reason || '—'}</td>
                <td>{movement.serviceId ? <Link to={`/servicios/${movement.serviceId}`}>Ver servicio</Link> : <span className="muted">—</span>}</td>
                <td className="muted">{movement.username || '—'}</td>
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
