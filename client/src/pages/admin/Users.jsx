import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, UserCheck, Trash2, Key, Edit, Plus, X, Upload } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('active');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل قائمة المستخدمين' : 'Échec du chargement de la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userToApprove) => {
    const toastId = toast.loading(isAr ? `جاري الموافقة على حساب ${userToApprove.name}...` : `Approbation du compte de ${userToApprove.name}...`);
    try {
      const res = await userService.updateUser(userToApprove._id, { isVerified: true });
      if (res.success) {
        toast.success(isAr ? `تمت الموافقة على حساب ${userToApprove.name} بنجاح !` : `Le compte de ${userToApprove.name} a été approuvé avec succès !`, { id: toastId });
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
    if (!window.confirm(isAr ? 'هل أنت تأكد من رغبتك في حذف هذا المستخدم بشكل نهائي؟' : 'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) return;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">
            {t('admin_users_title')}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? 'إضافة، تعديل أو حذف الحسابات وتحديد مستويات تسعير الجملة والتجزئة.' : 'Ajoutez, modifiez ou supprimez les comptes et gérez les types de tarifs clients.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Import Excel */}
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-md hover:scale-103 active:scale-97 transition-all cursor-pointer w-full sm:w-auto">
            <Upload size={15} />
            <span>{isAr ? 'استيراد زبائن (Excel)' : 'Importer Clients (Excel)'}</span>
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-md hover:scale-103 active:scale-97 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Upload size={15} className="rotate-180" />
            <span>{isAr ? 'تصدير زبائن (Excel)' : 'Exporter Clients (Excel)'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-sm hover:scale-103 active:scale-97 transition-transform cursor-pointer w-full sm:w-auto"
          >
            <Plus size={15} />
            <span>{isAr ? 'إنشاء حساب جديد' : 'Créer un Compte'}</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'border-brand-primary text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {isAr ? `الحسابات المفعلة (${activeUsers.length})` : `Comptes Actifs (${activeUsers.length})`}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-brand-primary text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>{isAr ? 'طلبات التسجيل المعلقة' : 'Demandes d\'inscription'}</span>
          {pendingUsers.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden text-start">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-slate-500 text-xs">
              <thead className="bg-gray-50 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">{t('admin_users_col_name')}</th>
                  <th className="py-4 px-6">{t('admin_users_col_email')} / {t('admin_users_col_phone')}</th>
                  <th className="py-4 px-6">{isAr ? 'الرتبة' : 'Rôle'}</th>
                  <th className="py-4 px-6">{t('admin_users_col_type')}</th>
                  <th className="py-4 px-6">{isAr ? 'تاريخ الإنشاء' : 'Créé Le'}</th>
                  <th className="py-4 px-6 text-center">{t('admin_users_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'pending' ? pendingUsers : activeUsers).map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-650 ltr-text">{u.email || u.phone || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? (isAr ? 'مسؤول' : 'Admin') : (isAr ? 'زبون' : 'Client')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider ${
                        u.clientType === 'super-gros' 
                          ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                          : u.clientType === 'demi-gros' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-green-50 text-green-600 border border-green-100'
                      }`}>
                        {u.clientType === 'super-gros' 
                          ? (isAr ? 'الجملة الكبيرة' : 'Super Gros') 
                          : u.clientType === 'demi-gros' 
                          ? (isAr ? 'نصف الجملة' : 'Demi Gros') 
                          : (isAr ? 'تجزئة' : 'Détail')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-500 ltr-text">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2">
                        {activeTab === 'pending' && (
                          <button
                            onClick={() => handleApproveUser(u)}
                            title={isAr ? "الموافقة وتفعيل الحساب" : "Approuver le compte"}
                            className="p-2 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title={isAr ? "تعديل" : "Modifier"}
                          className="p-2 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          title={activeTab === 'pending' ? (isAr ? "رفض" : "Rejeter") : (isAr ? "حذف" : "Supprimer")}
                          disabled={u._id === currentUser._id}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
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
