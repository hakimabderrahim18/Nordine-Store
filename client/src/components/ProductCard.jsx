import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { toggleWishlist } from '../store/wishlistSlice';
import { addCartItem } from '../store/cartSlice';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { getProductQualityBadge } from '../utils/qualityHelper';

export default function ProductCard({ product }) {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.products || []);

  const isFavorited = wishlistItems.some(p => p._id === product._id || p === product._id);

  // Exact Rupture de Stock check: no value, null, undefined, 0, or isAvailable === false
  const isOutOfStock = !product.stock || Number(product.stock) <= 0 || product.isAvailable === false;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error(isAr ? 'يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة' : 'Veuillez vous connecter pour gérer vos favoris');
      return;
    }
    dispatch(toggleWishlist(product._id));
    toast.success(
      isFavorited
        ? (isAr ? 'تمت الإزالة من المفضلة' : 'Retiré des favoris')
        : (isAr ? 'تمت الإضافة للمفضلة' : 'Ajouté aux favoris')
    );
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const defaultVariant = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        defaultVariant[v.name] = v.options[0];
      });
    }

    dispatch(addCartItem({ productId: product._id, quantity: 1, variant: defaultVariant }));
    toast.success(t('added_to_cart') || (isAr ? 'تمت الإضافة إلى السلة' : 'Ajouté au panier !'));
  };

  // Pricing calculations
  let basePrice = product.priceDetail || product.price || 0;
  let activePrice = basePrice;
  let isB2B = false;
  let b2bLabel = '';

  if (user && isAuthenticated) {
    if (user.clientType === 'demi-gros' && (product.priceDemiGros || product.demiGrosPrice)) {
      activePrice = product.priceDemiGros || product.demiGrosPrice;
      isB2B = true;
      b2bLabel = t('b2b_demi') || 'Demi-gros';
    } else if (user.clientType === 'super-gros' && (product.priceSuperGros || product.superGrosPrice)) {
      activePrice = product.priceSuperGros || product.superGrosPrice;
      isB2B = true;
      b2bLabel = t('b2b_super') || 'Super-gros';
    } else if (user.clientType === 'reparateur' && (product.priceReparation || product.priceDetailReparation)) {
      activePrice = product.priceReparation || product.priceDetailReparation;
      isB2B = true;
      b2bLabel = isAr ? 'مصلح' : 'Réparateur';
    }
  }

  const promoPrice = product.pricePromo || product.discountPrice;
  const hasPromo = Boolean(!isB2B && promoPrice && promoPrice > 0 && promoPrice < activePrice);
  const finalPrice = hasPromo ? promoPrice : activePrice;
  const strikethroughPrice = hasPromo ? activePrice : (isB2B ? basePrice : null);
  const discountPercent = hasPromo && basePrice > 0 ? Math.round(((basePrice - promoPrice) / basePrice) * 100) : null;

  const quality = getProductQualityBadge(product.name);
  const brandName = product.marque || product.brand?.name || (isAr ? 'قطع غيار' : 'COMPOSANT');

  return (
    <div
      className="w-full relative bg-white border border-slate-200/80 hover:border-amber-400/90 rounded-[22px] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden text-left"
    >
      {/* Top Badges & Wishlist Button */}
      <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[9px] font-black uppercase tracking-wider bg-white/95 border border-slate-200/90 text-amber-700 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs">
            {brandName}
          </span>
          {Boolean(discountPercent && discountPercent > 0) && (
            <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          className="pointer-events-auto p-2 rounded-full bg-white/90 hover:bg-white border border-slate-200/80 text-slate-400 hover:text-rose-500 shadow-xs backdrop-blur-md transition-all active:scale-90 cursor-pointer"
          title={isFavorited ? (isAr ? 'إزالة من المفضلة' : 'Retirer des favoris') : (isAr ? 'إضافة للمفضلة' : 'Ajouter aux favoris')}
        >
          <Heart size={14} className={isFavorited ? 'fill-rose-500 text-rose-500' : ''} />
        </button>
      </div>

      {/* Product Image Area */}
      <Link
        to={`/products/${product._id}`}
        className="block relative w-full h-44 sm:h-48 md:h-52 bg-gradient-to-b from-slate-50/70 to-white flex items-center justify-center p-4.5 overflow-hidden flex-shrink-0"
      >
        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.name}
          className={`max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-106 ${
            isOutOfStock ? 'opacity-35 grayscale-[50%]' : ''
          }`}
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center p-2">
            <span className="text-[10px] font-black text-rose-600 tracking-wider uppercase border border-rose-300 bg-rose-50/95 px-3 py-1 rounded-full shadow-xs">
              {t('out_of_stock') || (isAr ? 'نفذ المخزون' : 'Rupture de stock')}
            </span>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 sm:p-4.5 flex-grow flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Subfamily / Quality / Stock Status Header */}
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <div className="flex items-center gap-1.5 overflow-hidden">
              {quality && (
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border whitespace-nowrap shadow-2xs ${quality.color}`}>
                  {quality.shortLabel || quality.label}
                </span>
              )}
              {product.sousFamille && (
                <span className="text-slate-400 font-bold uppercase truncate max-w-[110px]">
                  {product.sousFamille}
                </span>
              )}
            </div>

            {/* Stock pill */}
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
              isOutOfStock ? 'text-rose-500' : 'text-emerald-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {isOutOfStock ? (isAr ? 'غير متوفر' : 'Rupture') : (isAr ? 'متوفر' : 'En stock')}
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/products/${product._id}`} className="block group-hover:text-amber-600 transition-colors">
            <h3
              className="text-xs sm:text-[13px] font-extrabold text-slate-800 line-clamp-2 min-h-[34px] leading-snug tracking-tight"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add to Cart footer */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div className="flex flex-col text-left overflow-hidden">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {finalPrice > 0 ? (
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight ltr-text">
                  {finalPrice.toLocaleString('fr-FR')} <span className="text-[11px] font-black text-amber-600">DA</span>
                </span>
              ) : (
                <span className="text-xs font-black text-amber-600">
                  {isAr ? 'السعر عند الطلب' : 'Sur devis'}
                </span>
              )}

              {Boolean(strikethroughPrice && strikethroughPrice > finalPrice) && (
                <span className="text-[11px] text-slate-400 line-through ltr-text">
                  {strikethroughPrice.toLocaleString('fr-FR')} DA
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              {isB2B ? (
                <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                  ★ {b2bLabel}
                </span>
              ) : (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {product.sku ? `SKU: ${product.sku}` : ''}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-92 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-brand-primary hover:bg-amber-400 text-slate-950 hover:shadow-md'
            }`}
            title={isOutOfStock ? (isAr ? 'نفذ المخzون' : 'Rupture de stock') : (isAr ? 'أضف إلى السلة' : 'Ajouter au panier')}
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
