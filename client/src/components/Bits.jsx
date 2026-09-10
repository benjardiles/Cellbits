import { stockBadgeInfo, movementTypeInfo, serviceStatusInfo, paymentStatusInfo } from '../utils/format.js';

export function StockBadge({ product }) {
  const { label, tone } = stockBadgeInfo(product);
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function MovementTypeBadge({ type }) {
  const { label, tone } = movementTypeInfo(type);
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function ServiceStatusBadge({ status }) {
  const { label, tone } = serviceStatusInfo(status);
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function PaymentStatusBadge({ paymentStatus }) {
  const { label, tone } = paymentStatusInfo(paymentStatus);
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function StatCard({ label, value, tone = 'success' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 28, color: tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : 'var(--text)' }}>
        {value}
      </strong>
    </div>
  );
}