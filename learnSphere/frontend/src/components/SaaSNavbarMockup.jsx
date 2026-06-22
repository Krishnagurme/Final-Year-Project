import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import '../styles/SaaSNavbarMockup.css';

const links = ['Templates', 'Showcase', 'Pricing', 'Guides'];

const SaaSNavbarMockup = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar-mockup-page">
      <header className="saas-navbar-shell">
        <div className="saas-navbar">
          <a href="#" className="saas-brand" aria-label="Brand logo and name">
            <span className="saas-brand__icon" aria-hidden="true">
              <span className="saas-brand__dot" />
            </span>
            <span className="saas-brand__name">Northline</span>
          </a>

          <nav className="saas-nav-links" aria-label="Primary navigation">
            {links.map(link => (
              <a key={link} href="#" className="saas-nav-link">
                {link}
              </a>
            ))}
          </nav>

          <div className="saas-nav-actions">
            <a href="#" className="saas-btn saas-btn--ghost">
              Login
            </a>
            <a href="#" className="saas-btn saas-btn--primary">
              Sign Up
            </a>
          </div>

          <button
            type="button"
            className="saas-menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="saas-mobile-panel">
            <nav className="saas-mobile-links" aria-label="Mobile navigation">
              {links.map(link => (
                <a key={link} href="#" className="saas-mobile-link">
                  {link}
                </a>
              ))}
            </nav>
            <div className="saas-mobile-actions">
              <a href="#" className="saas-btn saas-btn--ghost">
                Login
              </a>
              <a href="#" className="saas-btn saas-btn--primary">
                Sign Up
              </a>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default SaaSNavbarMockup;
