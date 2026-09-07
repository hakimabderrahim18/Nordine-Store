import React, { useEffect, useState } from 'react';
import { FileText, Eye, Check, Trash2, Phone, MapPin, ShieldAlert, ShoppingBag, Truck, User, Tag, ExternalLink, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, getImageUrl } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';

export default function Orders() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for order viewing/editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Status edits state
  const [status, setStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Date, client and product filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Calculate filtered orders list
  const filteredOrders = orders.filter(order => {
    // 1. Date filters
    if (order.createdAt) {
      const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0);
      
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
    }

    // 2. Client search filter
    if (clientSearch.trim()) {
      const search = clientSearch.toLowerCase();
      const customerName = (order.isGuest ? order.guestInfo?.name : order.user?.name) || '';
      const customerPhone = (order.isGuest ? order.guestInfo?.phone : order.shippingAddress?.phone) || '';
      const customerEmail = order.user?.email || '';
      const orderId = order._id.toString();

      const matchesName = customerName.toLowerCase().includes(search);
      const matchesPhone = customerPhone.toLowerCase().includes(search);
      const matchesEmail = customerEmail.toLowerCase().includes(search);
      const matchesOrderId = orderId.toLowerCase().includes(search);

      if (!matchesName && !matchesPhone && !matchesEmail && !matchesOrderId) {
        return false;
      }
    }

    // 3. Product search filter
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase();
      const hasMatchingProduct = order.orderItems.some(item => {
        const itemName = item.name || '';
        const itemSku = item.product?.sku || '';
        return itemName.toLowerCase().includes(search) || itemSku.toLowerCase().includes(search);
      });
      
      if (!hasMatchingProduct) return false;
    }
    
    return true;
  });

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const fetchOrdersList = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      toast.error('Échec du chargement du journal des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (order) => {
    try {
      const res = await orderService.getOrderById(order._id);
      if (res.success) {
        setSelectedOrder(res.order);
        setStatus(res.order.deliveryStatus);
        setTrackingNumber(res.order.trackingNumber || '');
        setIsModalOpen(true);
      }
    } catch (err) {
      toast.error('Échec du chargement des détails de la commande');
    }
  };

  const handleItemPriceChange = async (itemId, newPrice) => {
    const updatedItems = selectedOrder.orderItems.map(item => 
      item._id === itemId ? { ...item, price: newPrice } : item
    );
    
    const newItemsPrice = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const newTotalPrice = newItemsPrice + selectedOrder.shippingPrice - selectedOrder.discountPrice;
    
    setSelectedOrder({
      ...selectedOrder,
      orderItems: updatedItems,
      itemsPrice: newItemsPrice,
      totalPrice: newTotalPrice
    });

    try {
      const res = await orderService.updateOrderPrices(selectedOrder._id, 
        updatedItems.map(item => ({ itemId: item._id, price: item.price }))
      );
      if (res.success) {
        toast.success('Prix de la commande mis à jour avec succès');
        fetchOrdersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la mise à jour du prix');
    }
  };

  const handleDownloadInvoice = (orderId) => {
    const order = orders.find(o => o._id === orderId);
    const phoneParam = order?.isGuest && order?.guestInfo?.phone ? order.guestInfo.phone : '';
    window.open(orderService.getInvoiceUrl(orderId, phoneParam), '_blank');
  };

  const handleValidateOrder = async (orderId) => {
    try {
      const res = await orderService.deliverOrder(orderId, { status: 'processing' });
      if (res.success) {
        toast.success('Commande validée avec succès !');
        fetchOrdersList();
        // If currently viewing, update details in real time
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, deliveryStatus: 'processing' });
          setStatus('processing');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la validation de la commande');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette commande ?')) return;
    try {
      const res = await orderService.deleteOrder(orderId);
      if (res.success) {
        toast.success('Commande supprimée avec succès');
        setIsModalOpen(false);
        fetchOrdersList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la suppression de la commande');
    }
  };

  const handleExcelExport = async () => {
    const toastId = toast.loading('Génération du fichier Excel en cours...');
    try {
      await orderService.exportOrders();
      toast.success('Exportation des commandes réussie !', { id: toastId });
    } catch (err) {
      toast.error('Échec de l\'exportation des commandes', { id: toastId });
    }
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await orderService.deliverOrder(selectedOrder._id, { 
        status, 
        trackingNumber
      });
      if (res.success) {
        toast.success('Détails de la commande mis à jour avec succès');
        setIsModalOpen(false);
        fetchOrdersList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la mise à jour des détails de la commande');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">
            {t('admin_orders_title')}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? 'متابعة شحنات الطلبات، فواتير الشراء، ومراجعة حالة التسليم.' : 'Suivez les factures entrantes, les colis des transporteurs et gérez les expéditions.'}
          </p>
        </div>
        <button
          onClick={handleExcelExport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-md hover:scale-103 active:scale-97 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Upload size={15} className="rotate-180" />
          <span>{isAr ? 'تصدير الطلبات (Excel)' : 'Exporter Commandes (Excel)'}</span>
        </button>
      </div>

      {/* Date, Client & Product Filter Panel */}
      <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-wrap items-end gap-4 text-start">
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {isAr ? 'البحث عن زبون / رقم الطلب' : 'Rechercher Client / N° Commande'}
          </label>
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder={isAr ? 'الاسم، رقم الهاتف، المعرف...' : 'Nom, Téléphone, ID...'}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {isAr ? 'البحث عن منتج / SKU' : 'Rechercher Produit / SKU'}
          </label>
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder={isAr ? 'اسم المنتج، رمز SKU...' : 'Désignation, Référence SKU...'}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[120px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {isAr ? 'تاريخ البداية' : 'Date de Début'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[120px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {isAr ? 'تاريخ النهاية' : 'Date de Fin'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        {(startDate || endDate || clientSearch || productSearch) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setClientSearch('');
              setProductSearch('');
            }}
            className="bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-wider px-5 py-3.5 rounded-[12px] hover:bg-red-100 transition-colors"
          >
            {isAr ? 'إعادة ضبط' : 'Réinitialiser'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-500 text-xs">
              <thead className="bg-gray-50 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID / Date</th>
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Téléphone & Wilaya</th>
                  <th className="py-4 px-6">Total</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const customerName = o.isGuest ? o.guestInfo?.name : o.user?.name;
                  const customerPhone = o.isGuest ? o.guestInfo?.phone : o.shippingAddress?.phone;
                  const customerWilaya = o.isGuest ? o.guestInfo?.wilaya : o.shippingAddress?.city;

                  return (
                    <tr key={o._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span>#{o._id.toString().substring(18).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{new Date(o.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-850">{customerName || 'Visiteur'}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            {o.isGuest ? 'Commande Invité' : 'Client Enregistré'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex flex-col">
                          <span>{customerPhone || 'N/A'}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{customerWilaya || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-955">{(o.totalPrice - (o.shippingPrice || 0)).toLocaleString()} DA</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                          o.deliveryStatus === 'delivered'
                            ? 'bg-green-50 text-green-600'
                            : o.deliveryStatus === 'cancelled'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {o.deliveryStatus === 'pending' ? 'Reçue' :
                           o.deliveryStatus === 'processing' ? 'En préparation' :
                           o.deliveryStatus === 'shipped' ? 'Expédiée' :
                           o.deliveryStatus === 'delivered' ? 'Livrée' :
                           o.deliveryStatus === 'cancelled' ? 'Annulée' : o.deliveryStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleOpenDetails(o)} 
                            title="Voir les détails"
                            className="p-2 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-100"
                          >
                            <Eye size={14} />
                          </button>
                          {o.deliveryStatus === 'pending' && (
                            <button
                              onClick={() => handleValidateOrder(o._id)}
                              title="Valider la commande"
                              className="p-2 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteOrder(o._id)}
                            title="Supprimer la commande"
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS & DISPATCH STATUS MODAL */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl p-6 md:p-8 relative my-8 text-left border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  Gestion des Commandes
                </span>
                <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                  <span>Commande #{selectedOrder._id.toString().substring(12).toUpperCase()}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                    selectedOrder.deliveryStatus === 'delivered' ? 'bg-green-50 text-green-600' :
                    selectedOrder.deliveryStatus === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedOrder.deliveryStatus === 'pending' ? 'Reçue' :
                     selectedOrder.deliveryStatus === 'processing' ? 'En préparation' :
                     selectedOrder.deliveryStatus === 'shipped' ? 'Expédiée' :
                     selectedOrder.deliveryStatus === 'delivered' ? 'Livrée' :
                     selectedOrder.deliveryStatus === 'cancelled' ? 'Annulée' : selectedOrder.deliveryStatus}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                  className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-[12px] hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Supprimer la commande</span>
                </button>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Details & Items */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Customer Details Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 space-y-4 text-xs">
                  <h3 className="font-black text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <User size={13} className="text-brand-primary" />
                    Détails du client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Nom du client</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedOrder.isGuest ? selectedOrder.guestInfo?.name : selectedOrder.user?.name || selectedOrder.shippingAddress?.name}
                      </span>
                      <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                        {selectedOrder.isGuest ? 'Visiteur Invité' : 'Client Enregistré'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Numéro de téléphone</span>
                      <a 
                        href={`tel:${selectedOrder.isGuest ? selectedOrder.guestInfo?.phone : selectedOrder.shippingAddress?.phone}`} 
                        className="font-bold text-slate-800 hover:text-brand-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone size={11} />
                        {selectedOrder.isGuest ? selectedOrder.guestInfo?.phone : selectedOrder.shippingAddress?.phone || 'N/A'}
                        <ExternalLink size={10} className="opacity-60" />
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Wilaya</span>
                      <span className="font-semibold text-slate-700">
                        {selectedOrder.isGuest ? selectedOrder.guestInfo?.wilaya : selectedOrder.shippingAddress?.city || selectedOrder.shippingAddress?.state || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Type de Livraison</span>
                      <span className="font-bold text-brand-primary uppercase">
                        {selectedOrder.deliveryType || 'À Domicile'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Adresse Complète de Livraison</span>
                      <span className="font-medium text-slate-600 block leading-relaxed mt-0.5">
                        {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode} ({selectedOrder.shippingAddress?.country || 'Algeria'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-500 uppercase tracking-wider text-[10px] pl-1 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-brand-primary" />
                    Articles Commandés
                  </h3>
                  <div className="space-y-2.5">
                    {selectedOrder.orderItems.map((item, idx) => {
                      const variantStr = item.variant
                        ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '';

                      return (
                         <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-[16px] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] text-xs gap-3 text-left">
                           <div className="flex items-start sm:items-center space-x-3">
                             <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                               {item.image ? (
                                 <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <ShoppingBag size={16} className="text-slate-355" />
                               )}
                             </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 uppercase tracking-wide leading-tight">{item.name}</span>
                                {variantStr && <span className="text-[9px] font-bold text-brand-primary uppercase mt-0.5">{variantStr}</span>}
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">
                                    Qté : {item.quantity}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">|</span>
                                  <select
                                    value={item.price}
                                    onChange={(e) => handleItemPriceChange(item._id, Number(e.target.value))}
                                    className="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-brand-primary font-bold cursor-pointer"
                                  >
                                    <option value={item.price}>{item.price.toLocaleString()} DA (Actuel)</option>
                                    {item.product && (
                                      <>
                                        <option value={item.product.priceDetail}>{item.product.priceDetail?.toLocaleString()} DA (Détail)</option>
                                        <option value={item.product.priceDetailReparation}>{item.product.priceDetailReparation?.toLocaleString()} DA (Détail Rép.)</option>
                                        <option value={item.product.priceReparation}>{item.product.priceReparation?.toLocaleString()} DA (Réparation)</option>
                                        <option value={item.product.priceDemiGros}>{item.product.priceDemiGros?.toLocaleString()} DA (Demi Gros)</option>
                                        <option value={item.product.priceSuperGros}>{item.product.priceSuperGros?.toLocaleString()} DA (Super Gros)</option>
                                      </>
                                    )}
                                  </select>
                                </div>
                              </div>
                           </div>
                           <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block sm:hidden">Montant</span>
                             <span className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} DA</span>
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column - Status Management & Totals */}
              <div className="space-y-6">
                
                {/* Management Form */}
                <form onSubmit={handleSubmitStatus} className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 space-y-4 text-xs">
                  <h3 className="font-black text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Truck size={13} className="text-brand-primary" />
                    Expédition & Livraison
                  </h3>

                  {/* Delivery Status */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Statut d'Expédition</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-805 text-xs rounded-[10px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
                    >
                      <option value="pending">Reçue</option>
                      <option value="processing">En préparation</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>

                  {/* Tracking Number */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Numéro de Suivi</label>
                    <input
                      type="text"
                      placeholder="ex. DHL938475298"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-805 text-xs rounded-[10px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-brand-secondary text-brand-primary font-black text-[10px] uppercase tracking-wider py-3.5 rounded-[12px] hover:scale-102 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer le statut'}
                  </button>
                </form>

                {/* Pricing Summary */}
                <div className="bg-white border border-slate-100 rounded-[20px] p-5 space-y-3.5 text-xs shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <h3 className="font-black text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-50 pb-2 flex items-center gap-1.5">
                    <Tag size={13} className="text-brand-primary" />
                    Détails de la Facture
                  </h3>

                  <div className="space-y-2 text-slate-500 font-semibold">
                    <div className="flex justify-between">
                      <span>Sous-total :</span>
                      <span className="font-bold text-slate-800">{selectedOrder.itemsPrice?.toLocaleString()} DA</span>
                    </div>
                    {selectedOrder.discountPrice > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Réduction :</span>
                        <span>-{selectedOrder.discountPrice?.toLocaleString()} DA</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Frais de livraison :</span>
                      <span className="font-bold text-slate-800">{selectedOrder.shippingPrice?.toLocaleString()} DA</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-3 flex justify-between items-baseline font-black text-sm">
                    <span className="text-slate-800 uppercase text-xs">Total :</span>
                    <span className="text-slate-955 text-base">{((selectedOrder.totalPrice || 0) - (selectedOrder.shippingPrice || 0)).toLocaleString()} DA</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
