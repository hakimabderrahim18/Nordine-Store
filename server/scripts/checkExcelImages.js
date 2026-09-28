import fs from 'fs';
import path from 'path';

const carouselComponent = `import React, { useRef } from 'react';
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
    navigate(\`/shop?model=\${encodeURIComponent(phone.name)}\`);
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
                  <span className={\`text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider \${brandColor}\`}>
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
`;

const deviceSelectorComponent = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Search, ChevronRight, Sparkles, Filter, X, ArrowRight, Layers } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { productService } from '../services/api';

export default function DeviceSelector({ onSelectModel, compact = false }) {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const [devicesData, setDevicesData] = useState({ brands: [], popularPhones: [] });
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await productService.getDevices();
        if (res.success) {
          setDevicesData(res);
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const brands = devicesData.brands || [];
  const currentBrand = brands[selectedBrandIndex] || brands[0];

  // Filter models based on search query
  const filteredModels = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return currentBrand?.models || [];
    }
    const q = searchQuery.toLowerCase().trim();
    // If searching, search across all brands
    const allModels = [];
    brands.forEach(b => {
      b.models.forEach(m => {
        if (m.name.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)) {
          allModels.push({ ...m, brandName: b.name });
        }
      });
    });
    return allModels;
  }, [searchQuery, currentBrand, brands]);

  const handleSelect = (model) => {
    if (onSelectModel) {
      onSelectModel(model);
    } else {
      navigate(\`/shop?model=\${encodeURIComponent(model.name)}\`);
    }
  };

  return (
    <div className={\`w-full bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 overflow-hidden \${compact ? 'p-4' : 'p-6 md:p-8'}\`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 flex-shrink-0">
            <Smartphone size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'البحث الذكي حسب الهاتف' : 'Recherche par Téléphone / Modèle'}
              </h2>
              <span className="hidden sm:inline-flex items-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles size={11} className="mr-1 rtl:ml-1 text-amber-500" />
                {isAr ? 'تصفح فوري' : 'Direct'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {isAr 
                ? 'اختر نوع وموديل هاتفك لتظهر لك جميع الشاشات، البطاريات، وقطع الغيار الخاصة به مباشرة' 
                : 'Choisissez la marque et le modèle pour afficher instantanément tous ses écrans, batteries et pièces compatibles.'}
            </p>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن موديل (مثلاً: A12, iPhone 11)...' : 'Rechercher un modèle (ex: A12, iPhone 13)...'}
            className="w-full pl-10 pr-9 rtl:pr-10 rtl:pl-9 py-2.5 text-xs md:text-sm font-semibold bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Brand Tabs (hidden if actively searching) */}
      {!searchQuery && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto py-4 scrollbar-none border-b border-slate-100">
          {brands.map((brand, idx) => {
            const isActive = selectedBrandIndex === idx;
            return (
              <button
                key={brand.slug}
                onClick={() => setSelectedBrandIndex(idx)}
                className={\`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-200 flex-shrink-0 \${
                  isActive
                    ? 'bg-slate-900 text-amber-400 shadow-sm scale-100'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }\`}
              >
                <span>{brand.name}</span>
                <span className={\`text-[10px] font-black px-1.5 py-0.5 rounded-md \${
                  isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
                }\`}>
                  {brand.models.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Models Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>
            {searchQuery 
              ? (isAr ? \`نتائج البحث (\${filteredModels.length} موديل)\` : \`Résultats de recherche (\${filteredModels.length} modèles)\`)
              : (isAr ? \`موديلات \${currentBrand?.name || ''} (\${filteredModels.length})\` : \`Modèles \${currentBrand?.name || ''} (\${filteredModels.length})\`)}
          </span>
          <span className="text-[11px] text-amber-600 font-extrabold lowercase">
            {isAr ? 'اضغط لعرض جميع القطع' : 'cliquez pour afficher les pièces'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Smartphone size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold">{isAr ? 'لم يتم العثور على هذا الموديل' : 'Aucun modèle correspondant trouvé.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {filteredModels.map((model, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(model)}
                className="group p-3 rounded-xl bg-slate-50 hover:bg-amber-500 text-slate-800 hover:text-slate-950 border border-slate-200/80 hover:border-amber-500 transition-all duration-150 text-left flex flex-col justify-between shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <span className="text-xs md:text-sm font-black group-hover:text-slate-950 line-clamp-1">
                  {model.name}
                </span>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-slate-900 mt-1.5">
                  <span>{model.count} {isAr ? 'قطع' : 'pièces'}</span>
                  <ChevronRight size={12} className="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.resolve('c:/Users/PC/Desktop/NordineStore/client/src/components/SuggestedPhonesCarousel.jsx'), carouselComponent, 'utf8');
console.log('SuggestedPhonesCarousel.jsx created successfully.');

fs.writeFileSync(path.resolve('c:/Users/PC/Desktop/NordineStore/client/src/components/DeviceSelector.jsx'), deviceSelectorComponent, 'utf8');
console.log('DeviceSelector.jsx created successfully.');

