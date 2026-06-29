import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw, Wrench, ArrowRight, Star, Quote, Award, Headphones, ShoppingBag, Package } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import HeroParticles from '../components/HeroParticles';
import { productService, categoryService, brandService, getImageUrl } from '../services/api';
import heroSideImg from '../assets/hero_side.png';


export default function Home() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mouse hover 3D tilt effect state for DZFAST banner
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 12, y: -y * 12 }); // Rotate max 12 degrees
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const catRes = await categoryService.getCategories();
        const brandRes = await brandService.getBrands();
        const prodRes = await productService.getProducts({ page: 1, limit: 8 });

        if (catRes.success) setCategories(catRes.categories);
        if (brandRes.success) setBrands(brandRes.brands);
        if (prodRes.success) setPopularProducts(prodRes.products);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const stats = [
    { value: '50k+', label: 'Pièces détachées livrées' },
    { value: '99.4%', label: 'Validation de qualité réussie' },
    { value: '4.9/5', label: 'Évaluation des techniciens' },
    { value: '24h', label: 'Vitesse d\'expédition moyenne' }
  ];

  const features = [
    { icon: <ShieldCheck size={24} className="text-amber-500" />, title: 'Vérification Premium', text: 'Tous les modules subissent des tests stricts d\'électricité et de sensibilité tactile.' },
    { icon: <Truck size={24} className="text-amber-500" />, title: 'Expédition le jour même', text: 'Les commandes complétées avant 15h00 sont expédiées le jour même.' },
    { icon: <RotateCcw size={24} className="text-amber-500" />, title: 'Support à vie', text: 'Politiques de retour et consultation directe des techniciens pour les clients.' },
    { icon: <Wrench size={24} className="text-amber-500" />, title: 'Qualité Technicien', text: 'Variantes de qualité triées avec précision par OEM et Service Pack.' }
  ];

  const testimonials = [
    { name: 'Sofiane R.', role: 'Propriétaire de PhoneFix DZ', text: 'Nounou Telecom a complètement transformé notre chaîne d\'approvisionnement en gros. Les écrans sont parfaitement calibrés et l\'expédition est ultra rapide.' },
    { name: 'Karim M.', role: 'Technicien de laboratoire', text: 'La vérification de la capacité de la batterie est authentique. Pas de gonflement, emballage standard et fiches techniques détaillées. Fortement recommandé pour les ateliers.' },
    { name: 'Sarah B.', role: 'Réparations Express', text: 'Support client incroyable. Les demandes de garantie à vie sont traitées instantanément et la qualité des pièces correspond aux packs officiels.' }
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-left">
      {/* 1. HERO SECTION */}
      <section 
        className="relative w-full text-white pt-28 pb-16 md:py-24 overflow-hidden border-b border-gray-200 bg-gradient-to-br from-white via-amber-50/30 to-white"
      >
        {/* Animated canvas particles layer */}
        <HeroParticles />
        {/* Dark vignette overlay to blend particles with background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent pointer-events-none" style={{ zIndex: 2 }} />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative" style={{ zIndex: 5 }}>
          <div className="flex flex-col space-y-6 z-10 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col space-y-2"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 leading-[1.1] tracking-tight uppercase">
                PIÈCES DÉTACHÉES <br />
                <span className="text-amber-500 font-black">& ACCESSOIRES</span>
              </h1>
              <p className="text-sm sm:text-base font-black text-slate-600 tracking-widest uppercase">
                POUR TOUS SMARTPHONES
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-600 text-xs sm:text-sm font-semibold tracking-wide"
            >
              Qualité premium &bull; Prix imbattables &bull; Livraison rapide
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link
                to="/shop"
                className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[6px] flex items-center space-x-2 shadow-lg shadow-brand-primary/20 transition-transform active:scale-97 hover:opacity-90"
              >
                <ShoppingBag size={14} className="fill-slate-950 text-slate-950" />
                <span>DÉCOUVRIR NOS PRODUITS</span>
              </Link>
              <a
                href="#categories"
                className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[6px] flex items-center space-x-2 transition-all active:scale-97"
              >
                <Package size={14} />
                <span>VOIR CATÉGORIES</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-200 max-w-lg"
            >
              <div className="flex flex-col items-start text-left space-y-2">
                <div className="text-amber-500"><Award size={18} /></div>
                <span className="text-[9px] font-black text-slate-600 tracking-wider uppercase leading-snug">PRODUITS<br/>DE QUALITÉ</span>
              </div>
              <div className="flex flex-col items-start text-left space-y-2">
                <div className="text-amber-500"><Truck size={18} /></div>
                <span className="text-[9px] font-black text-slate-600 tracking-wider uppercase leading-snug">LIVRAISON<br/>RAPIDE</span>
              </div>
              <div className="flex flex-col items-start text-left space-y-2">
                <div className="text-amber-500"><ShieldCheck size={18} /></div>
                <span className="text-[9px] font-black text-slate-600 tracking-wider uppercase leading-snug">GARANTIE<br/>DISPONIBLE</span>
              </div>
              <div className="flex flex-col items-start text-left space-y-2">
                <div className="text-amber-500"><Headphones size={18} /></div>
                <span className="text-[9px] font-black text-slate-600 tracking-wider uppercase leading-snug">SUPPORT<br/>24/7</span>
              </div>
            </motion.div>
          </div>

          {/* Right column: Beautiful hero image side-by-side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            {/* Soft gold light glow behind the image */}
            <div className="absolute w-[350px] h-[350px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <img
              src={heroSideImg}
              alt="Nounou Telecom Premium Tech Repair Parts"
              className="w-full max-w-[500px] h-auto object-contain rounded-[32px] border border-gray-200 shadow-xl shadow-gray-200/40 relative z-10"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="bg-brand-secondary text-slate-800 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex flex-col space-y-1.5"
            >
              <span className="text-2xl md:text-4xl font-black text-brand-primary">{stat.value}</span>
              <span className="text-[10px] md:text-xs text-slate-500 font-semibold tracking-wide uppercase">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED CATEGORIES SECTION */}
      <section id="categories" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Composants Classés</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">CATÉGORIES VEDETTES</h2>
          </div>
          <Link to="/shop" className="text-xs font-black text-slate-500 flex items-center space-x-1.5 hover:text-brand-primary group transition-colors">
            <span>Voir toutes les catégories</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {categories.slice(0, 5).map((cat) => (
            <Link
              to={`/shop?category=${cat._id}`}
              key={cat._id}
              className="group relative h-56 bg-brand-card border border-gray-200 rounded-[20px] overflow-hidden flex flex-col p-5 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-500"
            >
              <div className="absolute inset-0 z-0 bg-slate-100">
                <img
                  src={getImageUrl(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/95 via-brand-secondary/40 to-transparent" />
              </div>

              <div className="relative z-10 mt-auto flex flex-col space-y-1">
                <h3 className="text-slate-800 font-black text-xs tracking-wide group-hover:text-brand-primary transition-colors uppercase">
                  {cat.name}
                </h3>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Explorer les pièces →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. POPULAR PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col space-y-1 mb-10 text-left">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Favoris des Techniciens</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">MODULES MATÉRIELS POPULAIRES</h2>
        </div>

        <div className="product-grid-container">
          <div className="product-grid">
            {popularProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. BRANDS INFINITE MARQUEE */}
      <section className="py-16 border-t border-gray-200 overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Appareils & Constructeurs Supportés</span>
        </div>
        
        {brands.length > 0 && (
          <div className="relative w-full overflow-hidden flex items-center py-2">
            {/* Fade overlays on sides of the marquee */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee whitespace-nowrap space-x-6 select-none">
              {brands.concat(brands).concat(brands).concat(brands).concat(brands).concat(brands).map((brand, index) => (
                <Link
                  to={`/shop?brand=${brand._id}`}
                  key={`${brand._id}-${index}`}
                  className="inline-flex items-center space-x-3 bg-brand-card border border-gray-200 hover:border-brand-primary/30 px-6 py-4.5 rounded-[24px] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group flex-shrink-0"
                >
                  {brand.logo ? (
                    <img
                      src={getImageUrl(brand.logo)}
                      alt={brand.name}
                      className="w-8 h-8 rounded-[8px] object-contain p-0.5 bg-gray-50 border border-gray-200 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-[8px] bg-gray-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                      {brand.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-black text-xs tracking-wider text-slate-700 group-hover:text-brand-primary transition-colors uppercase">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 7. WHY CHOOSE US / ADVANTAGES */}
      <section className="max-w-7xl mx-auto px-6 py-12 bg-brand-card rounded-[32px] border border-gray-200 shadow-[0_4px_30px_-5px_rgba(0,0,0,0.06)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-16">
        <div className="flex flex-col space-y-6 p-4 md:p-8 text-left">
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Notre Engagement</span>
            <h2 className="text-2xl font-black text-slate-800 leading-tight uppercase">CONÇU POUR L'EXCELLENCE</h2>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            Nounou Telecom a été fondé par des ingénieurs en réparation pour résoudre la crisis des composants de basse qualité. Chaque lot est calibré avec rigueur.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {features.map((feat, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-[12px] w-fit">
                  {feat.icon}
                </div>
                <h3 className="font-black text-slate-800 text-xs tracking-wide uppercase">{feat.title}</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{feat.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[300px] lg:h-[450px] bg-gray-100 rounded-[24px] overflow-hidden m-4 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800&auto=format&fit=crop"
            alt="Hardware Lab"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col space-y-1 text-slate-800 text-left">
            <span className="text-brand-primary text-[9px] uppercase font-black tracking-widest">Approuvé par les Techniciens</span>
            <h3 className="text-base font-black uppercase">POLITIQUE DE GARANTIE À VIE</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">Tous les écrans bénéficient d'une garantie à vie limitée couvrant les pannes tactiles et d'affichage.</p>
          </div>
        </div>
      </section>



      {/* 9. NEWSLETTER SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 py-16 bg-brand-secondary text-slate-800 rounded-[32px] overflow-hidden my-16 border border-gray-200">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[100px] -top-48 -right-48 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col space-y-5">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">Nouveaux Stocks Hebdomadaires</span>
          <h2 className="text-2xl md:text-4xl font-black uppercase">S'ABONNER AUX ALERTES DE STOCK</h2>
          <p className="text-slate-500 text-xs leading-relaxed max-w-lg mx-auto font-medium">
            Recevez des alertes de réapprovisionnement pour les écrans très demandés (iPhone/Samsung) et des codes promo directement dans votre boîte mail.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-3.5 sm:space-y-0 sm:space-x-3.5 max-w-md mx-auto w-full pt-3">
            <input
              type="email"
              placeholder="Entrez votre adresse e-mail"
              className="w-full bg-white border border-gray-200 text-slate-800 rounded-[16px] px-5 py-3.5 text-xs focus:outline-none focus:border-brand-primary"
            />
            <button className="w-full sm:w-auto gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-[16px] whitespace-nowrap hover:scale-103 active:scale-97 transition-transform duration-300">
              Rejoindre les Alertes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
