import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { inventoryApi } from '../api/inventory.js';
import { stockBadgeInfo } from '../utils/format.js';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';
import logo from '../assets/logo-cellbits.png';

function Label({ product, scanUrl }) {
  const { label } = stockBadgeInfo(product);
  return (
    <div className="label-sheet" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <div className="label-card">
        <div className="label-head">
          <div className="label-head-info">
            <strong className="label-name">{product.name}</strong>
            <span className="label-sku">{product.sku}</span>
          </div>
          <span className="badge" style={{
            background: product.quantity === 0 ? 'var(--danger-bg)' : product.quantity <= product.minQuantity ? 'var(--warning-bg)' : 'var(--success-bg)',
            color: product.quantity === 0 ? 'var(--danger)' : product.quantity <= product.minQuantity ? 'var(--warning)' : 'var(--success)',
          }}>
            {label}
          </span>
        </div>

        <div className="label-supplies">
          <div>
            <span>Stock</span>
            <strong>{product.quantity} {product.unit}</strong>
          </div>
          <div>
            <span>Ubicación</span>
            <strong>{product.location || '—'}</strong>
          </div>
          <div>
            <span>Categoría</span>
            <strong>{product.categoryName || '—'}</strong>
          </div>
        </div>

        {product.specs.length > 0 && (
          <ul className="label-specs">
            {product.specs.slice(0, 4).map((spec, index) => (
              <li key={index}>
                <span>{spec.key}</span>
                <strong>{spec.value}</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="label-footer">
          <div className="qr"><QRCodeSVG value={scanUrl} size={96} level="M" /></div>
          <div className="label-hint">
            <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={logo} alt="" style={{ width: 16, height: 16, borderRadius: '999px' }} />
              CellBits · Inventario
            </strong>
            <span>Escanea el código para ver la información de este producto.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintLabelPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const scanUrl = product ? `${window.location.origin}/scan/${product.id}` : '';

  useEffect(() => {
    inventoryApi
      .getById(id)
      .then(setProduct)
      .catch((err) => setError(err.response?.data?.message || 'No se encontró el producto.'));
  }, [id]);

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <Link to="/inventario">← Volver al inventario</Link>
      </div>
    );
  }

  if (!product) return <div className="alert">Cargando etiqueta…</div>;

  return (
    <>
      <style>{`
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .print-area { max-width: none !important; padding: 0 !important; margin: 0 !important; }
        }
        .label-card {
          width: 280px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #fff;
          padding: 16px;
          display: grid;
          gap: 12px;
          font-family: 'Segoe UI', sans-serif;
        }
        .label-head { display: flex; justify-content: space-between; gap: 8; align-items: flex-start; }
        .label-name { font-size: 15px; display: block; line-height: 1.2; }
        .label-sku { font-size: 12px; color: #64748b; }
        .label-supplies { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
        .label-supplies span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; }
        .label-supplies strong { font-size: 13px; }
        .label-specs { list-style: none; margin: 0; padding: 0; display: grid; gap: 4; }
        .label-specs li { display: flex; justify-content: space-between; font-size: 12px; gap: 8; }
        .label-specs li span { color: #64748b; }
        .label-footer { display: flex; gap: 12; align-items: center; }
        .label-hint { display: grid; gap: 2; font-size: 11px; color: #64748b; flex: 1; }
        .label-hint strong { color: #0f172a; font-size: 12px; }
      `}</style>

      <div className="no-print" style={{ display: 'grid', gap: 4, marginBottom: 16 }}>
        <Breadcrumbs items={[{ label: 'Panel', to: '/' }, { label: 'Inventario', to: '/inventario' }, { label: product.name, to: `/productos/${id}` }, { label: 'Imprimir QR' }]} />
      </div>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: 4, fontSize: 22 }}>Etiqueta QR</h1>
          <p className="muted" style={{ margin: 0 }}>
            Impírmela y pégala en el cajón del producto. Escanéala con el celular para consultar stock e información.
          </p>
        </div>
        <button type="button" className="btn" onClick={() => window.print()}>Imprimir</button>
      </div>

      <div className="print-area">
        <Label product={product} scanUrl={scanUrl} />
      </div>
    </>
  );
}