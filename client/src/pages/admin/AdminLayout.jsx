import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Shield, Wrench, FileCheck, Home, Menu, X, User, Image } from 'lucide-react';
import AdminNotifications from '../../components/AdminNotifications';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminLayout() {
  const { t, language } = useTranslation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAr = language === 'ar';

  // Route Guard: Verify Admin Role
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const getPageTitle = (pathname) => {
    if (pathname === '/admin') return t('admin_page_overview');
    if (pathname.startsWith('/admin/products')) return t('admin_page_inventory');
    if (pathname.startsWith('/admin/orders')) return t('admin_page_orders');
    if (pathname.startsWith('/admin/users')) return t('admin_page_users');
    if (pathname.startsWith('/admin/carousel')) return t('admin_page_carousel');
    return t('admin_title');
  };

  const sidebarLinks = [
    { label: t('admin_overview'), path: '/admin', icon: <LayoutDashboard size={16} /> },
    { label: t('admin_inventory'), path: '/admin/products', icon: <Wrench size={16} /> },
    { label: t('admin_orders'), path: '/admin/orders', icon: <FileCheck size={16} /> },
    { label: t('admin_users'), path: '/admin/users', icon: <User size={16} /> },
    { label: t('admin_carousel'), path: '/admin/carousel', icon: <Image size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* MOBILE HEADER BAR */}
      <header className="lg:hidden bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 w-full text-start">
        <div className="flex items-center space-x-2 text-slate-800">
          <Shield className="text-brand-primary" />
          <span className="font-black text-sm tracking-wider uppercase">{t('admin_title')}</span>
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
        <aside className={`absolute top-0 bottom-0 w-64 bg-white p-6 flex flex-col justify-between shadow-2xl text-start z-10 ${isAr ? 'right-0' : 'left-0'}`}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-2 text-slate-800">
                <Shield className="text-brand-primary" />
                <div className="flex flex-col">
                  <span className="font-black text-xs tracking-wider uppercase">{t('admin_title')}</span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">{t('admin_subtitle')}</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col space-y-2">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand-primary text-slate-950 font-black shadow-sm'
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
            <span>{t('admin_quit')}</span>
          </Link>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR NAVIGATION PANEL */}
      <aside className={`hidden lg:flex w-64 bg-white border-r border-gray-200 text-slate-500 p-6 flex-col justify-between flex-shrink-0 h-screen sticky top-0 text-start ${isAr ? 'border-l border-r-0' : 'border-r'}`}>
        <div className="space-y-8">
          {/* Admin Header */}
          <div className="flex items-center space-x-2 text-slate-800 border-b border-gray-200 pb-6">
            <Shield className="text-brand-primary" />
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider uppercase">{t('admin_title')}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">{t('admin_subtitle')}</span>
            </div>
          </div>

          {/* Navigation link list */}
          <nav className="flex flex-col space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-slate-950 font-black shadow-sm'
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
          <span>{t('admin_quit')}</span>
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
              <div className="flex flex-col text-start">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{t('admin_role')}</span>
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
