import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { User, Mail, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, getProfile } from '../store/authSlice';
import { authService, orderService } from '../services/api';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Profile Edit fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Orders History State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setProfileLoading(true);
    try {
      const data = { name, email };
      if (password) data.password = password;

      await dispatch(updateProfile(data)).unwrap();
      toast.success('Profil mis à jour avec succès');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err || 'Échec de la mise à jour du profil');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDownloadInvoice = (orderId) => {
    window.open(orderService.getInvoiceUrl(orderId), '_blank');
  };

  return (
    <div className="pt-28 max-w-7xl mx-auto px-6 min-h-screen bg-brand-bg pb-24">
      {/* Title */}
      <div className="flex flex-col space-y-2 mb-10">
        <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Espace Client</span>
        <h1 className="text-3xl font-black text-slate-800">PROFIL DE L'UTILISATEUR</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile info forms */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6 lg:col-span-1 h-fit">
          <h2 className="text-md font-black text-slate-800 tracking-wide uppercase flex items-center">
            <User size={16} className="mr-2 text-brand-primary" /> Modifier mes informations
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom complet</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none"
                />
                <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adresse Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col space-y-1 border-t border-slate-50 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nouveau mot de passe (Optionnel)</label>
              <input
                type="password"
                placeholder="Laisser vide pour conserver l'ancien"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] px-4 py-3 focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] px-4 py-3 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[16px] hover:scale-102 transition-transform duration-300 shadow-sm"
            >
              {profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Order history */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h2 className="text-md font-black text-slate-800 tracking-wide uppercase flex items-center">
              <ShoppingBag size={16} className="mr-2 text-brand-primary" /> Historique des Commandes
            </h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Vous n'avez pas encore passé de commande.</p>
              <Link
                to="/shop"
                className="inline-block bg-brand-primary hover:bg-brand-primary/90 text-slate-950 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-[12px] shadow-sm transition-transform active:scale-97"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {orders.map((order) => {
                const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);
                const orderRef = order._id.substring(18).toUpperCase();
                const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                // Status colors
                let statusBg = 'bg-slate-100 text-slate-700';
                if (order.deliveryStatus === 'processing') statusBg = 'bg-amber-100 text-amber-700';
                else if (order.deliveryStatus === 'shipped') statusBg = 'bg-indigo-100 text-indigo-700';
                else if (order.deliveryStatus === 'delivered') statusBg = 'bg-green-100 text-green-700';
                else if (order.deliveryStatus === 'cancelled') statusBg = 'bg-red-100 text-red-700';

                return (
                  <div
                    key={order._id}
                    className="p-5 bg-slate-50 border border-slate-100 rounded-[20px] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-800">Commande #{orderRef}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBg}`}>
                          {order.deliveryStatus === 'pending' ? 'Reçue' :
                           order.deliveryStatus === 'processing' ? 'En préparation' :
                           order.deliveryStatus === 'shipped' ? 'Expédiée' :
                           order.deliveryStatus === 'delivered' ? 'Livrée' :
                           order.deliveryStatus === 'cancelled' ? 'Annulée' : order.deliveryStatus}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{orderDate}</span>
                      <span className="text-xs text-slate-500 font-bold mt-1">
                        {totalItems} {totalItems > 1 ? 'articles' : 'article'} &bull; {order.totalPrice.toLocaleString()} DA
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
                      <Link
                        to={`/orders?id=${order._id}`}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase px-4 py-2.5 rounded-[10px] transition-colors"
                      >
                        Suivre
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
