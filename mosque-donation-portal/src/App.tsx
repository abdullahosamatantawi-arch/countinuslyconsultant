import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Suburbs, { SuburbDetail } from './pages/Suburbs';
import Plots from './pages/Plots';
import PlotDetail from './pages/PlotDetail';

import './index.css';

// Layout wrapper that includes the Navbar for public routes
const PublicLayout: React.FC = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
  </>
);

const NotFound: React.FC = () => (
  <div className="page-container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕌</div>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>الصفحة غير موجودة</h2>
    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
      عذراً، لم نتمكن من إيجاد الصفحة المطلوبة
    </p>
    <a href="/" className="btn btn-primary">العودة للرئيسية</a>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>


        {/* Public routes - wrapped in layout with navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/suburbs" element={<Suburbs />} />
          <Route path="/suburbs/:suburbId" element={<SuburbDetail />} />
          <Route path="/suburbs/:suburbId/districts/:districtId" element={<Plots />} />
          <Route path="/suburbs/:suburbId/districts/:districtId/plots/:plotId" element={<PlotDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
