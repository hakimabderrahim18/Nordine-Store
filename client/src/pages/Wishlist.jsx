import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchWishlist } from '../store/wishlistSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="pt-32 min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4 px-6">
        <Heart size={48} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Votre liste de favoris est verrouillée</h2>
        <p className="text-xs text-slate-500 max-w-xs text-center">Veuillez vous connecter à votre compte pour voir vos produits favoris.</p>
        <Link to="/login?redirect=/wishlist" className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-8 py-4 rounded-[20px]">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24">
      {/* Title */}
      <div className="flex flex-col space-y-2 mb-10">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Favoris</span>
        <h1 className="text-3xl font-black text-slate-800">VOS PRODUITS FAVORIS</h1>
      </div>

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Heart size={48} className="text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Votre liste de favoris est vide</h3>
          <p className="text-xs text-slate-500">Enregistrez les produits que vous commandez fréquemment pour y accéder rapidement.</p>
          <Link to="/shop" className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-8 py-4 rounded-[20px]">
            Parcourir la boutique
          </Link>
        </div>
      ) : (
        <div className="product-grid-container">
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
