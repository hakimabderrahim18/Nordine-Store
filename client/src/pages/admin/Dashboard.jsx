import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, FileText, ShoppingBag, ShieldAlert, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, productService } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const statsRes = await orderService.getStats({ startDate, endDate });
      const prodRes = await productService.getProducts({ limit: 100 });

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (prodRes.success) {
        const lowStock = prodRes.products.filter(p => p.stock <= 5);
        setLowStockProducts(lowStock);
      }
    } catch (err) {
      toast.error('Échec du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Listen for real-time order updates to refresh dashboard stats automatically
    const handleNewOrder = () => {
      fetchDashboardStats();
    };

    window.addEventListener('newOrderReceived', handleNewOrder);
    
    return () => {
      window.removeEventListener('newOrderReceived', handleNewOrder);
    };
  }, [startDate, endDate]);

  if (loading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Cards list
  const statCards = [
    { label: 'Chiffre d\'Affaires', value: `${(stats?.totalRevenue || 0).toLocaleString()} DA`, icon: <DollarSign size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
    { label: 'Total Commandes', value: stats?.totalOrders || 0, icon: <FileText size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Alerte Stock Bas', value: lowStockProducts.length, icon: <ShieldAlert size={20} className="text-red-600" />, bg: 'bg-red-50' }
  ];

  return (
    <div className="space-y-8">
      {/* Admin header */}
      <div className="flex flex-col space-y-1 text-left">
        <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">Tableau de bord</h1>
        <p className="text-xs text-slate-500">Analyses des performances commerciales et aperçu de la logistique en temps réel.</p>
      </div>

      {/* Date Filter Panel */}
      <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-wrap items-end gap-4 text-left">
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Date de Début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        <div className="flex flex-col space-y-1.5 flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Date de Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-brand-primary font-semibold"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-wider px-5 py-3.5 rounded-[12px] hover:bg-red-100 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-2xl font-black text-slate-800">{card.value}</span>
            </div>
            <div className={`p-3.5 rounded-[18px] ${card.bg}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Sales Charts grid */}
      {stats?.chartData && stats.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Main revenue graph */}
          <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Répartition des Revenus</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC93C" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FFC93C" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} DA`, 'Revenus']} />
                  <Area type="monotone" dataKey="sales" stroke="#FFC93C" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Volume graph */}
          <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Volume des Commandes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => [value, 'Commandes']} />
                  <Bar dataKey="orders" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Critical warnings and actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Low Stock Checklist */}
        <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50 text-red-600">
            <AlertTriangle size={16} />
            <h3 className="text-xs font-black uppercase tracking-wider">Réapprovisionnement de Stock Critique</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Tous les niveaux de stock sont corrects.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {lowStockProducts.map(p => (
                <div key={p._id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-[16px] text-xs">
                  <div className="flex flex-col pr-3">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-[10px] text-slate-500">Réf : {p.sku}</span>
                  </div>
                  <span className="font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Rupture de Stock
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Settings info */}
        <div className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50 text-slate-800">
            <ShoppingBag size={16} className="text-brand-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider">Logistique de la Boutique</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-505 leading-relaxed">
            <p>
              Les livraisons sont expédiées quotidiennement. Les mises à jour de statut déclenchent les indicateurs de suivi des clients.
            </p>
            <div className="p-4 bg-amber-505/5 border border-brand-primary/10 rounded-[20px] text-slate-700 flex flex-col space-y-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">Note aux Administrateurs</span>
              <p className="text-[11px] leading-relaxed">
                Gérez vos produits, commandes et codes promotionnels directement depuis les onglets correspondants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
