import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryApi } from '../api/inventory.js';
import { extractApiError } from '../api/client.js';
import { Breadcrumbs } from '../components/Breadcrumbs.jsx';

const emptySpec = { key: '', value: '' };

function buildInitialForm(product) {
  if (!product) {
    return {
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      minQuantity: 0,
      unit: 'unidad',
      location: '',
      categoryId: '',
      specs: [emptySpec],
    };
  }
  return {
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    quantity: product.quantity,
    minQuantity: product.minQuantity,
    unit: product.unit,
    location: product.location || '',
    categoryId: product.categoryId ?? '',
    specs: product.specs.length ? product.specs.map((s) => ({ ...s })) : [emptySpec],
  };
}

export function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(() => buildInitialForm(null));
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inventoryApi
      .listCategories()
      .then((list) => setCategories(list))
      .catch(() => setCategories([]));

    if (isEditing) {
      inventoryApi
        .getById(id)
        .then((product) => setForm(buildInitialForm(product)))
        .catch((err) => setError(extractApiError(err).message))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setSpec(index, field, value) {
    setForm((prev) => {
      const specs = prev.specs.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec));
      return { ...prev, specs };
    });
  }

  function addSpec() {
    setForm((prev) => ({ ...prev, specs: [...prev.specs, emptySpec] }));
  }

  function removeSpec(index) {
    setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }));
  }

  async function createCategory() {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const category = await inventoryApi.createCategory(name);
      setCategories((prev) => [...prev, category]);
      setForm((prev) => ({ ...prev, categoryId: category.id }));
      setNewCategory('');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      minQuantity: Number(form.minQuantity),
      unit: form.unit,
      location: form.location,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      specs: form.specs.filter((s) => s.key.trim()),
    };

    try {
      if (isEditing) {
        await inventoryApi.update(id, payload);
        navigate(`/productos/${id}`);
      } else {
        // La cantidad inicial solo se pide al crear; después, todo cambio de
        // stock debe pasar por "Ajustar stock" en el detalle del producto.
        const { product } = await inventoryApi.create({ ...payload, quantity: Number(form.quantity) });
        navigate(`/productos/${product.id}`);
      }
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="alert">Cargando producto…</div>;

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
      <Breadcrumbs
        items={
          isEditing
            ? [{ label: 'Panel', to: '/' }, { label: 'Inventario', to: '/inventario' }, { label: form.name || 'Producto', to: `/productos/${id}` }, { label: 'Editar' }]
            : [{ label: 'Panel', to: '/' }, { label: 'Inventario', to: '/inventario' }, { label: 'Añadir producto' }]
        }
      />
      <div>
        <h1 style={{ marginBottom: 4 }}>{isEditing ? 'Editar producto' : 'Añadir producto'}</h1>
        <p className="muted" style={{ marginTop: 0 }}>Completa las especificaciones. Al guardarlo podrás imprimir su etiqueta QR.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 16 }}>
        <div className="form-grid">
          <div className="full">
            <label className="label" htmlFor="name">Nombre *</label>
            <input id="name" className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>

          <div>
            <label className="label" htmlFor="sku">SKU / código *</label>
            <input id="sku" className="input" value={form.sku} onChange={(e) => setField('sku', e.target.value)} required placeholder="Ej: CEL-IPHONE-13" />
          </div>

          <div>
            <label className="label" htmlFor="unit">Unidad *</label>
            <input id="unit" className="input" value={form.unit} onChange={(e) => setField('unit', e.target.value)} required />
          </div>

          {isEditing ? (
            <div>
              <label className="label">Cantidad actual</label>
              <p style={{ margin: '10px 0 0' }}>{form.quantity} {form.unit}</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Para cambiar el stock, usa "Ajustar stock" en el detalle del producto (queda registrado en el historial).
              </p>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="quantity">Cantidad inicial *</label>
              <input id="quantity" className="input" type="number" min="0" step="1" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} required />
            </div>
          )}

          <div>
            <label className="label" htmlFor="minQuantity">Cantidad mínima (alerta)</label>
            <input id="minQuantity" className="input" type="number" min="0" step="1" value={form.minQuantity} onChange={(e) => setField('minQuantity', e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="location">Ubicación (cajón/gaveta)</label>
            <input id="location" className="input" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Ej: Cajón B-12" />
          </div>

          <div>
            <label className="label" htmlFor="category">Categoría</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select id="category" className="select" value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="input"
                placeholder="Crear categoría…"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={createCategory}>Crear</button>
            </div>
          </div>

          <div className="full">
            <label className="label" htmlFor="description">Descripción / notas</label>
            <textarea id="description" className="textarea" rows="3" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="label" style={{ marginBottom: 0 }}>Especificaciones (visible en el QR)</label>
            <button type="button" className="btn btn-sm btn-secondary" onClick={addSpec}>+ Añadir</button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {form.specs.map((spec, index) => (
              <div key={index} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="Etiqueta. Ej: Marca, Modelo, Color…"
                  value={spec.key}
                  onChange={(e) => setSpec(index, 'key', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Valor"
                  value={spec.value}
                  onChange={(e) => setSpec(index, 'value', e.target.value)}
                />
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => removeSpec(index)} title="Quitar">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Añadir producto'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}