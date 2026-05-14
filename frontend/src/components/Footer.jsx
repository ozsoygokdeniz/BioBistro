import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bb-footer">
    <div className="bb-footer-inner">
      <div>
        <span className="bb-footer-logo">BIOBISTRO</span>
        <p style={{ color: 'rgba(240,240,243,0.55)', fontSize: 13, lineHeight: 1.6 }}>
          © 2025 BioBistro Health.<br />
          Kişiselleştirilmiş sağlık analizleri.
        </p>
      </div>
      <nav className="bb-footer-links">
        <a href="#" className="bb-footer-link">Gizlilik Politikası</a>
        <a href="#" className="bb-footer-link">Kullanım Şartları</a>
        <a href="#" className="bb-footer-link">Klinik Standartlar</a>
        <a href="#" className="bb-footer-link">Destek</a>
        <a href="#" className="bb-footer-link">İletişim</a>
      </nav>
    </div>
  </footer>
);

export default Footer;
