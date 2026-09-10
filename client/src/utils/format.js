export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function stockBadgeInfo(product) {
  if (product.quantity === 0) return { label: 'Agotado', tone: 'danger' };
  if (product.quantity <= product.minQuantity) return { label: 'Stock bajo', tone: 'warning' };
  return { label: 'Disponible', tone: 'success' };
}

export function movementTypeInfo(type) {
  if (type === 'entrada') return { label: 'Entrada', tone: 'success' };
  if (type === 'salida') return { label: 'Salida', tone: 'danger' };
  return { label: 'Ajuste', tone: 'warning' };
}

export const SERVICE_TYPE_LABELS = {
  reparacion: 'Reparación',
  instalacion: 'Instalación',
  cambio_partes: 'Cambio de partes',
  diagnostico: 'Diagnóstico',
  otro: 'Otro',
};

export const SERVICE_STATUS_LABELS = {
  recibido: 'Recibido',
  en_diagnostico: 'En diagnóstico',
  en_reparacion: 'En reparación',
  listo_para_entrega: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function serviceTypeLabel(type) {
  return SERVICE_TYPE_LABELS[type] ?? type;
}

export function serviceStatusInfo(status) {
  if (status === 'listo_para_entrega' || status === 'entregado') return { label: SERVICE_STATUS_LABELS[status], tone: 'success' };
  if (status === 'cancelado') return { label: SERVICE_STATUS_LABELS[status], tone: 'danger' };
  return { label: SERVICE_STATUS_LABELS[status] ?? status, tone: 'warning' };
}

export function paymentStatusInfo(paymentStatus) {
  if (paymentStatus === 'pagado') return { label: 'Pagado', tone: 'success' };
  return { label: 'Pendiente', tone: 'warning' };
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value) || 0);
}