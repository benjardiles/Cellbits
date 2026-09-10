import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { http } from '../api/client.js';
import { stockBadgeInfo } from '../utils/format.js';
import { QRCodeSVG } from 'qrcode.react';

export function ScanPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [scanUrl, setScanUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    http
      .get(`/inventory/public/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setScanUrl(data.scanUrl);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se encontró el producto.'));
  }, [id]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <h1>Cellbits</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <h1>Cellbits</h1>
        <div className="alert">Consultando producto…</div>
      </div>
    );
  }

  const { label, tone } = stockBadgeInfo(product);

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>{product.name}</h1>
          <p className="muted" style={{ margin: 0 }}>SKU: {product.sku}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <span className="muted" style={{ fontSize: 13 }}>Stock / {product.unit}</span>
            <div style={{ fontSize: 48, fontWeight: 800, color: product.quantity === 0 ? 'var(--danger)' : product.quantity <= product.minQuantity ? 'var(--warning)' : 'var(--success)' }}>
              {product.quantity}
            </div>
            <span className={`badge badge-${tone}`}>{label}</span>
          </div>

          <div className="card" style={{ display: 'grid', gap: 12, padding: 24 }}>
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Ubicación</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{product.location || 'No definida'}</div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Categoría</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{product.categoryName || '—'}</div>
            </div>
            {product.description && (
              <div>
                <span className="muted" style={{ fontSize: 13 }}>Notas</span>
                <div style={{ fontSize: 15 }}>{product.description}</div>
              </div>
            )}
          </div>
        </div>

        {product.specs.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16 }}>Especificaciones</h2>
            <table className="table">
              <tbody>
                {product.specs.map((spec, index) => (
                  <tr key={index}>
                    <td className="muted" style={{ width: '40%' }}>{spec.key}</td>
                    <td><strong>{spec.value}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <div style={{ display: 'inline-block', background: '#fff', padding: 8, borderRadius: 10, border: '1px solid var(--border)' }}>
            <QRCodeSVG value={scanUrl} size={88} level="M" />
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Retroalimentación con este QR · {product.updatedAt?.slice(0, 10)}</p>
        </div>
      </div>
    </div>
  );
}