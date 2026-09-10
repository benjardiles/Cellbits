import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.js';
import { StockBadge } from '../components/Bits.jsx';
import { extractApiError } from '../api/client.js';

const PAGE_SIZE = 20;

export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => ({ search, lowStockOnly, offset }), [search, lowStockOnly, offset]);

  useEffect(() => {
    setLoading(true);
    setError('');
    inventoryApi
      .list({
        search: query.search || undefined,
        lowStock: query.lowStockOnly || undefined,
        limit: PAGE_SIZE,
        offset: query.offset,
      })
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
      })
      .catch((err) => setError(extractApiError(err).message))
      .finally(() => setLoading(false));
  }, [query]);

  function handleSearch(value) {
    setSearch(value);
    setOffset(0);
  }

  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await inventoryApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Inventario</h1>
          <p className="muted" style={{ marginTop: 0 }}>{total} producto{total === 1 ? '' : 's'}</p>
        </div>
        <Link to="/productos/nuevo" className="btn">+ Añadir producto</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 220 }}
          placeholder="Buscar por nombre, SKU o ubicación…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setOffset(0);
            }}
          />
          Solo con stock bajo
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="alert">Cargando productos…</div>
      ) : products.length === 0 ? (
        <div className="card empty-state">
          <p>No hay productos para mostrar.</p>
          <Link to="/productos/nuevo" className="btn">Añadir el primer producto</Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Ubicación</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/productos/${product.id}`)}>
                <td>
                  <strong>{product.name}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{product.description ? product.description.slice(0, 60) : ''}</div>
                </td>
                <td className="muted">{product.sku}</td>
                <td>{product.categoryName || '—'}</td>
                <td className="muted">{product.location || '—'}</td>
                <td>
                  <strong>{product.quantity}</strong> {product.unit}
                </td>
                <td><StockBadge product={product} /></td>
                <td>
                  <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/productos/${product.id}/imprimir`} className="btn btn-sm btn-secondary" title="Imprimir etiqueta QR">QR</Link>
                    <Link to={`/productos/${product.id}/editar`} className="btn btn-sm btn-secondary">Editar</Link>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(product)}>Eliminar</button>
                  </div>
                </td>
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