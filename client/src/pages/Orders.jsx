import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, ChevronRight, FileText, ArrowDown, Package, Clock, Truck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, getImageUrl } from '../services/api';

export default function Orders() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Guest Tracking State
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders();
      if (res.success) {
        setOrders(res.orders);
        if (res.orders.length > 0) {
          setSelectedOrder(res.orders[0]); // default to first order
        }
      }
    } catch (err) {
      toast.error('Échec du chargement de l\'historique des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (orderId) => {
    const phoneParam = !isAuthenticated && selectedOrder?.guestInfo?.phone ? selectedOrder.guestInfo.phone : '';
    window.open(orderService.getInvoiceUrl(orderId, phoneParam), '_blank');
  };

  // Status mapping for Stepper
  const statusSteps = [
    { key: 'pending', label: 'Reçue', icon: <Clock size={16} /> },
    { key: 'processing', label: 'En préparation', icon: <Package size={16} /> },
    { key: 'shipped', label: 'Expédiée', icon: <Truck size={16} /> },
    { key: 'delivered', label: 'Livrée', icon: <Package size={16} /> }
  ];

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    return statusSteps.findIndex(step => step.key === status);
  };

  const handleTrackGuestOrder = async (e) => {
    e.preventDefault();
    if (!trackOrderId || !trackPhone) {
      toast.error('Veuillez saisir l\'identifiant de la commande et le numéro de téléphone');
      return;
    }
    setTrackLoading(true);
    try {
      const res = await orderService.getOrderById(trackOrderId.trim(), { phone: trackPhone.trim() });
      if (res.success) {
        setSelectedOrder(res.order);
        toast.success('Commande trouvée !');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de localiser la commande. Vérifiez les détails.');
    } finally {
      setTrackLoading(false);
    }
  };

  if (!isAuthenticated && !selectedOrder) {
    return (
      <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24">
        <div className="flex flex-col space-y-2 mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Suivi de commande</span>
          <h1 className="text-3xl font-black text-slate-800">SUIVRE VOTRE COMMANDE</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          {/* Track Guest Order Form */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-800 tracking-wide uppercase">Suivi invité</h2>
            <form onSubmit={handleTrackGuestOrder} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identifiant de commande</label>
                <input
                  type="text"
                  placeholder="ex. 660f... (24 caractères)"
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Numéro de téléphone</label>
                <input
                  type="text"
                  placeholder="ex. 0555 12 34 56"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                />
              </div>
              <button
                type="submit"
                disabled={trackLoading}
                className="w-full bg-brand-primary text-slate-950 hover:bg-amber-500 hover:text-white transition-all font-black text-xs uppercase tracking-wider py-4 rounded-[16px] flex items-center justify-center space-x-2"
              >
                {trackLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Suivre la commande</span>
                )}
              </button>
            </form>
          </div>

          {/* Account Login prompt */}
          <div className="bg-gradient-to-br from-brand-secondary to-amber-50 border border-brand-border rounded-[32px] p-8 shadow-sm flex flex-col justify-between text-slate-800">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-brand-primary">
                <ShoppingBag size={24} />
              </div>
              <h2 className="text-xl font-black tracking-wide uppercase">Connectez-vous à votre compte</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connectez-vous à Nounou Telecom pour consulter l'historique complet de vos commandes et suivre vos expéditions en temps réel.
              </p>
            </div>
            <div className="pt-8">
              <a
                href="/login"
                className="w-full bg-brand-primary text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[16px] flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all"
              >
                Se connecter au compte
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && selectedOrder) {
    return (
      <div className="pt-28 max-w-3xl mx-auto px-6 min-h-screen bg-brand-bg pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-xs text-brand-primary font-bold flex items-center space-x-1 hover:underline"
          >
            <span>&larr; Retour au suivi invité</span>
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Détails de la commande invité</span>
        </div>
        
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-semibold">Identifiant de commande</span>
              <span className="text-lg font-black text-slate-800">
                #{selectedOrder._id.toString().substring(12).toUpperCase()}
              </span>
            </div>
          </div>

          {selectedOrder.deliveryStatus === 'cancelled' ? (
            <div className="bg-red-50 border border-red-200 rounded-[20px] p-5 flex items-center space-x-3 text-red-700">
              <ShieldAlert />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase">Commande Annulée</span>
                <span className="text-[10px] text-red-500">Cette commande a été annulée.</span>
              </div>
            </div>
          ) : (
            <div className="py-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">État de la livraison</h4>
              <div className="flex items-center justify-between relative max-w-xl mx-auto">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 z-0">
                  <div
                    className="h-full bg-brand-primary transition-all duration-500"
                    style={{
                      width: `${(getStepIndex(selectedOrder.deliveryStatus) / (statusSteps.length - 1)) * 100}%`
                    }}
                  />
                </div>

                {statusSteps.map((step, idx) => {
                  const stepIdx = getStepIndex(selectedOrder.deliveryStatus);
                  const isCompleted = stepIdx >= idx;
                  const isCurrent = stepIdx === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10 space-y-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-brand-primary text-white shadow-md scale-105'
                            : 'bg-white text-slate-300 border-2 border-slate-100'
                        } ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}`}
                      >
                        {step.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles Commandés</h4>
            <div className="space-y-3">
              {selectedOrder.orderItems.map((item, idx) => {
                const variantStr = item.variant
                  ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : '';

                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-[20px] border border-slate-100 gap-3 text-left">
                    <div className="flex items-center space-x-3">
                      <img src={getImageUrl(item.image)} alt="" className="w-12 h-12 object-contain bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 leading-tight">{item.name}</span>
                        {variantStr && <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wide mt-1">{variantStr}</span>}
                        <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Quantité : {item.quantity}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block sm:hidden">Montant</span>
                      <span className="text-sm font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} DA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="flex flex-col space-y-1">
              <span className="font-bold text-slate-400 uppercase">Destinataire & Livraison</span>
              <div className="text-slate-600 space-y-1 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mt-1">
                <div><span className="font-bold">Nom du client :</span> {selectedOrder.shippingAddress?.name || selectedOrder.guestInfo?.name}</div>
                <div><span className="font-bold">Téléphone :</span> {selectedOrder.shippingAddress?.phone || selectedOrder.guestInfo?.phone}</div>
                <div><span className="font-bold">Wilaya :</span> {selectedOrder.guestInfo?.wilaya || selectedOrder.shippingAddress?.state}</div>
                <div><span className="font-bold">Type de livraison :</span> <span className="font-extrabold text-brand-primary uppercase">{selectedOrder.deliveryType || 'À Domicile'}</span></div>
                <div><span className="font-bold">Affectation :</span> {selectedOrder.guestInfo?.affectation}</div>
                <div><span className="font-bold">Adresse :</span> {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
              </div>
            </div>
            <div className="flex flex-col space-y-1 text-right justify-end">
              <div className="flex justify-end space-x-8 text-slate-500">
                <span>Sous-total :</span>
                <span className="font-bold text-slate-800">{selectedOrder.itemsPrice.toLocaleString()} DA</span>
              </div>
              {selectedOrder.discountPrice > 0 && (
                <div className="flex justify-end space-x-8 text-green-600 font-semibold">
                  <span>Code de réduction :</span>
                  <span>-{selectedOrder.discountPrice.toLocaleString()} DA</span>
                </div>
              )}
              <div className="flex justify-end space-x-8 text-slate-500">
                <span>Livraison :</span>
                <span className="font-bold text-slate-800">{selectedOrder.shippingPrice.toLocaleString()} DA</span>
              </div>
        <div className="flex justify-end space-x-8 text-slate-800 font-black text-sm pt-2 border-t border-slate-50">
                <span>Total Général :</span>
                <span>{selectedOrder.totalPrice.toLocaleString()} DA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24">
      {/* Title */}
      <div className="flex flex-col space-y-2 mb-10">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Suivi de commande</span>
        <h1 className="text-3xl font-black text-slate-800">VOS COMMANDES</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <ShoppingBag size={48} className="text-slate-300" />
          <h3 className="font-bold text-slate-800 text-lg">Aucune commande passée</h3>
          <p className="text-xs text-slate-500">Vous n'avez pas encore effectué d'achats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Orders List */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="font-black text-slate-500 text-xs tracking-wider uppercase pl-2">Historique</h3>
            <div className="space-y-3">
              {orders.map((order) => {
                const isSelected = selectedOrder?._id === order._id;
                return (
                  <div
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-[20px] border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-primary bg-white shadow-md'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col space-y-1.5 min-w-0 pr-2">
                      <span className="text-xs font-black text-slate-800">
                        #{order._id.toString().substring(18).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit ${
                        order.deliveryStatus === 'delivered'
                          ? 'bg-green-50 text-green-600'
                          : order.deliveryStatus === 'cancelled'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {order.deliveryStatus === 'pending' ? 'Reçue' :
                         order.deliveryStatus === 'processing' ? 'En préparation' :
                         order.deliveryStatus === 'shipped' ? 'Expédiée' :
                         order.deliveryStatus === 'delivered' ? 'Livrée' :
                         order.deliveryStatus === 'cancelled' ? 'Annulée' : order.deliveryStatus}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-sm font-black text-slate-900">{order.totalPrice.toLocaleString()} DA</span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Selected Order Tracking Stepper & details */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-6 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-semibold">Identifiant de commande</span>
                  <span className="text-lg font-black text-slate-800">
                    #{selectedOrder._id.toString().substring(12).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Package tracking visual stepper */}
              {selectedOrder.deliveryStatus === 'cancelled' ? (
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-5 flex items-center space-x-3 text-red-700">
                  <ShieldAlert />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">Commande Annulée</span>
                    <span className="text-[10px] text-red-500">Cette commande a été annulée.</span>
                  </div>
                </div>
              ) : (
                <div className="py-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">État de la livraison</h4>
                  <div className="flex items-center justify-between relative max-w-xl mx-auto">
                    {/* Stepper connector line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 z-0">
                      <div
                        className="h-full bg-brand-primary transition-all duration-500"
                        style={{
                          width: `${(getStepIndex(selectedOrder.deliveryStatus) / (statusSteps.length - 1)) * 100}%`
                        }}
                      />
                    </div>

                    {statusSteps.map((step, idx) => {
                      const stepIdx = getStepIndex(selectedOrder.deliveryStatus);
                      const isCompleted = stepIdx >= idx;
                      const isCurrent = stepIdx === idx;

                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10 space-y-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-brand-primary text-white shadow-md scale-105'
                                : 'bg-white text-slate-300 border-2 border-slate-100'
                            } ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}`}
                          >
                            {step.icon}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items listing */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles Commandés</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item, idx) => {
                    const variantStr = item.variant
                      ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')
                      : '';

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-[20px] border border-slate-100 gap-3 text-left">
                        <div className="flex items-center space-x-3">
                          <img src={getImageUrl(item.image)} alt="" className="w-12 h-12 object-contain bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 leading-tight">{item.name}</span>
                            {variantStr && <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wide mt-1">{variantStr}</span>}
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Quantité : {item.quantity}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block sm:hidden">Montant</span>
                          <span className="text-sm font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} DA</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Calculations details */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <span className="font-bold text-slate-400 uppercase">Destinataire & Livraison</span>
                  <div className="text-slate-600 space-y-1 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mt-1">
                    <div><span className="font-bold">Nom du client :</span> {selectedOrder.shippingAddress?.name}</div>
                    <div><span className="font-bold">Téléphone :</span> {selectedOrder.shippingAddress?.phone}</div>
                    <div><span className="font-bold">Wilaya :</span> {selectedOrder.shippingAddress?.city || selectedOrder.shippingAddress?.state}</div>
                    <div><span className="font-bold">Type de livraison :</span> <span className="font-extrabold text-brand-primary uppercase">{selectedOrder.deliveryType || 'À Domicile'}</span></div>
                    <div><span className="font-bold">Adresse :</span> {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1 text-right">
                  <div className="flex justify-end space-x-8 text-slate-500">
                    <span>Sous-total :</span>
                    <span className="font-bold text-slate-800">{selectedOrder.itemsPrice.toLocaleString()} DA</span>
                  </div>
                  {selectedOrder.discountPrice > 0 && (
                    <div className="flex justify-end space-x-8 text-green-600 font-semibold">
                      <span>Code de réduction :</span>
                      <span>-{selectedOrder.discountPrice.toLocaleString()} DA</span>
                    </div>
                  )}
                  <div className="flex justify-end space-x-8 text-slate-500">
                    <span>Livraison :</span>
                    <span className="font-bold text-slate-800">{selectedOrder.shippingPrice.toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-end space-x-8 text-slate-800 font-black text-sm pt-2 border-t border-slate-50">
                    <span>Total Général :</span>
                    <span>{selectedOrder.totalPrice.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
