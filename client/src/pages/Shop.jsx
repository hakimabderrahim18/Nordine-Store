import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, RefreshCw, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, categoryService, brandService } from '../services/api';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State (initialized from URL search parameters)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  
  // Pagination
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Load Categories & Brands once on mount
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const catRes = await categoryService.getCategories();
        const brandRes = await brandService.getBrands();
        if (catRes.success) setCategories(catRes.categories);
        if (brandRes.success) setBrands(brandRes.brands);
      } catch (err) {
        console.error('Error loading filters data:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Sync state values with URL search parameters
  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedBrand(searchParams.get('brand') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setInStock(searchParams.get('inStock') === 'true');
    setSort(searchParams.get('sort') || 'newest');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Load products when filters/params change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        const params = {
          keyword: searchParams.get('keyword') || undefined,
          category: searchParams.get('category') || undefined,
          brand: searchParams.get('brand') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          inStock: searchParams.get('inStock') || undefined,
          sort: searchParams.get('sort') || undefined,
          page: searchParams.get('page') || 1,
          limit: 9
        };

        const res = await productService.getProducts(params);
        if (res.success) {
          setProducts(res.products);
          setTotalPages(res.pages);
          setTotalProducts(res.totalProducts);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [searchParams]);

  // Apply filters by writing them to SearchParams
  const applyFilters = (newParams = {}) => {
    const current = {};
    
    if (keyword) current.keyword = keyword;
    if (selectedCategory) current.category = selectedCategory;
    if (selectedBrand) current.brand = selectedBrand;
    if (minPrice) current.minPrice = minPrice;
    if (maxPrice) current.maxPrice = maxPrice;
    if (inStock) current.inStock = 'true';
    if (sort !== 'newest') current.sort = sort;
    current.page = '1';

    const finalParams = { ...current, ...newParams };
    setSearchParams(finalParams);
    setMobileFiltersOpen(false);
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setSort('newest');
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const handlePageChange = (newPage) => {
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...current, page: String(newPage) });
  };

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24">
      {/* Top Banner Header */}
      <div className="flex flex-col space-y-1 mb-8 text-left">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Dépôt Hardware</span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase">CATALOGUE DES COMPOSANTS</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(17,24,39,0.02)] h-fit space-y-6 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-xs tracking-wider uppercase flex items-center">
              <SlidersHorizontal size={13} className="mr-2 text-brand-primary" />
              Filtres
            </h3>
            <button onClick={clearFilters} className="text-[10px] font-black text-slate-400 hover:text-brand-primary flex items-center gap-1 uppercase transition-colors">
              <RefreshCw size={10} /> Réinitialiser
            </button>
          </div>

          {/* Search keyword input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rechercher</label>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Référence, Mot-clé..."
                className="w-full bg-slate-50 border border-slate-100 text-slate-805 text-xs rounded-[12px] pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary/50"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catégories</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary/50 cursor-pointer"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Brand filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marques</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary/50 cursor-pointer"
            >
              <option value="">Toutes les marques</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite de Prix (DA)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary/50"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary/50"
              />
            </div>
          </div>

          {/* Stock filter switch */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponible uniquement</span>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 text-brand-primary border-slate-200 rounded focus:ring-brand-primary accent-brand-primary cursor-pointer"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={() => applyFilters()}
            className="w-full bg-gray-50 text-brand-primary border border-brand-primary/20 font-black text-xs uppercase tracking-wider py-3.5 rounded-[14px] hover:bg-brand-primary hover:text-brand-secondary transition-colors duration-300 shadow-sm cursor-pointer"
          >
            Appliquer les Filtres
          </button>
        </aside>

        {/* MAIN PRODUCTS GRID & SEARCH CONTROLS */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top sorting & mobile triggers bar */}
          <div className="bg-white p-4 rounded-[16px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(17,24,39,0.02)] flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span className="font-bold text-slate-800">{totalProducts}</span> produits affichés
            </p>

            <div className="flex items-center space-x-3">
              {/* Sort selector */}
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <ArrowUpDown size={12} />
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    applyFilters({ sort: e.target.value });
                  }}
                  className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="newest">Nouveautés</option>
                  <option value="priceAsc">Prix : Croissant</option>
                  <option value="priceDesc">Prix : Décroissant</option>
                  <option value="rating">Mieux notés</option>
                </select>
              </div>

              {/* Mobile filter trigger */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 hover:text-brand-primary transition-colors"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Grid Products list */}
          {loading ? (
            <div className="product-grid-container">
              <div className="product-grid">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full h-[390px] bg-white border border-slate-100 rounded-[20px] overflow-hidden p-5 flex flex-col justify-between relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full animate-shimmer" />
                    <div className="aspect-square bg-slate-50 rounded-[14px] w-full" />
                    <div className="space-y-2 pt-4 flex-grow flex flex-col justify-end">
                      <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <Search size={40} className="text-slate-350" />
              <h3 className="font-bold text-slate-800 text-lg">Aucun produit trouvé</h3>
              <p className="text-xs text-slate-500">Essayez d'ajuster vos filtres ou vos mots-clés.</p>
              <button onClick={clearFilters} className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-[16px] cursor-pointer">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid-container">
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>

              {/* Pagination controls */}
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, page - Math.floor(maxVisible / 2));
                let end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1);
                }
                const visiblePages = [];
                for (let i = start; i <= end; i++) {
                  visiblePages.push(i);
                }

                return totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 pt-6">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="p-3 bg-white border border-slate-100 text-slate-700 rounded-full disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      title="Page précédente"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    {visiblePages.length > 0 && visiblePages[0] > 1 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className={`w-10 h-10 rounded-full text-xs font-bold border transition-colors bg-white text-slate-700 border-slate-100 hover:bg-slate-50`}
                        >
                          1
                        </button>
                        {visiblePages[0] > 2 && (
                          <span className="text-slate-400 text-xs px-1">...</span>
                        )}
                      </>
                    )}

                    {visiblePages.map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => handlePageChange(pNum)}
                        className={`w-10 h-10 rounded-full text-xs font-bold border transition-colors ${
                          page === pNum
                            ? 'bg-brand-secondary text-brand-primary border-brand-secondary'
                            : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    ))}

                    {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages && (
                      <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                          <span className="text-slate-400 text-xs px-1">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className={`w-10 h-10 rounded-full text-xs font-bold border transition-colors bg-white text-slate-700 border-slate-100 hover:bg-slate-50`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="p-3 bg-white border border-slate-100 text-slate-700 rounded-full disabled:opacity-50 hover:bg-slate-50 transition-colors"
                      title="Page suivante"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </main>
      </div>

      {/* MOBILE DRAWER FILTERS PANEL */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            {/* Overlay backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Sidebar content */}
            <motion.div
              className="w-80 bg-white border-l border-gray-200 h-full p-6 flex flex-col space-y-6 overflow-y-auto relative z-10 shadow-lg shadow-gray-200/50 text-left"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-black text-slate-800 text-xs tracking-wider uppercase flex items-center">
                  <SlidersHorizontal size={13} className="mr-2 text-brand-primary" />
                  Filtres
                </h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Same filter inputs as desktop for mobile layout */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rechercher</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Référence, Mot-clé..."
                  className="w-full bg-slate-50 border border-slate-100 text-slate-805 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marque</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3"
                >
                  <option value="">Toutes les marques</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prix (DA)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disponible uniquement</span>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 text-brand-primary accent-brand-primary"
                />
              </div>

              <div className="flex flex-col space-y-2 pt-4">
                <button
                  onClick={() => applyFilters()}
                  className="w-full bg-gray-50 text-brand-primary border border-brand-primary/20 font-black text-xs uppercase tracking-wider py-4 rounded-[14px] cursor-pointer"
                >
                  Appliquer les Filtres
                </button>
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-slate-500 font-bold text-xs uppercase tracking-wider py-4 rounded-[14px] cursor-pointer"
                >
                  Tout effacer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
