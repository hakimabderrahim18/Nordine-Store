import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Sparkles, ChevronLeft, ChevronRight, ArrowRight, Flame } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function PromotionsSection({ promotions = [], loading = false }) {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide if multiple promotions
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  if (loading) {
    return (
      <div className="w-full mt-3.5 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 animate-pulse flex items-center justify-center min-h-[140px]">
        <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
          <Sparkles className="animate-spin" size={16} />
          <span>{isAr ? 'جاري تحميل العروض الترويجية...' : 'Chargement des promotions...'}</span>
        </div>
      </div>
    );
  }

  // If no active promotion to show, hide the section cleanly
  if (!promotions || promotions.length === 0) {
    return null;
  }

  const currentPromo = promotions[currentIndex];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full mt-3.5 relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-amber-400/80 shadow-lg shadow-amber-500/15 bg-gradient-to-br from-amber-50 via-white to-amber-100/40"
    >
      {/* Top Banner Tag */}
      <div className="px-3.5 sm:px-4 py-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-black text-[10px] sm:text-[11px] uppercase tracking-wider">
          <Flame size={14} className="fill-slate-950 text-slate-950 animate-bounce" />
          <span>{isAr ? 'عروض وتخفيضات خاصة' : 'Offres Spéciales & Promotions'}</span>
          <span className="hidden sm:inline-block bg-slate-950 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-black">
            {promotions.length > 1 ? `${currentIndex + 1}/${promotions.length}` : 'HOT'}
          </span>
        </div>

        {/* Multi-slide controls */}
        {promotions.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              aria-label="Previous promo"
              className="p-0.5 rounded-full hover:bg-slate-950/20 active:scale-95 transition-all text-slate-950 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next promo"
              className="p-0.5 rounded-full hover:bg-slate-950/20 active:scale-95 transition-all text-slate-950 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Promo Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPromo._id || currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            to={currentPromo.link || '/shop'}
            className="group block p-3 sm:p-4 hover:bg-amber-100/30 transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Promo Image */}
              <div className="w-full sm:w-44 md:w-52 h-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-amber-200 shadow-xs flex-shrink-0 flex items-center justify-center relative p-1 group-hover:border-amber-400 transition-colors">
                <img
                  src={getImageUrl(currentPromo.image)}
                  alt={currentPromo.title || 'Promotion'}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x150?text=Promotion';
                  }}
                />
                {currentPromo.badge && (
                  <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                    {currentPromo.badge}
                  </span>
                )}
              </div>

              {/* Promo Texts & Call to Action */}
              <div className="flex-1 w-full text-start flex flex-col justify-between space-y-1.5 sm:space-y-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {currentPromo.discountText && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Tag size={11} className="stroke-[2.5]" />
                        {currentPromo.discountText}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      {isAr ? 'خصم متاح الآن' : 'Offre limitée'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 leading-snug">
                    {currentPromo.title || (isAr ? 'عرض ترويجي مميز' : 'Promotion Exceptionnelle')}
                  </h3>

                  {currentPromo.subtitle && (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 line-clamp-2">
                      {currentPromo.subtitle}
                    </p>
                  )}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800 group-hover:text-amber-950 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all">
                    <span>{isAr ? 'اكتشف العرض واطلب الآن' : 'En profiter maintenant'}</span>
                    <ArrowRight size={13} className={`stroke-[2.5] ${isAr ? 'rotate-180' : ''}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isAr ? 'ساري حتى نفاد الكمية' : "Jusqu'à épuisement des stocks"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Bullet indicators if multiple */}
      {promotions.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {promotions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-amber-200 hover:bg-amber-300'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
