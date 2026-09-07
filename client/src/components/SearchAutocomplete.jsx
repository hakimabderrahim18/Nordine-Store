import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Package, ChevronRight, X, Lock, MessageCircle } from 'lucide-react';
import { productService, getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function SearchAutocomplete({ isMobile = false, isHeaderSearch = false, onCloseMobileMenu }) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef(null);
  const isAr = language === 'ar';

  // Debounced search when searchVal changes
  useEffect(() => {
    const trimmed = searchVal.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setTotalSuggestions(0);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getProducts({ keyword: trimmed, limit: 6 });
        if (res && res.success) {
          setSuggestions(res.products || []);
          setTotalSuggestions(res.totalProducts || 0);
        } else {
          setSuggestions([]);
          setTotalSuggestions(0);
        }
      } catch (err) {
        console.error('Autocomplete search error:', err);
        setSuggestions([]);
        setTotalSuggestions(0);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchVal]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchVal.trim();
    if (trimmed) {
      setShowDropdown(false);
      if (onCloseMobileMenu) onCloseMobileMenu();
      navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectProduct = (productId) => {
    setShowDropdown(false);
    setSearchVal('');
    if (onCloseMobileMenu) onCloseMobileMenu();
    navigate(`/products/${productId}`);
  };

  const handleViewAll = () => {
    const trimmed = searchVal.trim();
    setShowDropdown(false);
    if (onCloseMobileMenu) onCloseMobileMenu();
    navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
  };

  const clearSearch = () => {
    setSearchVal('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={`relative ${isMobile || isHeaderSearch ? 'w-full' : 'w-auto'}`}>
      <form onSubmit={handleFormSubmit} className="relative flex items-center w-full gap-1 sm:gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => {
              if (searchVal.trim().length >= 2) {
                setShowDropdown(true);
              }
            }}
            className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] sm:text-xs rounded-full py-1.5 ${
              isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
            } focus:outline-none focus:border-brand-primary font-medium`}
          />
          <Search
            size={12}
            className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${
              isAr ? 'right-2.5' : 'left-2.5'
            }`}
          />
          {searchVal && (
            <button
              type="button"
              onClick={clearSearch}
              className={`absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors ${
                isAr ? 'left-2' : 'right-2'
              }`}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Action Search Button */}
        <button
          type="submit"
          title={isAr ? 'بحث' : 'Rechercher'}
          className="gold-bg-gradient text-slate-950 hover:opacity-90 font-black text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full flex items-center justify-center space-x-1 shadow-sm transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Search size={13} className="stroke-[2.5]" />
          <span className="hidden sm:inline-block text-[10px] sm:text-[11px] uppercase tracking-wider font-black">
            {isAr ? 'بحث' : 'Chercher'}
          </span>
        </button>
      </form>

      {/* Suggestions Dropdown Popup */}
      <AnimatePresence>
        {showDropdown && searchVal.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-[20px] shadow-2xl overflow-hidden ${
              isMobile
                ? 'left-0 right-0 w-full'
                : isAr ? 'right-0 w-80 md:w-96' : 'left-0 w-80 md:w-96'
            }`}
          >
            {/* Header info */}
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isAr ? 'مقترحات البحث' : 'Suggestions de recherche'}
              </span>
              {isSearching && (
                <div className="flex items-center space-x-1 text-brand-primary">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[10px] font-bold">{isAr ? 'جاري البحث...' : 'Recherche...'}</span>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {isSearching && suggestions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-brand-primary" />
                  <span>{isAr ? 'جاري البحث عن المنتجات المطابقة...' : 'Recherche des pièces en cours...'}</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((prod) => {
                  let displayPrice = prod.discountPrice || prod.price;
                  if (user?.clientType === 'demi-gros' && prod.demiGrosPrice) {
                    displayPrice = prod.demiGrosPrice;
                  } else if (user?.clientType === 'super-gros' && prod.superGrosPrice) {
                    displayPrice = prod.superGrosPrice;
                  }

                  return (
                    <div
                      key={prod._id}
                      onClick={() => handleSelectProduct(prod._id)}
                      className="p-3 hover:bg-amber-50/50 transition-colors duration-150 cursor-pointer flex items-center space-x-3 group"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0 flex items-center justify-center p-1 group-hover:border-brand-primary/40 transition-colors">
                        <img
                          src={getImageUrl(prod.images?.[0] || prod.image)}
                          alt={prod.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-start">
                        <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-primary transition-colors">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {prod.brand?.name && (
                            <span className="text-[9px] font-black uppercase text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                              {prod.brand.name}
                            </span>
                          )}
                          <span className="text-[9px] font-semibold text-slate-400 ltr-text">
                            SKU: {prod.sku}
                          </span>
                        </div>
                      </div>

                      {/* Price / Stock */}
                      <div className="text-end flex-shrink-0 flex flex-col items-end">
                        {isAuthenticated ? (
                          <span className="text-xs font-black text-slate-900 ltr-text">
                            {displayPrice.toLocaleString()} DA
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock size={9} />
                            {isAr ? 'عضو' : 'Membre'}
                          </span>
                        )}
                        <span className={`text-[8px] font-bold uppercase mt-0.5 ${prod.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {prod.stock > 0 ? (isAr ? 'متوفر' : 'En stock') : (isAr ? 'نفذ' : 'Rupture')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-5 text-center text-slate-600 text-xs font-medium space-y-3 bg-amber-50/40">
                  <Package size={28} className="mx-auto text-amber-500/80" />
                  <div>
                    <p className="font-bold text-slate-800 text-xs">
                      {isAr ? 'لم يتم العثور على أي قطعة باسم :' : 'Aucun produit trouvé pour :'}{' '}
                      <span className="font-black text-amber-700">"{searchVal}"</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isAr
                        ? 'القطعة غير متوفرة في المتجر حالياً؟ اطلبها الآن مباشرة عبر واتساب وسنوفرها لك!'
                        : 'Pièce non disponible ? Demandez-la directement au support sur WhatsApp !'}
                    </p>
                  </div>
                  <a
                    href={`https://api.whatsapp.com/send?phone=213550082685&text=${encodeURIComponent(
                      isAr
                        ? `مرحباً نونو تليكوم، أبحث عن القطعة/المنتج : "${searchVal}". هل هو متوفر؟`
                        : `Bonjour Nounou Telecom, je recherche la pièce/produit : "${searchVal}". Est-il disponible ?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setShowDropdown(false);
                      if (onCloseMobileMenu) onCloseMobileMenu();
                    }}
                    className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 w-full cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>{isAr ? 'طلب القطعة عبر واتساب (WhatsApp)' : 'Demander la pièce sur WhatsApp'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* View All Footer */}
            {suggestions.length > 0 && (
              <div
                onClick={handleViewAll}
                className="p-3 bg-slate-50 border-t border-gray-100 text-center hover:bg-amber-100/50 transition-colors cursor-pointer flex items-center justify-center space-x-1 text-xs font-black uppercase text-brand-primary"
              >
                <span>
                  {isAr
                    ? `عرض جميع النتائج (${totalSuggestions})`
                    : `Voir tous les ${totalSuggestions} résultats`}
                </span>
                <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
