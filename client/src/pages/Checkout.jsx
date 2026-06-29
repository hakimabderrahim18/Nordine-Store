import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShoppingBag, Phone, MapPin, User, Tag, ArrowRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCart, clearUserCart, clearGuestCart } from '../store/cartSlice';
import { orderService, couponService, yalidineService, getImageUrl } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { items } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Form states
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [deliveryType, setDeliveryType] = useState('À Domicile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Yalidine States
  const [wilayasList, setWilayasList] = useState([]);
  const [communesList, setCommunesList] = useState([]);
  const [selectedWilayaId, setSelectedWilayaId] = useState('');
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [feesData, setFeesData] = useState(null);
  const [loadingWilayas, setLoadingWilayas] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Sync user cart on mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Load Yalidine Wilayas list
  useEffect(() => {
    const fetchWilayas = async () => {
      setLoadingWilayas(true);
      try {
        const res = await yalidineService.getWilayas();
        if (res.success && res.data) {
          const sorted = [...res.data].sort((a, b) => Number(a.id) - Number(b.id));
          setWilayasList(sorted);
        }
      } catch (err) {
        console.error('Error loading wilayas:', err);
      } finally {
        setLoadingWilayas(false);
      }
    };
    fetchWilayas();
  }, []);

  // Pre-fill fields for authenticated users if they have a saved address
  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      if (defaultAddr) {
        if (defaultAddr.phone) setPhone(defaultAddr.phone);
        if (defaultAddr.city) setWilaya(defaultAddr.city);
      }
    }
  }, [isAuthenticated, user]);

  // Auto-select wilaya ID when pre-filled wilaya name matches Yalidine list
  useEffect(() => {
    if (wilayasList.length > 0 && wilaya && !selectedWilayaId) {
      const normalizedPrefill = wilaya.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const match = wilayasList.find(w => w.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === normalizedPrefill);
      if (match) {
        setSelectedWilayaId(match.id.toString());
      }
    }
  }, [wilayasList, wilaya]);

  // Load communes and shipping fees when wilaya changes
  useEffect(() => {
    if (!selectedWilayaId) {
      setCommunesList([]);
      setFeesData(null);
      setSelectedCommuneId('');
      setSelectedCommune(null);
      return;
    }

    const fetchCommunesAndFees = async () => {
      setLoadingCommunes(true);
      try {
        // Fetch communes for destination
        const commRes = await yalidineService.getCommunes(selectedWilayaId);
        if (commRes.success && commRes.data) {
          setCommunesList(commRes.data);
        }

        // Fetch shipping fees for destination
        const feesRes = await yalidineService.getFees(selectedWilayaId);
        if (feesRes.success && feesRes.data) {
          setFeesData(feesRes.data);
        }
      } catch (err) {
        console.error('Error loading communes/fees:', err);
      } finally {
        setLoadingCommunes(false);
      }
    };

    fetchCommunesAndFees();
  }, [selectedWilayaId]);

  const getProductPrice = (product) => {
    if (!product) return 0;
    let price = product.discountPrice || product.price || 0;
    if (user) {
      if (user.clientType === 'demi-gros' && product.demiGrosPrice) {
        price = product.demiGrosPrice;
      } else if (user.clientType === 'super-gros' && product.superGrosPrice) {
        price = product.superGrosPrice;
      }
    }
    return price;
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    return acc + getProductPrice(item.product) * item.quantity;
  }, 0);

  // Calculate dynamic shipping cost using Yalidine parameters
  const getShippingPrice = () => {
    if (deliveryType === 'Retrait au Magasin') return 0;
    if (!selectedWilayaId) return 800; // default initial
    if (subtotal > 15000) return 0; // Free shipping over 15000 DA
    
    if (selectedCommuneId && feesData?.data?.per_commune) {
      const communeFee = feesData.data.per_commune[selectedCommuneId];
      if (communeFee) {
        if (deliveryType === 'StopDesk') {
          return communeFee.express_desk || 550;
        } else {
          return communeFee.express_home || 800;
        }
      }
    }
    
    // Fallback if fees are not yet loaded or commune is not selected
    return deliveryType === 'StopDesk' ? 550 : 800;
  };

  const shippingPrice = getShippingPrice();
  const totalPrice = subtotal + shippingPrice;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (deliveryType !== 'Retrait au Magasin') {
      if (!phone.trim() || !wilaya.trim() || !selectedCommuneId) {
        toast.error('Veuillez sélectionner votre Wilaya et votre Commune de destination.');
        return;
      }
    } else {
      if (!phone.trim()) {
        toast.error('Veuillez saisir votre numéro de téléphone.');
        return;
      }
    }

    if (!isAuthenticated) {
      if (!lastName.trim() || !firstName.trim()) {
        toast.error('Veuillez saisir votre Nom et votre Prénom');
        return;
      }
    }

    setIsSubmitting(true);

    const buyerName = isAuthenticated 
      ? (user?.name || '').trim() 
      : `${lastName} ${firstName}`.trim();

    const orderData = {
      orderItems: items.map(item => ({
        product: item.product?._id,
        name: item.product?.name,
        quantity: item.quantity,
        price: getProductPrice(item.product),
        image: item.product?.images?.[0],
        variant: item.variant instanceof Map ? Object.fromEntries(item.variant) : item.variant
      })),
      shippingAddress: {
        street: deliveryType === 'Retrait au Magasin' ? 'Retrait au Magasin (Boutique)' : `${selectedCommune?.name || ''} - ${deliveryType}`,
        city: deliveryType === 'Retrait au Magasin' ? 'Tiaret' : wilaya,
        state: deliveryType === 'Retrait au Magasin' ? 'Tiaret' : wilaya,
        postalCode: '00000',
        country: 'Algeria',
        phone: phone,
        name: buyerName
      },
      paymentMethod: 'COD',
      deliveryType,
      shippingPrice: getShippingPrice()
    };

    if (!isAuthenticated) {
      orderData.guestInfo = {
        name: buyerName,
        phone: phone,
        wilaya: deliveryType === 'Retrait au Magasin' ? 'Retrait Magasin' : `${wilaya} (${selectedCommune?.name || ''})`
      };
    }

    try {
      const res = await orderService.createOrder(orderData);
      if (res.success) {
        toast.success('Votre commande a été passée avec succès !');
        if (isAuthenticated) {
          dispatch(clearUserCart());
          navigate('/orders');
        } else {
          dispatch(clearGuestCart());
          localStorage.setItem('last_guest_order_id', res.order?._id || '');
          localStorage.setItem('last_guest_order_phone', phone);
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 min-h-screen text-center flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="text-slate-400" size={24} />
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Votre panier est vide</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">Ajoutez des articles à votre panier pour finaliser votre commande.</p>
        <Link to="/shop" className="mt-6 bg-brand-secondary text-brand-primary font-black text-xs uppercase tracking-wider px-6 py-3 rounded-[12px] hover:scale-102 transition-transform">
          Découvrir nos produits
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 max-w-7xl mx-auto px-4 md:px-6 min-h-screen bg-brand-bg pb-24 text-left">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Finaliser la Commande</h1>
        <p className="text-xs text-slate-500 mt-1">Remplissez vos informations pour valider votre achat. Paiement Cash à la Livraison.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-slate-100 rounded-[24px] p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(17,24,39,0.02)] space-y-6"
          >
            <h2 className="text-base font-black text-slate-800 tracking-wide uppercase flex items-center gap-2 pb-4 border-b border-slate-100">
              <User size={18} className="text-brand-primary" />
              Informations de l'Acheteur
            </h2>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {!isAuthenticated && (
                  <>
                    {/* Nom */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Nom
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Nom de famille"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] pl-10 pr-4 py-3.5 focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Prénom */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Prénom
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Prénom"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] pl-10 pr-4 py-3.5 focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Téléphone */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Numéro de Téléphone
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 0555 12 34 56"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] pl-10 pr-4 py-3.5 focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>

                {deliveryType !== 'Retrait au Magasin' && (
                  <>
                    {/* Wilaya */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Wilaya (Destination)
                      </label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select
                          required
                          value={selectedWilayaId}
                          onChange={(e) => {
                            const wId = e.target.value;
                            setSelectedWilayaId(wId);
                            const match = wilayasList.find(w => w.id.toString() === wId);
                            setWilaya(match ? match.name : '');
                            setSelectedCommuneId('');
                            setSelectedCommune(null);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] pl-10 pr-8 py-3.5 focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-semibold appearance-none"
                        >
                          <option value="">Sélectionner une wilaya</option>
                          {wilayasList.map(w => (
                            <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Commune */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Commune (Destination)
                      </label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select
                          required
                          disabled={!selectedWilayaId || loadingCommunes}
                          value={selectedCommuneId}
                          onChange={(e) => {
                            const cId = e.target.value;
                            setSelectedCommuneId(cId);
                            const match = communesList.find(c => c.id.toString() === cId);
                            setSelectedCommune(match || null);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] pl-10 pr-8 py-3.5 focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-semibold appearance-none disabled:opacity-50"
                        >
                          <option value="">
                            {!selectedWilayaId 
                              ? "Veuillez d'abord choisir une wilaya" 
                              : loadingCommunes 
                              ? 'Chargement des communes...' 
                              : 'Sélectionner une commune'}
                          </option>
                          {communesList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Type de livraison selector */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Type de Livraison *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      onClick={() => setDeliveryType('À Domicile')}
                      className={`p-4 rounded-[16px] border-2 cursor-pointer flex flex-col justify-center items-center text-center transition-all ${
                        deliveryType === 'À Domicile'
                          ? 'border-brand-primary bg-amber-500/5 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-800">À Domicile</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Livraison à votre adresse</span>
                    </div>

                    <div
                      onClick={() => setDeliveryType('StopDesk')}
                      className={`p-4 rounded-[16px] border-2 cursor-pointer flex flex-col justify-center items-center text-center transition-all ${
                        deliveryType === 'StopDesk'
                          ? 'border-brand-primary bg-amber-500/5 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-800">StopDesk</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Récupérer au bureau</span>
                    </div>

                    <div
                      onClick={() => setDeliveryType('Retrait au Magasin')}
                      className={`p-4 rounded-[16px] border-2 cursor-pointer flex flex-col justify-center items-center text-center transition-all ${
                        deliveryType === 'Retrait au Magasin'
                          ? 'border-brand-primary bg-amber-500/5 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-800">Retrait au Magasin</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Gratuit - Récupérer à la boutique</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode de paiement info banner */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-4.5 text-xs text-amber-800 space-y-1">
                <span className="font-black uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1.5">
                  Mode de Paiement : Paiement à la Livraison (COD)
                </span>
                <p className="font-semibold leading-relaxed">
                  Le paiement s'effectue en espèces lors de la réception de votre commande à domicile ou au point relais.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-brand-secondary text-brand-primary font-black text-xs uppercase tracking-wider px-8 py-4 rounded-[14px] shadow-sm hover:scale-102 active:scale-98 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      Confirmer la Commande
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Order Summary Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-[0_4px_25px_-5px_rgba(17,24,39,0.02)] space-y-4">
            <h3 className="font-black text-slate-800 text-xs tracking-wider uppercase border-b border-slate-50 pb-3 flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand-primary" />
              Résumé de la Commande
            </h3>

            {/* Cart Items list */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const activePrice = getProductPrice(item.product);
                return (
                  <div key={idx} className="flex justify-between items-start gap-4 text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.product?.images?.[0] ? (
                        <img src={getImageUrl(item.product.images[0])} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 block truncate uppercase tracking-wide">{item.product?.name}</span>
                      <div className="flex flex-wrap gap-x-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        <span>Qté: {item.quantity}</span>
                        {item.variant && Object.entries(item.variant).map(([key, val]) => (
                          <span key={key} className="text-brand-primary font-extrabold">{key}: {val}</span>
                        ))}
                      </div>
                    </div>
                    <span className="font-black text-slate-900 flex-shrink-0">{(activePrice * item.quantity).toLocaleString()} DA</span>
                  </div>
                );
              })}
            </div>

            {/* Math Totals */}
            <div className="border-t border-slate-50 pt-4 space-y-2.5 text-xs text-slate-500 font-semibold">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-bold text-slate-800">{subtotal.toLocaleString()} DA</span>
              </div>

              <div className="flex justify-between">
                <span>Frais de Livraison</span>
                <span className="font-bold text-slate-800">
                  {shippingPrice === 0 ? 'GRATUIT' : `${shippingPrice.toLocaleString()} DA`}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-black text-slate-855 uppercase tracking-wide">Total</span>
              <span className="text-lg font-black text-slate-900">{totalPrice.toLocaleString()} DA</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
