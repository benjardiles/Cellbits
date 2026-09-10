import { Link } from 'react-router-dom';

export function Breadcrumbs({ items }) {
  return (
    <nav
      aria-label="breadcrumb"
      style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {isLast || !item.to ? (
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
