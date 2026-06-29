import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCart, updateCartItemQty, removeCartItem, updateGuestItemQty, removeGuestItem } from '../store/cartSlice';
import { couponService, getImageUrl } from '../services/api';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, loading } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);



  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleQtyChange = (productId, quantity, variant, stock) => {
    if (quantity < 1) return;
    if (quantity > stock) {
      toast.error('Impossible de dépasser la limite de stock disponible');
      return;
    }
    const variantObj = variant instanceof Map ? Object.fromEntries(variant) : variant;
    if (isAuthenticated) {
      dispatch(updateCartItemQty({ productId, quantity, variant: variantObj }));
    } else {
      dispatch(updateGuestItemQty({ productId, quantity, variant: variantObj }));
    }
  };

  const handleRemoveItem = (productId, variant) => {
    const variantObj = variant instanceof Map ? Object.fromEntries(variant) : variant;
    if (isAuthenticated) {
      dispatch(removeCartItem({ productId, variant: variantObj }));
    } else {
      dispatch(removeGuestItem({ productId, variant: variantObj }));
    }
    toast.success('Article retiré du panier');
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    let price = item.product?.discountPrice || item.product?.price || 0;
    if (user) {
      if (user.clientType === 'demi-gros' && item.product?.demiGrosPrice) {
        price = item.product.demiGrosPrice;
      } else if (user.clientType === 'super-gros' && item.product?.superGrosPrice) {
        price = item.product.superGrosPrice;
      }
    }
    return acc + price * item.quantity;
  }, 0);

  const shipping = subtotal > 15000 || subtotal === 0 ? 0 : 800;
  const total = subtotal + shipping;

  const handleProceed = () => {
    if (items.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24 text-left">
      {/* Title */}
      <div className="flex flex-col space-y-1 mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Votre Panier</span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase">VOS ARTICLES SÉLECTIONNÉS</h1>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <ShoppingBag size={40} className="text-slate-400" />
          <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">Votre panier est vide</h3>
          <p className="text-xs text-slate-500">Vous n'avez pas encore ajouté d'articles.</p>
          <Link to="/shop" className="gold-bg-gradient text-brand-secondary font-black text-xs uppercase tracking-wider px-6 py-3 rounded-[16px] inline-block shadow-sm">
            Parcourir la boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, idx) => {
              const product = item.product;
              if (!product) return null;

              let activePrice = product.discountPrice || product.price;
              let isB2BPrice = false;
              if (user) {
                if (user.clientType === 'demi-gros' && product.demiGrosPrice) {
                  activePrice = product.demiGrosPrice;
                  isB2BPrice = true;
                } else if (user.clientType === 'super-gros' && product.superGrosPrice) {
                  activePrice = product.superGrosPrice;
                  isB2BPrice = true;
                }
              }

              const variantObj = item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant;
              const variantStr = variantObj
                ? Object.entries(variantObj).map(([k, v]) => `${k}: ${v}`).join(', ')
                : '';

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-[0_4px_15px_-4px_rgba(17,24,39,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    {/* Thumbnail image */}
                    <Link to={`/products/${product._id}`} className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-[12px] p-2 flex items-center justify-center flex-shrink-0">
                      <img src={getImageUrl(product.images?.[0])} alt="" className="max-h-full object-contain" />
                    </Link>

                    {/* Title & info details */}
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${product._id}`}>
                        <h4 className="text-xs font-black text-slate-800 truncate uppercase hover:text-brand-primary transition-colors">
                          {product.name}
                        </h4>
                      </Link>
                      {variantStr && <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{variantStr}</p>}
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">Réf: {product.sku}</p>
                    </div>
                  </div>

                  {/* Quantity and Price controls */}
                  <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-full border border-slate-100">
                      <button
                        onClick={() => handleQtyChange(product._id, item.quantity - 1, item.variant, product.stock)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-brand-primary active:scale-90 shadow-sm"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(product._id, item.quantity + 1, item.variant, product.stock)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-brand-primary active:scale-90 shadow-sm"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="text-right w-28">
                      <span className="text-sm font-black text-slate-900 block">{(activePrice * item.quantity).toLocaleString()} DA</span>
                      {isB2BPrice && (
                        <span className="text-[9px] text-slate-400 line-through mr-1 font-semibold">
                          {((product.discountPrice || product.price) * item.quantity).toLocaleString()} DA
                        </span>
                      )}
                      <p className="text-[9px] text-slate-400 font-semibold">{activePrice.toLocaleString()} DA l'unité</p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(product._id, item.variant)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Totals Summary Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-[0_4px_25px_-5px_rgba(17,24,39,0.02)] space-y-6">
              <h3 className="font-black text-slate-800 text-xs tracking-wider uppercase border-b border-slate-50 pb-4 flex justify-between items-center">
                <span>Récapitulatif</span>
                {user && user.clientType !== 'retail' && (
                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Tarif {user.clientType === 'demi-gros' ? 'demi-gros' : 'super-gros'} actif
                  </span>
                )}
              </h3>

              {/* Math breakdown */}
              <div className="space-y-2.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-800">{subtotal.toLocaleString()} DA</span>
                </div>



                <div className="flex justify-between">
                  <span>Frais de livraison</span>
                  <span className="font-bold text-slate-800">
                    {shipping === 0 ? 'GRATUIT' : `${shipping.toLocaleString()} DA`}
                  </span>
                </div>
              </div>

              {/* Total price */}
              <div className="border-t border-slate-50 pt-4 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Total</span>
                <span className="text-xl font-black text-slate-900">{total.toLocaleString()} DA</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceed}
                className="w-full gold-bg-gradient text-brand-secondary font-black text-xs uppercase tracking-wider py-4 rounded-[16px] shadow-sm hover:scale-102 active:scale-98 transition-transform duration-300 flex items-center justify-center space-x-2"
              >
                <span>Passer la commande</span>
                <ArrowRight size={14} />
              </button>
                 </div>
          </div>
        </div>
      )}
    </div>
  );
}
