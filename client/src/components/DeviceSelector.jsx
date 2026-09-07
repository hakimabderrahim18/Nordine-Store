import React, { useState, useEffect } from 'react';
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
      navigate(`/shop?model=${encodeURIComponent(model.name)}`);
    }
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 overflow-hidden ${compact ? 'p-4' : 'p-6 md:p-8'}`}>
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
                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 shadow-sm scale-100'
                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>{brand.name}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
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
              ? (isAr ? `نتائج البحث (${filteredModels.length} موديل)` : `Résultats de recherche (${filteredModels.length} modèles)`)
              : (isAr ? `موديلات ${currentBrand?.name || ''} (${filteredModels.length})` : `Modèles ${currentBrand?.name || ''} (${filteredModels.length})`)}
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
