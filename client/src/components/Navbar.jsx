import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';
import { logout } from '../store/authSlice';
import { resetCart } from '../store/cartSlice';
import { resetWishlist } from '../store/wishlistSlice';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Monitor scroll to trigger navbar styling update
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigate
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    dispatch(resetWishlist());
    setDropdownOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Accueil', path: '/' },
    { label: 'Boutique', path: '/shop' },
    { label: 'À propos', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' }
  ];

  return (
    <>
      <nav
        className={`fixed left-1/2 -translate-x-1/2 w-[94%] max-w-7xl z-40 rounded-[24px] px-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled 
            ? 'top-2 py-3 bg-white/90 border border-gray-200 shadow-lg shadow-gray-200/50 backdrop-blur-md' 
            : 'top-6 py-4.5 bg-white/75 border border-gray-200/50 shadow-sm backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 select-none group">
            <img src="/01.svg" alt="Nounou Telecom Logo" className="h-7 sm:h-9 w-auto object-contain" />
            <span className="font-black text-xs sm:text-sm md:text-base tracking-[0.12em] sm:tracking-[0.15em] text-slate-800 whitespace-nowrap">
              NOUNOU<span className="text-brand-primary"> TELECOM</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`relative py-1 text-sm font-semibold tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Operations / Quick Actions */}
          <div className="flex items-center space-x-4">
            {/* Direct Admin Link for quick visibility */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-full transition-all"
              >
                <LayoutDashboard size={12} />
                <span>Espace Admin</span>
              </Link>
            )}

            {/* Wishlist Link */}
            <Link to="/wishlist" className="hidden sm:block relative p-2 text-slate-500 hover:text-brand-primary transition-colors">
              <Heart size={18} />
              {wishlistItems.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link to="/cart" className="relative p-2 text-slate-500 hover:text-brand-primary transition-colors">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-brand-primary text-slate-900 rounded-full text-[9px] flex items-center justify-center font-black">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Dropdown */}
            <div className="hidden sm:block relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-slate-500 hover:text-brand-primary hover:border-brand-primary transition-colors cursor-pointer"
                  >
                    <User size={16} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-[20px] shadow-lg shadow-gray-200/50 py-2 z-50 overflow-hidden text-left text-slate-800"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-xs text-slate-500">Connecté en tant que</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                        </div>

                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 hover:text-brand-primary transition-colors"
                          >
                            <LayoutDashboard size={15} className="mr-3 text-slate-500" />
                            Tableau de bord Admin
                          </Link>
                        )}

                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 hover:text-brand-primary transition-colors"
                        >
                          <UserCheck size={15} className="mr-3 text-slate-500" />
                          Mon Profil
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 hover:text-brand-primary transition-colors"
                        >
                          <ShoppingCart size={15} className="mr-3 text-slate-500" />
                          Mes Commandes
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-gray-200 mt-1 text-left cursor-pointer"
                        >
                          <LogOut size={15} className="mr-3" />
                          Se déconnecter
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center p-2 rounded-full border border-gray-300 text-slate-600 hover:text-brand-primary hover:border-brand-primary transition-colors"
                >
                  <User size={16} />
                </Link>
              )}
            </div>

            {/* Premium Animated Burger Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-8 h-8 flex flex-col justify-center items-center group md:hidden focus:outline-none"
            >
              <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 rounded my-0.5 transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Fullscreen Overlay Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={`fixed left-1/2 -translate-x-1/2 w-[94%] max-w-7xl z-30 bg-white/95 backdrop-blur-lg rounded-[28px] p-8 border border-gray-200 shadow-lg shadow-gray-200/50 md:hidden flex flex-col justify-between overflow-y-auto text-left transition-all duration-300 ${
              scrolled 
                ? 'top-[68px] h-[calc(100vh-84px)]' 
                : 'top-[88px] h-[calc(100vh-104px)]'
            }`}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col space-y-6 pt-4">
              {isAuthenticated && user?.role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="text-2xl font-black uppercase tracking-wider block text-brand-primary hover:text-amber-500 transition-colors"
                  >
                    Tableau de bord Admin
                  </Link>
                </motion.div>
              )}

              {navLinks.map((link, idx) => {
                const isActive = location.pathname === link.path;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setMenuOpen(false)}
                      className={`text-2xl font-black uppercase tracking-wider block transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-slate-700 hover:text-brand-primary'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile Profile & Wishlist Actions */}
              <div className="border-t border-gray-200 pt-6 space-y-5">
                <Link
                  to="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-xl font-black uppercase tracking-wider text-slate-700 hover:text-brand-primary"
                >
                  <span>Mes Favoris</span>
                  <div className="flex items-center space-x-2">
                    <Heart size={18} className="text-slate-500" />
                    {wishlistItems.length > 0 && (
                      <span className="bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                        {wishlistItems.length}
                      </span>
                    )}
                  </div>
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between text-xl font-black uppercase tracking-wider text-slate-700 hover:text-brand-primary"
                    >
                      <span>Mon Profil</span>
                      <UserCheck size={18} className="text-slate-500" />
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between text-xl font-black uppercase tracking-wider text-slate-700 hover:text-brand-primary"
                    >
                      <span>Mes Commandes</span>
                      <ShoppingCart size={18} className="text-slate-500" />
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between text-xl font-black uppercase tracking-wider text-red-500 hover:text-red-600 text-left cursor-pointer"
                    >
                      <span>Se déconnecter</span>
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between text-xl font-black uppercase tracking-wider text-slate-700 hover:text-brand-primary"
                  >
                    <span>Se connecter</span>
                    <User size={18} className="text-slate-500" />
                  </Link>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support Direct Techniciens</p>
              <div className="flex flex-col space-y-2 text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Email :</span>
                  <span className="font-semibold text-slate-800">nounoutelecomtiaret@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>WhatsApp :</span>
                  <span className="font-bold text-slate-800">0550 08 26 85</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
