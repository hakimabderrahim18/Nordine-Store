import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, UserCheck, Trash2, Key, Edit, Plus, X, Upload, Search, Phone, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/api';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../context/LanguageContext';

export default function Users() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // Default to pending if there are pending users

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Approval quick modal / tier selection state
  const [approvingUser, setApprovingUser] = useState(null);
  const [approvalTier, setApprovalTier] = useState('retail');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [clientType, setClientType] = useState('retail');
  const [saving, setSaving] = useState(false);

  // Grouped users
  const activeUsers = users.filter(u => u.isVerified);
  const pendingUsers = users.filter(u => !u.isVerified);

  useEffect(() => {
    fetchUsersList();
  }, []);

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers();
      if (res.success) {
        setUsers(res.users);
        // If there are pending users, default tab to pending, otherwise active
        const pendingCount = res.users.filter(u => !u.isVerified).length;
        if (pendingCount > 0 && activeTab === 'all') {
          setActiveTab('pending');
        }
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل قائمة المستخدمين' : 'Échec du chargement de la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userToApprove, customTier) => {
    const tierToSet = customTier || userToApprove.clientType || 'retail';
    const toastId = toast.loading(isAr ? `جاري تفعيل حساب ${userToApprove.name}...` : `Validation du compte de ${userToApprove.name}...`);
    try {
      const res = await userService.updateUser(userToApprove._id, { isVerified: true, clientType: tierToSet });
      if (res.success) {
        toast.success(isAr ? `تمت الموافقة على حساب ${userToApprove.name} بنجاح !` : `Le compte de ${userToApprove.name} a été approuvé avec succès !`, { id: toastId });
        setApprovingUser(null);
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isAr ? 'فشل تفعيل الحساب' : "Échec de l'approbation du compte"), { id: toastId });
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = ''; // Reset file input

    const toastId = toast.loading(isAr ? 'جاري استيراد الحسابات...' : 'Importation des comptes en cours...');
    try {
      const res = await userService.importUsers(file);
      if (res.success) {
        toast.success(res.message || (isAr ? 'تمت عملية الاستيراد بنجاح !' : 'Importation terminée avec succès !'), { id: toastId, duration: 5000 });
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isAr ? 'فشل الاستيراد' : 'Échec de l\'importation'), { id: toastId });
    }
  };

  const handleExcelExport = async () => {
    const toastId = toast.loading(isAr ? 'جاري إنشاء ملف Excel...' : 'Génération du fichier Excel en cours...');
    try {
      await userService.exportUsers();
      toast.success(isAr ? 'تم التصدير بنجاح !' : 'Exportation réussie !', { id: toastId });
    } catch (err) {
      toast.error(isAr ? 'فشل التصدير' : 'Échec de l\'exportation', { id: toastId });
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('client');
    setClientType('retail');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setName(userToEdit.name);
    setEmail(userToEdit.email || '');
    setPhone(userToEdit.phone || '');
    setPassword('');
    setRole(userToEdit.role);
    setClientType(userToEdit.clientType || 'retail');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser._id) {
      toast.error(isAr ? 'لا يمكنك حذف حسابك الشخصي' : 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا الحساب بشكل نهائي؟' : 'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) return;

    try {
      const res = await userService.deleteUser(id);
      if (res.success) {
        toast.success(isAr ? 'تم حذف المستخدم بنجاح !' : 'Utilisateur supprimé avec succès !');
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isAr ? 'فشل الحذف' : 'Échec de la suppression'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error(isAr ? 'الاسم مطلوب' : 'Le nom est requis');
      return;
    }
    if (!email && !phone) {
      toast.error(isAr ? 'البريد الإلكتروني أو رقم الهاتف مطلوب' : 'L\'adresse email ou le numéro de téléphone est requis');
      return;
    }
    if (!editingUser && !password) {
      toast.error(isAr ? 'كلمة السر مطلوبة للحساب الجديد' : 'Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    setSaving(true);
    const userData = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      role,
      clientType,
      password: password || undefined
    };

    try {
      let res;
      if (editingUser) {
        res = await userService.updateUser(editingUser._id, userData);
        toast.success(isAr ? 'تم تحديث الحساب بنجاح !' : 'Compte utilisateur mis à jour !');
      } else {
        res = await userService.createUser(userData);
        toast.success(isAr ? 'تم إنشاء الحساب بنجاح !' : 'Compte utilisateur créé avec succès !');
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isAr ? 'فشل الحفظ' : 'Échec de l\'enregistrement'));
    } finally {
      setSaving(false);
    }
  };

  // Filter users based on tab, search query, role, and tier
  const filteredUsers = users.filter((u) => {
    // Tab filter
    if (activeTab === 'pending' && u.isVerified) return false;
    if (activeTab === 'active' && !u.isVerified) return false;

    // Client Type filter
    if (selectedTypeFilter !== 'all' && u.clientType !== selectedTypeFilter) return false;

    // Role filter
    if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) return false;

    // Search query across name, phone, and email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const phoneMatch = (u.phone || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">
              {t('admin_users_title')}
            </h1>
            {pendingUsers.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                {pendingUsers.length} {isAr ? 'طلب جديد' : 'en attente'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr 
              ? 'البحث السريع عن الحسابات بالاسم أو رقم الهاتف والموافقة على طلبات التسجيل فوراً.' 
              : 'Recherche rapide par nom ou numéro de téléphone pour valider instantanément les demandes d\'inscription.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Import Excel */}
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-sm hover:scale-102 active:scale-97 transition-all cursor-pointer">
            <Upload size={14} />
            <span>{isAr ? 'استيراد (Excel)' : 'Importer (Excel)'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>
          {/* Export Excel */}
          <button
            onClick={handleExcelExport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-sm hover:scale-102 active:scale-97 transition-all cursor-pointer"
          >
            <Upload size={14} className="rotate-180" />
            <span>{isAr ? 'تصدير (Excel)' : 'Exporter (Excel)'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center justify-center space-x-2 shadow-sm hover:scale-102 active:scale-97 transition-transform cursor-pointer"
          >
            <Plus size={15} />
            <span>{isAr ? 'إنشاء حساب' : 'Créer un Compte'}</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR & STATUS FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Input by Name or Phone */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? '🔍 ابحث باسم الزبون أو رقم الهاتف أو البريد الإلكتروني...' : '🔍 Rechercher par nom de client, numéro de téléphone ou email...'}
            className="w-full pl-11 pr-10 rtl:pr-11 rtl:pl-10 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 rtl:left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab & Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Clock size={13} />
              <span>{isAr ? 'طلبات التسجيل المعلقة' : 'Demandes en Attente'}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                activeTab === 'pending' ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white'
              }`}>
                {pendingUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <CheckCircle size={13} />
              <span>{isAr ? 'الحسابات المفعلة' : 'Comptes Actifs'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {activeUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <User size={13} />
              <span>{isAr ? 'جميع الحسابات' : 'Tous les comptes'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {users.length}
              </span>
            </button>
          </div>

          {/* Quick Filter: Client Type */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {isAr ? 'نوع التسعير:' : 'Tarif :'}
            </span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{isAr ? 'جميع الأنواع' : 'Tous les types'}</option>
              <option value="retail">{isAr ? 'تجزئة (Détail)' : 'Détail'}</option>
              <option value="demi-gros">{isAr ? 'نصف الجملة (Demi-Gros)' : 'Demi-Gros'}</option>
              <option value="super-gros">{isAr ? 'الجملة الكبيرة (Super-Gros)' : 'Super-Gros'}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Search size={26} />
          </div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
            {isAr ? 'لم يتم العثور على أي حساب' : 'Aucun compte trouvé'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery 
              ? (isAr ? `لا توجد نتائج مطابقة لـ "${searchQuery}". تأكد من صحة الاسم أو رقم الهاتف.` : `Aucun résultat correspondant à "${searchQuery}". Vérifiez le nom ou le numéro.`)
              : (activeTab === 'pending' ? (isAr ? 'لا توجد طلبات تسجيل معلقة حالياً.' : 'Aucune demande d\'inscription en attente.') : (isAr ? 'لا يوجد مستخدمون في هذه الفئة.' : 'Aucun utilisateur dans cette catégorie.'))}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-amber-600 hover:underline pt-2 inline-block"
            >
              {isAr ? 'إلغاء البحث' : 'Effacer la recherche'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden text-start">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-slate-500 text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-black uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">{t('admin_users_col_name')}</th>
                  <th className="py-4 px-6">{isAr ? 'رقم الهاتف / البريد' : 'Téléphone / Email'}</th>
                  <th className="py-4 px-6">{isAr ? 'الحالة' : 'Statut'}</th>
                  <th className="py-4 px-6">{t('admin_users_col_type')}</th>
                  <th className="py-4 px-6">{isAr ? 'تاريخ التسجيل' : 'Date d\'inscription'}</th>
                  <th className="py-4 px-6 text-center">{t('admin_users_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr 
                    key={u._id} 
                    className={`transition-colors ${
                      !u.isVerified ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${
                          !u.isVerified 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : u.role === 'admin' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className="font-black text-slate-900 text-xs">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="bg-slate-900 text-amber-400 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          {u.email && u.phone && (
                            <span className="text-[10px] text-slate-400 block">{u.email}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold ltr-text">
                      <div className="flex flex-col space-y-0.5">
                        {u.phone ? (
                          <a 
                            href={`tel:${u.phone}`} 
                            className="inline-flex items-center text-amber-700 hover:text-amber-900 font-bold bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs w-fit transition-colors"
                            title={isAr ? 'اتصل بالزبون' : 'Appeler'}
                          >
                            <Phone size={11} className="mr-1.5 rtl:ml-1.5" />
                            <span>{u.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Pas de téléphone</span>
                        )}
                        {u.email && !u.phone && (
                          <span className="text-slate-600 text-xs">{u.email}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {u.isVerified ? (
                        <span className="inline-flex items-center font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={10} className="mr-1 rtl:ml-1" />
                          {isAr ? 'مفعل' : 'Actif'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock size={10} className="mr-1 rtl:ml-1" />
                          {isAr ? 'في انتظار الموافقة' : 'En attente'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider ${
                        u.clientType === 'super-gros' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : u.clientType === 'demi-gros' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {u.clientType === 'super-gros' 
                          ? (isAr ? 'الجملة الكبيرة (Super Gros)' : 'Super Gros') 
                          : u.clientType === 'demi-gros' 
                          ? (isAr ? 'نصف الجملة (Demi Gros)' : 'Demi Gros') 
                          : (isAr ? 'تجزئة (Détail)' : 'Détail')}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-500 ltr-text text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        {/* Quick Approve Button for Pending Users */}
                        {!u.isVerified && (
                          <button
                            onClick={() => {
                              setApprovingUser(u);
                              setApprovalTier(u.clientType || 'retail');
                            }}
                            title={isAr ? "قبول وتفعيل هذا الحساب" : "Accepter et approuver l'inscription"}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 rtl:space-x-reverse shadow-sm hover:scale-103 active:scale-97 transition-all cursor-pointer"
                          >
                            <CheckCircle size={13} />
                            <span>{isAr ? 'قبول' : 'Accepter'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(u)}
                          title={isAr ? "تعديل" : "Modifier"}
                          className="p-2 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          title={!u.isVerified ? (isAr ? "رفض الطلب" : "Rejeter la demande") : (isAr ? "حذف الحساب" : "Supprimer")}
                          disabled={u._id === currentUser._id}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
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

      {/* QUICK APPROVAL / TIER SELECTION MODAL */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-start animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle size={18} />
                </div>
                <h3 className="font-black text-sm uppercase text-slate-900 tracking-wider">
                  {isAr ? 'الموافقة على تسجيل الزبون' : 'Approuver l\'inscription'}
                </h3>
              </div>
              <button
                onClick={() => setApprovingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">{isAr ? 'الاسم:' : 'Nom :'}</span>
                <span className="text-slate-900 font-black">{approvingUser.name}</span>
              </div>
              {approvingUser.phone && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">{isAr ? 'الهاتف:' : 'Téléphone :'}</span>
                  <a href={`tel:${approvingUser.phone}`} className="text-amber-700 font-black ltr-text hover:underline">
                    {approvingUser.phone}
                  </a>
                </div>
              )}
              {approvingUser.email && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">{isAr ? 'البريد:' : 'Email :'}</span>
                  <span className="text-slate-700 font-semibold">{approvingUser.email}</span>
                </div>
              )}
            </div>

            {/* Select Tier for this user */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                {isAr ? 'حدد مستوى التسعير للزبون :' : 'Attribuer un tarif au client :'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalTier('retail')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    approvalTier === 'retail'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-black shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black">{isAr ? 'تجزئة' : 'Détail'}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Prix 1</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalTier('demi-gros')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    approvalTier === 'demi-gros'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-black shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black">{isAr ? 'نصف الجملة' : 'Demi-Gros'}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Prix Demi</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalTier('super-gros')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    approvalTier === 'super-gros'
                      ? 'border-purple-500 bg-purple-50 text-purple-800 font-black shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black">{isAr ? 'سوبر جملة' : 'Super-Gros'}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Prix Super</div>
                </button>
              </div>
            </div>

            <div className="flex space-x-3 rtl:space-x-reverse pt-3">
              <button
                type="button"
                onClick={() => handleApproveUser(approvingUser, approvalTier)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <CheckCircle size={15} />
                <span>{isAr ? 'تأكيد وقبول الحساب' : 'Valider & Activer le Compte'}</span>
              </button>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-[28px] shadow-2xl w-full max-w-md p-6 space-y-5 text-start">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider">
                {editingUser ? (isAr ? 'تعديل حساب المستخدم' : 'Modifier l\'Utilisateur') : (isAr ? 'إنشاء حساب جديد' : 'Créer un Nouvel Utilisateur')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">{t('admin_users_col_name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">{t('admin_users_col_email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">{t('admin_users_col_phone')}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  {editingUser ? (isAr ? 'كلمة السر الجديدة (اختياري)' : 'Nouveau mot de passe (optionnel)') : (isAr ? 'كلمة السر' : 'Mot de passe')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">{isAr ? 'الرتبة' : 'Rôle'}</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                  >
                    <option value="client">{isAr ? 'زبون (Client)' : 'Client'}</option>
                    <option value="admin">{isAr ? 'مسؤول (Admin)' : 'Administrateur'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">{t('admin_users_col_type')}</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
                  >
                    <option value="retail">{isAr ? 'تجزئة (Détail)' : 'Détail'}</option>
                    <option value="demi-gros">{isAr ? 'نصف الجملة (Demi-Gros)' : 'Demi-Gros'}</option>
                    <option value="super-gros">{isAr ? 'الجملة الكبيرة (Super-Gros)' : 'Super-Gros'}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition-transform active:scale-98 disabled:opacity-50 mt-2"
              >
                {saving ? (isAr ? 'جاري الحفظ...' : 'Enregistrement...') : (isAr ? 'حفظ الحساب' : 'Enregistrer')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
