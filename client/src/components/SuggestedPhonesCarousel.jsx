import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getImageUrl } from '../services/api';

export default function SuggestedPhonesCarousel({ popularPhones = [], loading = false }) {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePhoneClick = (phone) => {
    navigate(`/shop?model=${encodeURIComponent(phone.name)}`);
  };

  if (!loading && (!popularPhones || popularPhones.length === 0)) {
    return null;
  }

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                {isAr ? 'الهواتف الأكثر طلباً' : 'Modèles Fréquemment Demandés'}
              </h2>
              <span className="flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles size={11} className="mr-1 rtl:ml-1 text-amber-600" />
                {isAr ? 'اختر هاتفك' : 'Populaire'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr 
                ? 'انقر على موديل هاتفك لعرض جميع قطع الغيار والإكسسوارات المتوافقة' 
                : 'Sélectionnez votre smartphone pour afficher toutes ses pièces et composants'}
            </p>
          </div>
        </div>

        {/* Carousel arrows */}
        <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex space-x-3.5 rtl:space-x-reverse overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-44 md:w-48 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
          ))
        ) : (
          popularPhones.map((phone, idx) => {
            const brandColor = 
              phone.brand.includes('Apple') ? 'bg-zinc-900 text-white' :
              phone.brand.includes('Samsung') ? 'bg-blue-600 text-white' :
              phone.brand.includes('Xiaomi') ? 'bg-orange-500 text-white' :
              phone.brand.includes('Oppo') ? 'bg-emerald-600 text-white' :
              phone.brand.includes('Realme') ? 'bg-amber-500 text-slate-950' :
              phone.brand.includes('Infinix') ? 'bg-teal-600 text-white' :
              phone.brand.includes('Huawei') ? 'bg-red-600 text-white' :
              'bg-slate-800 text-white';

            return (
              <div
                key={idx}
                onClick={() => handlePhoneClick(phone)}
                className="group flex-shrink-0 w-40 sm:w-44 md:w-48 bg-white hover:bg-amber-50/50 rounded-2xl p-4 border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer snap-start flex flex-col justify-between text-left relative overflow-hidden"
              >
                {/* Brand badge */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${brandColor}`}>
                    {phone.brand.replace(' / Redmi', '')}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-900 px-2 py-0.5 rounded-full transition-colors">
                    {phone.count} {isAr ? 'قطعة' : 'pièces'}
                  </span>
                </div>

                {/* Device Icon / Thumbnail Preview */}
                <div className="my-2 flex items-center justify-center h-16 w-full">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-white group-hover:scale-110 group-hover:shadow-sm border border-slate-100 flex items-center justify-center transition-all duration-200 p-2">
                    {phone.sampleImage ? (
                      <img
                        src={getImageUrl(phone.sampleImage)}
                        alt={phone.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <Smartphone size={28} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Model Title & Action */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs md:text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {phone.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mt-1">
                    <span>{isAr ? 'تصفح القطع' : 'Voir les pièces'}</span>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
