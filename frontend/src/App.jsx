// BioBistro App Shell
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import HistoryPage from './pages/History';
import ProfilePage from './pages/Profile';
import SavedRecipes from './pages/SavedRecipes';
import './index.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  // Auth sayfalarında footer/navbar göstermiyoruz
  const isAuthPage = ['/login', '/register'].some(p => window.location.pathname.startsWith(p));

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main className="bb-main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/history" element={isAuthenticated ? <HistoryPage /> : <Navigate to="/login" />} />
            <Route path="/saved-recipes" element={isAuthenticated ? <SavedRecipes /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
