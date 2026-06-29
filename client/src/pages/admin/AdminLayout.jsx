import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Shield, Wrench, FileCheck, Home, Menu, X, User } from 'lucide-react';
import AdminNotifications from '../../components/AdminNotifications';

const getPageTitle = (pathname) => {
  if (pathname === '/admin') return 'Tableau de bord';
  if (pathname.startsWith('/admin/products')) return 'Inventaire / Gestion de Stock';
  if (pathname.startsWith('/admin/orders')) return 'Gestion des Commandes';
  if (pathname.startsWith('/admin/users')) return 'Gestion des Utilisateurs';
  return 'Administration';
};

export default function AdminLayout() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Route Guard: Verify Admin Role
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const sidebarLinks = [
    { label: 'Aperçu', path: '/admin', icon: <LayoutDashboard size={16} /> },
    { label: 'Inventaire', path: '/admin/products', icon: <Wrench size={16} /> },
    { label: 'Commandes', path: '/admin/orders', icon: <FileCheck size={16} /> },
    { label: 'Comptes', path: '/admin/users', icon: <User size={16} /> }
  ];

  console.log("Admin Sidebar links rendered:", sidebarLinks);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* MOBILE HEADER BAR */}
      <header className="lg:hidden bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 w-full text-left">
        <div className="flex items-center space-x-2 text-slate-800">
          <Shield className="text-brand-primary" />
          <span className="font-black text-sm tracking-wider uppercase">ADMIN NOUNOU</span>
        </div>
        <div className="flex items-center space-x-2">
          <AdminNotifications />
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER SIDEBAR */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        {/* Drawer container */}
        <aside className="absolute top-0 left-0 bottom-0 w-64 bg-white p-6 flex flex-col justify-between shadow-2xl text-left z-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 text-slate-800">
                <Shield className="text-brand-primary" />
                <div className="flex flex-col">
                  <span className="font-black text-xs tracking-wider uppercase">ADMIN NOUNOU</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Gestion de Stock</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col space-y-2">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand-primary text-slate-955'
                        : 'hover:bg-gray-100 hover:text-slate-800'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 hover:text-slate-800"
          >
            <Home size={16} />
            <span>Quitter</span>
          </Link>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR NAVIGATION PANEL */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 text-slate-500 p-6 flex-col justify-between flex-shrink-0 h-screen sticky top-0 text-left">
        <div className="space-y-8">
          {/* Admin Header */}
          <div className="flex items-center space-x-2 text-slate-800 border-b border-gray-200 pb-6">
            <Shield className="text-brand-primary" />
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider uppercase">ADMIN NOUNOU</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Gestion de Stock</span>
            </div>
          </div>

          {/* Navigation link list */}
          <nav className="flex flex-col space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-slate-955'
                      : 'hover:bg-gray-100 hover:text-slate-800'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to main store */}
        <Link
          to="/"
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 hover:text-slate-800"
        >
          <Home size={16} />
          <span>Quitter le tableau de bord</span>
        </Link>
      </aside>

      {/* CORE ADMIN SUB-PAGE VIEWER */}
      <main className="flex-grow flex flex-col h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
        {/* DESKTOP HEADER BAR */}
        <header className="hidden lg:flex h-16 border-b border-gray-100 bg-white px-8 items-center justify-between flex-shrink-0">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {getPageTitle(location.pathname)}
          </div>
          <div className="flex items-center space-x-6">
            <AdminNotifications />
            
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center font-black text-[11px] text-slate-900 border border-brand-primary/20 uppercase">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Administrateur</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable sub-page area */}
        <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
