import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Package, ChevronRight, X, Lock, MessageCircle } from 'lucide-react';
import { productService, getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { getProductQualityBadge } from '../utils/qualityHelper';

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
            className={`absolute z-50 mt-2 bg-white border border-amber-300/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ${
              isMobile
                ? 'left-0 right-0 w-full'
                : isAr ? 'right-0 w-80 md:w-96' : 'left-0 w-80 md:w-96'
            }`}
          >
            {/* Header info */}
            <div className="px-3.5 py-2 bg-gradient-to-r from-slate-50 to-amber-50/40 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {isAr ? 'نتائج البحث' : 'Résultats de recherche'}
                </span>
                {suggestions.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {totalSuggestions || suggestions.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSearching && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[10px] font-bold">{isAr ? 'جاري البحث...' : 'Recherche...'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors"
                  title={isAr ? 'إغلاق' : 'Fermer'}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100">
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

                  const quality = getProductQualityBadge(prod.name);
                  const isNoisySku = !prod.sku || prod.sku.startsWith('AFFICHEUR-') || prod.sku.length > 15;

                  return (
                    <div
                      key={prod._id}
                      onClick={() => handleSelectProduct(prod._id)}
                      className="p-2.5 sm:p-3 hover:bg-amber-50/60 active:bg-amber-100/50 transition-colors duration-150 cursor-pointer flex items-center gap-2.5 sm:gap-3 group"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden flex-shrink-0 flex items-center justify-center p-1 group-hover:border-amber-400 transition-colors">
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
                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-700 transition-colors">
                          {prod.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {prod.brand?.name && (
                            <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                              {prod.brand.name}
                            </span>
                          )}
                          {!isNoisySku && (
                            <span className="text-[9px] font-semibold text-slate-400 ltr-text">
                              Ref: {prod.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stacked Right Column: Quality Badge, Price, Stock */}
                      <div className="min-w-[85px] sm:min-w-[105px] text-end flex-shrink-0 flex flex-col items-end justify-center gap-1">
                        {quality && (
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wide whitespace-nowrap shadow-xs ${quality.color}`}>
                            {quality.shortLabel || quality.label}
                          </span>
                        )}
                        {isAuthenticated ? (
                          <span className="text-xs sm:text-sm font-black text-slate-900 ltr-text whitespace-nowrap">
                            {displayPrice.toLocaleString()} <span className="text-[10px] sm:text-xs text-amber-600 font-bold">DA</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                            <Lock size={9} />
                            {isAr ? 'عضو' : 'Prix membre'}
                          </span>
                        )}
                        <span className={`text-[9px] font-semibold flex items-center gap-1 ${prod.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
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
                className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black uppercase shadow-inner"
              >
                <span>
                  {isAr
                    ? `عرض جميع النتائج (${totalSuggestions || suggestions.length})`
                    : `Voir tous les ${totalSuggestions || suggestions.length} résultats`}
                </span>
                <ChevronRight size={15} className={isAr ? 'rotate-180' : ''} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
