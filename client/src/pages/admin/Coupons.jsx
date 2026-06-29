import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '../../services/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    fetchCouponsList();
  }, []);

  const fetchCouponsList = async () => {
    setLoading(true);
    try {
      const res = await couponService.getCoupons();
      if (res.success) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      toast.error('Échec du chargement de la liste des coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce code promo définitivement ?')) return;
    try {
      const res = await couponService.deleteCoupon(id);
      if (res.success) {
        toast.success('Code promo supprimé');
        fetchCouponsList();
      }
    } catch (error) {
      toast.error('Échec de la suppression du code promo');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) {
      toast.error('Le code, la valeur de réduction et la date d\'expiration sont requis');
      return;
    }

    try {
      const res = await couponService.createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minPurchaseAmount: Number(minPurchaseAmount || 0),
        expiryDate,
        usageLimit: usageLimit ? Number(usageLimit) : null
      });

      if (res.success) {
        toast.success('Code promo créé avec succès !');
        setIsModalOpen(false);
        // Clear fields
        setCode('');
        setDiscountValue('');
        setMinPurchaseAmount('');
        setExpiryDate('');
        setUsageLimit('');
        fetchCouponsList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Échec de la création du code promo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">Codes Promo</h1>
          <p className="text-xs text-slate-500">Gérez les codes promotionnels et les configurations de réduction.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-[16px] flex items-center space-x-2 hover:bg-amber-500 transition-colors"
        >
          <Plus size={16} />
          <span>Nouveau Code</span>
        </button>
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
                  <th className="py-4 px-6">Code Promo</th>
                  <th className="py-4 px-6">Type de Réduction</th>
                  <th className="py-4 px-6">Valeur</th>
                  <th className="py-4 px-6">Minimum d'Achat</th>
                  <th className="py-4 px-6">Expiration</th>
                  <th className="py-4 px-6">Utilisations</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-850">{c.code}</td>
                    <td className="py-4 px-6 font-semibold uppercase">
                      {c.discountType === 'percentage' ? 'Pourcentage' : 'Fixe'}
                    </td>
                    <td className="py-4 px-6 font-black text-slate-900">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()} DA`}
                    </td>
                    <td className="py-4 px-6 font-bold">{c.minPurchaseAmount.toLocaleString()} DA</td>
                    <td className="py-4 px-6 font-semibold text-slate-500">
                      {new Date(c.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {c.usageCount} {c.usageLimit !== null ? `/ ${c.usageLimit}` : 'utilisations'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button onClick={() => handleDelete(c._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 p-1 rounded-full bg-slate-150 hover:bg-slate-200">
              <X size={20} />
            </button>

            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">
              Créer une Campagne Promotionnelle
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Code Promo</label>
                <input
                  type="text"
                  required
                  placeholder="ex. AUTOMNE15"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type de Réduction</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant Fixe (DA)</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valeur de la Réduction</label>
                  <input
                    type="number"
                    required
                    placeholder="ex. 10"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Minimum d'Achat (DA)</label>
                  <input
                    type="number"
                    placeholder="ex. 50"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Limite d'Utilisation</label>
                  <input
                    type="number"
                    placeholder="ex. 100 (optionnel)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date d'Expiration</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[12px] px-4 py-3 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-secondary text-brand-primary font-black text-xs uppercase tracking-wider py-4.5 rounded-[16px] mt-4"
              >
                Créer le Code Promo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
