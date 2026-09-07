import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { toggleWishlist } from '../store/wishlistSlice';
import { addCartItem, addGuestItem } from '../store/cartSlice';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ProductCard({ product }) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const isFavorited = wishlistItems.some(p => p._id === product._id || p === product._id);

  // Smooth 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة' : 'Veuillez vous connecter pour gérer vos favoris');
      return;
    }
    dispatch(toggleWishlist(product._id));
    toast.success(
      isFavorited
        ? (language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Retiré des favoris')
        : (language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Ajouté aux favoris')
    );
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        defaultVariant[v.name] = v.options[0];
      });
    }

    if (!isAuthenticated) {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً لعرض الأسعار والطلب' : 'Veuillez vous connecter pour voir les prix et commander');
      navigate('/login');
      return;
    }

    dispatch(addCartItem({ productId: product._id, quantity: 1, variant: defaultVariant }));
    toast.success(t('added_to_cart'));
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="w-full relative bg-brand-card border border-gray-200 rounded-[20px] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.06)] overflow-hidden group hover:shadow-[0_20px_40px_-10px_rgba(247,181,0,0.15)] transition-shadow duration-500 flex flex-col justify-between h-[390px] text-left"
    >
      {/* Badges / Top Actions */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-widest bg-white/90 border border-gray-200 text-brand-primary px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
          {product.brand?.name || 'ORIGINAL'}
        </span>
        {product.discountPrice && (
          <span className="text-[9px] font-black bg-brand-primary text-brand-secondary px-2.5 py-1 rounded-full shadow-sm">
            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </span>
        )}
      </div>

      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white border border-gray-200 text-slate-400 hover:text-red-500 shadow-sm backdrop-blur-sm transition-all duration-300 active:scale-90 cursor-pointer"
      >
        <Heart size={14} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
      </button>

      {/* Image container */}
      <Link to={`/products/${product._id}`} className="block relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-106 transition-transform duration-500 ease-out"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[9px] font-black text-red-500 tracking-wider uppercase border border-red-500 px-2.5 py-1 rounded">
              {t('out_of_stock')}
            </span>
          </div>
        )}
      </Link>

      {/* Info details */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star size={11} className="fill-brand-primary text-brand-primary" />
            <span className="text-[10px] font-black text-slate-600">{product.rating}</span>
            <span className="text-[9px] text-slate-500">({product.numReviews})</span>
          </div>

          {/* Product Title */}
          <Link to={`/products/${product._id}`} className="block">
            <h3 className="text-xs font-black text-slate-800 tracking-wide line-clamp-2 h-9 leading-relaxed hover:text-brand-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-200 mt-2">
          <div className="flex flex-col text-left">
            {!isAuthenticated ? (
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-wide">
                {language === 'ar' ? 'سجل لرؤية السعر' : 'Se connecter pour voir le prix'}
              </span>
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
                <div className="flex flex-col">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base font-black text-slate-800 ltr-text">{price.toLocaleString()} DA</span>
                    {(hasDiscount || isB2B) && (
                      <span className="text-[10px] text-slate-500 line-through ltr-text">
                        {product.price.toLocaleString()} DA
                      </span>
                    )}
                  </div>
                  {isB2B && (
                    <span className="text-[8px] font-black text-brand-primary uppercase tracking-wider mt-0.5">
                      {t('b2b_active')} {user.clientType === 'demi-gros' ? t('b2b_demi') : t('b2b_super')}
                    </span>
                  )}
                </div>
              );
            })()}
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('sku')}: <span className="ltr-text">{product.sku}</span></span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`p-2.5 rounded-full shadow-sm transition-all duration-300 cursor-pointer ${
              product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white hover:scale-108 active:scale-95'
            }`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
