import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo-official">
          <img src="/brand-logo-official.png" className="logo-base" alt="Sharjah Logo" />
          <img src="/brand-logo-official.png" className="logo-overlay" alt="Sharjah Logo Text" />
        </div>





        <div className="navbar-title">
          <h1>إدارة بناء ورعاية المساجد</h1>
          <p>دائرة الشؤون الإسلامية — الشارقة</p>
        </div>
      </Link>

      <ul className="navbar-nav">
        <li><Link to="/">الرئيسية</Link></li>
        <li><Link to="/suburbs">الضاحية</Link></li>

      </ul>
    </nav>
  );
};

export default Navbar;
