import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShieldCheck, Truck, RefreshCw, Heart, Plus, Minus, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { addCartItem, addGuestItem } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { productService, getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Gallery
  const [activeImage, setActiveImage] = useState('');
  
  // Options & Cart
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Tabs (description vs specs vs reviews)
  const [activeTab, setActiveTab] = useState('description');

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const isFavorited = wishlistItems.some(p => p._id === id || p === id);

  // Inject Schema.org JSON-LD Structured Data for Google Indexing & Google Images
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Nounou Telecom`;

      const jsonLdData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images?.map(img => getImageUrl(img)) || [],
        description: product.description || product.name,
        sku: product.sku || product._id,
        brand: {
          '@type': 'Brand',
          name: product.brand?.name || 'Nounou Telecom'
        },
        offers: {
          '@type': 'Offer',
          url: window.location.href,
          priceCurrency: 'DZD',
          price: product.discountPrice || product.priceDetail || product.price || 0,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Nounou Telecom'
          }
        }
      };

      let script = document.getElementById('product-jsonld');
      if (!script) {
        script = document.createElement('script');
        script.id = 'product-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLdData);

      return () => {
        const existing = document.getElementById('product-jsonld');
        if (existing) existing.remove();
      };
    }
  }, [product]);

  // Fetch Product details & reviews
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(id);
        if (res.success) {
          setProduct(res.product);
          setActiveImage(res.product.images?.[0] || '');

          // Setup initial default variants
          const defaults = {};
          if (res.product.variants && res.product.variants.length > 0) {
            res.product.variants.forEach((v) => {
              defaults[v.name] = v.options[0];
            });
          }
          setSelectedVariants(defaults);

          // Update Recently Viewed in localStorage
          const localViewed = localStorage.getItem('recentlyViewed');
          let viewedList = localViewed ? JSON.parse(localViewed) : [];
          viewedList = viewedList.filter((item) => item._id !== res.product._id);
          viewedList.unshift(res.product);
          viewedList = viewedList.slice(0, 4);
          localStorage.setItem('recentlyViewed', JSON.stringify(viewedList));
          setRecentlyViewed(viewedList.filter((item) => item._id !== res.product._id));
        }

        fetchReviewsList();
      } catch (err) {
        console.error('Error fetching product data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  const fetchReviewsList = async () => {
    setReviewsLoading(true);
    try {
      const res = await productService.getReviews(id);
      if (res.success) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleVariantChange = (name, value) => {
    setSelectedVariants((prev) => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (type) => {
    if (type === 'inc') {
      if (quantity < (product?.stock || 0)) {
        setQuantity(quantity + 1);
      } else {
        toast.error('Impossible de dépasser la limite de stock disponible');
      }
    } else {
      if (quantity > 1) {
        setQuantity(quantity - 1);
      }
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً لعرض الأسعار والطلب' : 'Veuillez vous connecter pour voir les prix et commander');
      navigate('/login');
      return;
    }
    dispatch(addCartItem({ productId: product._id, quantity, variant: selectedVariants }));
    toast.success('Ajouté au panier avec succès !');
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour gérer vos favoris');
      return;
    }
    dispatch(toggleWishlist(product._id));
    toast.success(isFavorited ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Le commentaire de l\'avis ne peut pas être vide');
      return;
    }

    try {
      const res = await productService.createReview(id, { rating, comment });
      if (res.success) {
        toast.success('Avis soumis avec succès !');
        setComment('');
        fetchReviewsList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la soumission de l\'avis');
    }
  };

  if (loading) {
    return (
      <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24 space-y-8 text-left">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-slate-200 rounded-full w-48 animate-pulse" />
        
        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/40 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
          {/* Gallery Block */}
          <div className="space-y-4">
            <div className="w-full aspect-square bg-slate-50 rounded-[24px] animate-pulse" />
            <div className="flex space-x-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-16 h-16 bg-slate-50 rounded-[12px] animate-pulse" />
              ))}
            </div>
          </div>
          {/* Details Block */}
          <div className="space-y-6">
            <div className="h-4 bg-slate-150 rounded-full w-24 animate-pulse" />
            <div className="h-8 bg-slate-200 rounded-full w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-150 rounded-full w-1/3 animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-[16px] animate-pulse" />
            <div className="h-10 bg-slate-150 rounded-full w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 max-w-7xl mx-auto px-6 min-h-screen text-center">
        <h2 className="text-xl font-bold text-slate-800">Produit non trouvé.</h2>
        <Link to="/shop" className="mt-4 inline-block text-brand-primary font-bold">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24 text-left">
      {/* Breadcrumbs */}
      <div className="text-xs font-semibold text-slate-400 mb-6 space-x-1">
        <Link to="/" className="hover:text-brand-primary">Accueil</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-primary">Boutique</Link>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate max-w-xs inline-block align-bottom">
          {product.name}
        </span>
      </div>

      {/* Main product configuration grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(17,24,39,0.02)]">
        
        {/* Left Column: Image Gallery */}
        <div className="flex flex-col space-y-4">
          <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-[24px] p-8 flex items-center justify-center overflow-hidden relative group">
            <img
              src={getImageUrl(activeImage)}
              alt={product.name}
              className="max-h-full object-contain rounded-2xl group-hover:scale-108 transition-transform duration-500 ease-out cursor-zoom-in"
            />
          </div>
          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 bg-slate-50 border p-2 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-colors ${
                    activeImage === img ? 'border-brand-primary' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Checkout Panel */}
        <div className="flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full">
                {product.brand?.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400">SKU: <span className="ltr-text">{product.sku}</span></span>
            </div>

            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 leading-tight uppercase">
              {product.name}
            </h1>

            {/* Stars & rating count */}
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-50">
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    size={12}
                    className={idx < Math.round(product.rating) ? 'fill-brand-primary text-brand-primary' : 'text-slate-200'}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-slate-800">{product.rating}</span>
              <span className="text-xs text-slate-400">({product.numReviews} avis vérifiés)</span>
            </div>

            {/* Price display */}
            <div className="flex flex-col text-left space-y-1.5 pt-2">
              {!isAuthenticated ? (
                <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-4.5 text-slate-800 space-y-1.5 max-w-md">
                  <span className="font-black uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1.5">
                    {language === 'ar' ? 'محتوى محمي للمحترفين' : 'Prix réservé aux membres'}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    {language === 'ar' ? 'يرجى تسجيل الدخول أو إنشاء حساب لعرض الأسعار وطلب المنتجات.' : 'Veuillez vous connecter ou créer un compte approuvé pour afficher les prix et commander.'}
                  </p>
                  <Link to="/login" className="inline-block mt-2 bg-brand-primary text-slate-900 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-[12px]">
                    {language === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}
                  </Link>
                </div>
              ) : (() => {
                let price = product.discountPrice || product.price;
                let isB2B = false;
                if (user) {
                  if (user.clientType === 'demi-gros' && product.demiGrosPrice) {
                    price = product.demiGrosPrice;
                    isB2B = true;
                  } else if (user.clientType === 'super-gros' && product.superGrosPrice) {
                    price = product.superGrosPrice;
                    isB2B = true;
                  }
                }
                const hasDiscount = product.discountPrice && !isB2B;

                return (
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 ltr-text">{price.toLocaleString()} DA</span>
                    {(hasDiscount || isB2B) && (
                      <span className="text-sm text-slate-400 line-through ltr-text">
                        {product.price.toLocaleString()} DA
                      </span>
                    )}
                    {isB2B && (
                      <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Tarif {user.clientType === 'demi-gros' ? 'demi-gros' : 'super-gros'} actif
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-2 whitespace-pre-line">
              {product.description}
            </p>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 py-4 border-t border-b border-slate-50">
                {product.variants.map((v) => (
                  <div key={v.name} className="flex flex-col space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{v.name}</span>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt) => {
                        const isSelected = selectedVariants[v.name] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleVariantChange(v.name, opt)}
                            className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                              isSelected
                                ? 'bg-brand-secondary text-brand-primary border-brand-secondary'
                                : 'bg-white text-slate-700 border-slate-250 hover:border-slate-350'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Quantity Controls & Add actions */}
            <div className="flex items-center space-x-4 py-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantité</span>
                <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                  <button
                    onClick={() => handleQtyChange('dec')}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-700 hover:text-brand-primary active:scale-90 transition-transform"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => handleQtyChange('inc')}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-700 hover:text-brand-primary active:scale-90 transition-transform"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-1 justify-end pt-5">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4.5 rounded-[16px] shadow-md hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-300"
                  >
                    {product.stock === 0 ? 'Rupture de Stock' : 'Ajouter au panier'}
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className="p-4 rounded-[16px] border border-slate-200 hover:border-red-400 text-gray-400 hover:text-red-500 transition-colors active:scale-95"
                  >
                    <Heart size={16} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick trust assurances */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-4">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck size={14} className="text-brand-primary" />
                <span>Pièce Testée</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Truck size={14} className="text-brand-primary" />
                <span>Expédition Rapide</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <RefreshCw size={14} className="text-brand-primary" />
                <span>Retour 30 Jours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs description / Specifications / Reviews section */}
      <div className="mt-12 bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(17,24,39,0.02)] p-6 md:p-8">
        <div className="flex space-x-6 border-b border-slate-50 pb-4 mb-6">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-black uppercase tracking-wider pb-2 relative transition-colors ${
                activeTab === tab ? 'text-slate-800' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              {tab === 'description' ? 'description' : tab === 'specifications' ? 'spécifications' : 'avis'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content renderer */}
        <div>
          {activeTab === 'description' && (
            <div className="text-xs text-slate-500 leading-relaxed space-y-4 whitespace-pre-line">
              <p>{product.longDescription || product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="overflow-x-auto">
              {product.specifications && product.specifications.length > 0 ? (
                <table className="w-full text-xs text-left text-slate-500">
                  <tbody>
                    {product.specifications.map((spec) => (
                      <tr key={spec.key} className="border-b border-slate-50">
                        <th scope="row" className="py-3.5 px-4 font-bold text-slate-700 uppercase tracking-wider w-1/3 bg-slate-50">
                          {spec.key}
                        </th>
                        <td className="py-3.5 px-4">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-400">Aucune spécification fournie.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Form to submit review */}
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-[20px] border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-800 text-xs tracking-wide uppercase">Rédiger un avis vérifié</h3>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note :</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            size={14}
                            className={star <= rating ? 'fill-brand-primary text-brand-primary' : 'text-slate-200'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Partagez votre expérience d'utilisation avec ce produit..."
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                    />
                    <button
                      type="submit"
                      className="absolute right-3.5 bottom-3.5 p-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-full transition-all active:scale-90"
                    >
                      <Send size={11} />
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-[16px] text-center border border-slate-100">
                  Veuillez vous <Link to="/login" className="text-brand-primary font-bold">connecter</Link> pour soumettre un avis.
                </p>
              )}

              {/* Reviews list */}
              {reviewsLoading ? (
                <p className="text-xs text-slate-400">Chargement des avis...</p>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Aucun avis client pour le moment. Soyez le premier à donner votre avis !</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="pb-6 border-b border-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-slate-400 border border-gray-200 flex-shrink-0">
                            <User size={14} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{rev.user?.name || 'Technicien'}</h4>
                            <div className="flex items-center space-x-0.5">
                              {[...Array(5)].map((_, idx) => (
                                <Star
                                  key={idx}
                                  size={10}
                                  className={idx < rev.rating ? 'fill-brand-primary text-brand-primary' : 'text-slate-200'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-505 leading-relaxed pl-11">{rev.comment}</p>
                      
                      {/* Admin response */}
                      {rev.response && (
                        <div className="ml-11 bg-slate-50 p-4 rounded-[16px] border border-slate-100 mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-800">Support Nounou Telecom</span>
                            <span className="text-[9px] text-slate-400">Réponse Officielle</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{rev.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed list */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16 space-y-6">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Produits consultés récemment</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((item) => (
              <Link
                key={item._id}
                to={`/products/${item._id}`}
                className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_-4px_rgba(17,24,39,0.02)] flex flex-col space-y-2 hover:shadow-md transition-shadow group text-left"
              >
                <div className="aspect-square bg-slate-50 rounded-[14px] p-4 flex items-center justify-center overflow-hidden">
                  <img src={getImageUrl(item.images?.[0])} alt="" className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate uppercase tracking-wide">{item.name}</h4>
                {isAuthenticated ? (
                  <span className="text-xs font-black text-slate-900">{item.price.toLocaleString()} DA</span>
                ) : (
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wide">
                    {language === 'ar' ? 'سجل لرؤية السعر' : 'Se connecter'}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
