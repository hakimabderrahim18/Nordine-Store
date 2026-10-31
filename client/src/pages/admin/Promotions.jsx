import React, { useEffect, useState } from 'react';
import { promotionService, getImageUrl } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Image,
  Link2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Tag,
  Flame,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminPromotions() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('PROMO');
  const [discountText, setDiscountText] = useState('-20%');
  const [link, setLink] = useState('/shop');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await promotionService.getAllPromotions();
      if (res.success) {
        setPromotions(res.promotions || []);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des promotions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFile(null);
    setFilePreview('');
    setTitle('');
    setSubtitle('');
    setBadge('PROMO');
    setDiscountText('-20%');
    setLink('/shop');
    setIsActive(true);
    setOrder(0);
  };

  const handleEditClick = (promo) => {
    setEditingId(promo._id);
    setTitle(promo.title || '');
    setSubtitle(promo.subtitle || '');
    setBadge(promo.badge || 'PROMO');
    setDiscountText(promo.discountText || '');
    setLink(promo.link || '/shop');
    setIsActive(promo.isActive !== false);
    setOrder(promo.order || 0);
    setFilePreview(getImageUrl(promo.image));
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && !file) {
      toast.error('Veuillez sélectionner une image pour la promotion.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('badge', badge);
    formData.append('discountText', discountText);
    formData.append('link', link);
    formData.append('isActive', isActive);
    formData.append('order', order);

    try {
      if (editingId) {
        const res = await promotionService.updatePromotion(editingId, formData);
        if (res.success) {
          toast.success('Promotion mise à jour avec succès !');
          resetForm();
          fetchPromotions();
        }
      } else {
        const res = await promotionService.createPromotion(formData);
        if (res.success) {
          toast.success('Promotion créée avec succès !');
          resetForm();
          fetchPromotions();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await promotionService.togglePromotionActive(id);
      if (res.success) {
        toast.success(res.message || 'Statut mis à jour');
        setPromotions((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isActive: res.isActive } : item))
        );
      }
    } catch (err) {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette promotion ?')) {
      try {
        const res = await promotionService.deletePromotion(id);
        if (res.success) {
          toast.success('Promotion supprimée avec succès.');
          if (editingId === id) resetForm();
          fetchPromotions();
        }
      } catch (err) {
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  const activeCount = promotions.filter((p) => p.isActive).length;

  return (
    <div className="space-y-8 text-left">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm text-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Flame size={20} />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base uppercase tracking-wider">
              Gestion de la Section Promotions (Accueil)
            </h2>
            <p className="text-xs font-bold text-slate-800">
              Contrôlez les bannières promotionnelles affichées juste après la barre de recherche.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 text-white px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{activeCount} promotion(s) visible(s)</span>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create / Edit Promotion Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[24px] border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 size={16} className="text-amber-500" />
                    Modifier la Promotion
                  </>
                ) : (
                  <>
                    <Plus size={16} className="text-amber-500" />
                    Nouvelle Promotion
                  </>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Remplissez les détails et téléversez une image de bannière attrayante.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                Annuler
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Image Selector */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Image / Bannière de la Promo *
              </label>

              {!filePreview ? (
                <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 transition-colors rounded-[16px] h-36 flex flex-col items-center justify-center relative bg-slate-50/60 cursor-pointer overflow-hidden group">
                  <input
                    type="file"
                    required={!editingId}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Image size={24} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider mt-2 group-hover:text-slate-900 transition-colors">
                    Choisir une image
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    JPEG, PNG, WEBP (Max 5Mo)
                  </span>
                </div>
              ) : (
                <div className="relative rounded-[16px] overflow-hidden border border-slate-200 h-36 bg-slate-100 flex items-center justify-center">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Titre de la promotion *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Arrivage Écrans VIVO & OPPO JT"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {/* Subtitle */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sous-titre / Description courte
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Profitez de tarifs grossiste imbattables sur toute la gamme !"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Badge & Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Badge (Rouge)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex: PROMO, FLASH, NOUVEAU"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Texte Réduction (Doré)
                </label>
                <input
                  type="text"
                  value={discountText}
                  onChange={(e) => setDiscountText(e.target.value)}
                  placeholder="Ex: -20%, PRIX CHOC, PACK PRO"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
            </div>

            {/* Link & Order */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Lien de redirection
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/shop?keyword=afficheur"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] pl-8 pr-3 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ordre
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[12px] px-3 py-2.5 focus:outline-none focus:border-amber-500 text-center font-bold"
                />
              </div>
            </div>

            {/* Visibility Toggle Switch (Show / Hide) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Visibilité sur le site (Afficher / Masquer)
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {isActive ? '✅ Visible pour les clients sur la page d\'accueil' : '🚫 Masquée (brouillon)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isActive ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                    isActive ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-[16px] transition-transform hover:scale-101 active:scale-98 flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>
                {uploading
                  ? 'Enregistrement en cours...'
                  : editingId
                  ? 'Mettre à Jour la Promotion'
                  : 'Publier la Promotion'}
              </span>
            </button>
          </form>
        </div>

        {/* Right Side: List of Promotions */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[24px] border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                Toutes les Promotions Enregistrées
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Activez, désactivez ou supprimez vos promotions à tout moment.
              </p>
            </div>
            <span className="text-xs font-black text-slate-400">{promotions.length} totale(s)</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-[20px] p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertCircle size={36} className="text-amber-500/50" />
              <h4 className="font-bold text-slate-800 text-sm">Aucune promotion pour le moment</h4>
              <p className="text-[11px] text-slate-400 max-w-sm leading-normal">
                Créez votre première promotion pour la mettre en valeur sur la page d'accueil juste après la recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <div
                  key={promo._id}
                  className={`border rounded-[20px] p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    promo.isActive
                      ? 'border-amber-300/80 bg-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 opacity-70'
                  }`}
                >
                  {/* Thumbnail & Info */}
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-20 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1 relative">
                      <img
                        src={getImageUrl(promo.image)}
                        alt={promo.title}
                        className="w-full h-full object-contain"
                      />
                      {promo.badge && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded">
                          {promo.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {promo.title || 'Sans titre'}
                        </h4>
                        {promo.discountText && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {promo.discountText}
                          </span>
                        )}
                      </div>

                      {promo.subtitle && (
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                          {promo.subtitle}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Link2 size={10} />
                          {promo.link || '/shop'}
                        </span>
                        <span>•</span>
                        <span>Ordre: {promo.order || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Toggle Active (Show/Hide), Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleActive(promo._id)}
                      title={promo.isActive ? 'Masquer la promotion' : 'Afficher la promotion'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        promo.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {promo.isActive ? (
                        <>
                          <Eye size={13} />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Masquée</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditClick(promo)}
                      title="Modifier"
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(promo._id)}
                      title="Supprimer"
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
