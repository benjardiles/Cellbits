import { useEffect, useState } from 'react';
import logo from '../assets/logo-cellbits.png';
import { business, hero, services, steps } from '../landing/content.js';
import '../styles/landing.css';

const icons = {
  phone: <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" />,
  laptop: <path d="M4 5h16v10H4zM2 19h20" />,
  parts: <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6zM10 10h4v4h-4z" />,
  software: <path d="M4 4h16v16H4zM4 9h16M8 13l-2 2 2 2M12 17h4" />,
  search: <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4" />,
  bag: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function whatsappLink() {
  if (!business.whatsapp) return '';
  const text = encodeURIComponent(`Hola ${business.name}, quiero consultar por un servicio técnico.`);
  return `https://wa.me/${business.whatsapp}?text=${text}`;
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const wa = whatsappLink();
  const primaryCta = wa
    ? { href: wa, label: 'Escríbenos por WhatsApp' }
    : { href: `mailto:${business.email}`, label: 'Escríbenos' };

  useEffect(() => {
    document.title = `${business.name} · ${business.tagline}`;
    return () => { document.title = 'CellBits'; };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <a href="#inicio" className="lp-brand" onClick={closeMenu}>
            <img src={logo} alt="" width="36" height="36" />
            <span className="brand-word">{business.name}</span>
          </a>
          <nav className={`lp-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#servicios" onClick={closeMenu}>Servicios</a>
            <a href="#proceso" onClick={closeMenu}>Cómo trabajamos</a>
            <a href="#contacto" onClick={closeMenu}>Contacto</a>
          </nav>
          <button
            type="button"
            className="lp-burger"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <section id="inicio" className="lp-hero">
        <div className="lp-wrap lp-hero-inner">
          <div>
            <p className="lp-eyebrow">{business.tagline}</p>
            <h1>{hero.title}</h1>
            <p className="lp-lead">{hero.subtitle}</p>
            <div className="lp-ctas">
              <a className="lp-btn" href={primaryCta.href} target={wa ? '_blank' : undefined} rel="noreferrer">
                {primaryCta.label}
              </a>
              <a className="lp-btn lp-btn-ghost" href="#servicios">Ver servicios</a>
            </div>
          </div>
          <div className="lp-hero-mark" aria-hidden="true">
            <img src={logo} alt="" />
          </div>
        </div>
      </section>

      <section id="servicios" className="lp-section">
        <div className="lp-wrap">
          <h2>Servicios</h2>
          <p className="lp-section-lead">Todo lo que tu equipo necesita, en un solo lugar.</p>
          <div className="lp-grid">
            {services.map((s) => (
              <article key={s.title} className="lp-card">
                <span className="lp-card-icon"><Icon name={s.icon} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="lp-section lp-section-alt">
        <div className="lp-wrap">
          <h2>Cómo trabajamos</h2>
          <p className="lp-section-lead">Sabes en qué estado está tu equipo en todo momento.</p>
          <ol className="lp-steps">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="lp-step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="contacto" className="lp-section lp-contact">
        <div className="lp-wrap lp-contact-inner">
          <div>
            <h2>¿Tu equipo necesita ayuda?</h2>
            <p className="lp-section-lead">Cuéntanos qué le pasa y te orientamos.</p>
            <div className="lp-ctas">
              <a className="lp-btn" href={primaryCta.href} target={wa ? '_blank' : undefined} rel="noreferrer">
                {primaryCta.label}
              </a>
            </div>
          </div>
          <dl className="lp-contact-list">
            {business.address && (
              <div>
                <dt>Dirección</dt>
                <dd>
                  {business.mapsUrl
                    ? <a href={business.mapsUrl} target="_blank" rel="noreferrer">{business.address}</a>
                    : business.address}
                </dd>
              </div>
            )}
            {business.hours && (<div><dt>Horario</dt><dd>{business.hours}</dd></div>)}
            {business.whatsapp && (
              <div><dt>WhatsApp</dt><dd><a href={wa} target="_blank" rel="noreferrer">+{business.whatsapp}</a></dd></div>
            )}
            <div><dt>Correo</dt><dd><a href={`mailto:${business.email}`}>{business.email}</a></dd></div>
            {business.instagram && (
              <div>
                <dt>Instagram</dt>
                <dd><a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noreferrer">@{business.instagram}</a></dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <span>© {new Date().getFullYear()} {business.name}</span>
        </div>
      </footer>
    </div>
  );
}
