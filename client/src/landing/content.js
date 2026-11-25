// Contenido editable de la landing pública (cellbits.cl).
// Cambia los textos y datos de contacto aquí, sin tocar el diseño.
// Los campos de contacto vacíos ('') simplemente no se muestran.

export const business = {
  name: 'CellBits',
  tagline: 'Servicio técnico de celulares y computadores',
  email: 'cellbits.cl@gmail.com',
  // Solo dígitos con código de país, ej: '56912345678'. Activa el botón de WhatsApp.
  whatsapp: '56977653343',
  // Ej: 'Av. Siempre Viva 742, Santiago'
  address: '',
  // Link de Google Maps a la tienda (opcional)
  mapsUrl: '',
  // Ej: 'Lunes a viernes 10:00–19:00 · Sábado 10:00–14:00'
  hours: 'Lunes a viernes · 9:00 a 18:00 hrs',
  instagram: '', // ej: 'cellbits.cl' (sin @)
};

export const hero = {
  title: 'Tu equipo, en buenas manos.',
  subtitle:
    'Reparamos celulares y computadores, cambiamos repuestos e instalamos software. Te mantenemos al tanto de cada paso hasta que lo retires.',
};

export const services = [
  {
    icon: 'phone',
    title: 'Reparación de celulares',
    text: 'Pantallas, baterías, puertos de carga, cámaras y fallas de placa.',
  },
  {
    icon: 'laptop',
    title: 'Reparación de computadores',
    text: 'Notebooks y PC de escritorio: hardware, limpieza y fallas de encendido.',
  },
  {
    icon: 'parts',
    title: 'Cambio de partes',
    text: 'Reemplazo de componentes con repuestos que mantenemos en stock.',
  },
  {
    icon: 'software',
    title: 'Instalación de software',
    text: 'Sistemas operativos, programas, respaldos y puesta a punto.',
  },
  {
    icon: 'search',
    title: 'Diagnóstico',
    text: 'Revisamos tu equipo y te explicamos qué tiene antes de reparar.',
  },
  {
    icon: 'bag',
    title: 'Accesorios y repuestos',
    text: 'Cargadores, cables, protectores y repuestos para tus equipos.',
  },
];

export const steps = [
  { title: 'Recibimos tu equipo', text: 'Registramos el equipo y la falla que nos describes.' },
  { title: 'Diagnóstico', text: 'Revisamos el equipo y te contamos qué necesita.' },
  { title: 'Reparación', text: 'Trabajamos en tu equipo con los repuestos necesarios.' },
  { title: 'Listo para retirar', text: 'Te avisamos por correo cuando puedes pasar a buscarlo.' },
];
