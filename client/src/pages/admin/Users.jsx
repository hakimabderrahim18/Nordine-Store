import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, UserCheck, Trash2, Key, Edit, Plus, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/api';
import { useSelector } from 'react-redux';

export default function Users() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [clientType, setClientType] = useState('retail');
  const [saving, setSaving] = useState(false);

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
      toast.error('Échec du chargement de la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = ''; // Reset file input

    const toastId = toast.loading('Importation des comptes en cours...');
    try {
      const res = await userService.importUsers(file);
      if (res.success) {
        toast.success(res.message || 'Importation terminée avec succès !', { id: toastId, duration: 5000 });
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de l\'importation', { id: toastId });
    }
  };

  const handleExcelExport = async () => {
    const toastId = toast.loading('Génération du fichier Excel en cours...');
    try {
      await userService.exportUsers();
      toast.success('Exportation réussie !', { id: toastId });
    } catch (err) {
      toast.error('Échec de l\'exportation', { id: toastId });
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('client');
    setClientType('retail');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setClientType(user.clientType || 'retail');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser._id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) return;

    try {
      const res = await userService.deleteUser(id);
      if (res.success) {
        toast.success('Utilisateur supprimé avec succès !');
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Le nom et l\'email sont requis');
      return;
    }
    if (!editingUser && !password) {
      toast.error('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    setSaving(true);
    const userData = {
      name,
      email,
      role,
      clientType,
      password: password || undefined
    };

    try {
      let res;
      if (editingUser) {
        res = await userService.updateUser(editingUser._id, userData);
        toast.success('Compte utilisateur mis à jour !');
      } else {
        res = await userService.createUser(userData);
        toast.success('Compte utilisateur créé avec succès !');
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchUsersList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">Gestion des Comptes</h1>
          <p className="text-xs text-slate-500">Ajoutez, modifiez ou supprimez les comptes et gérez les types de tarifs clients.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Import Excel */}
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-md hover:scale-103 active:scale-97 transition-all cursor-pointer w-full sm:w-auto">
            <Upload size={15} />
            <span>Importer Clients (Excel)</span>
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
            <span>Exporter Clients (Excel)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-[16px] flex items-center justify-center space-x-2 shadow-sm hover:scale-103 active:scale-97 transition-transform cursor-pointer w-full sm:w-auto"
          >
            <Plus size={15} />
            <span>Créer un Compte</span>
          </button>
        </div>
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
                  <th className="py-4 px-6">Nom</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Rôle</th>
                  <th className="py-4 px-6">Type Client</th>
                  <th className="py-4 px-6">Créé Le</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                        {u.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-650">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`font-black px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {u.role}
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
                        {u.clientType === 'super-gros' ? 'Super Gros' : u.clientType === 'demi-gros' ? 'Demi Gros' : 'Détail'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Modifier"
                          className="p-2 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          title="Supprimer"
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

      {/* USER EDIT/CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-md p-6 relative z-10 text-left">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide mb-6 border-b border-slate-50 pb-3">
              {editingUser ? 'Modifier le Compte' : 'Créer un Compte'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ahmed Ben"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: ahmed@example.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {editingUser ? 'Nouveau Mot de passe (Optionnel)' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Laisser vide pour conserver' : 'Au moins 6 caractères'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] px-4 py-3 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] px-4 py-3 focus:outline-none"
                  >
                    <option value="client">Client</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type Client (Tarif)</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[14px] px-4 py-3 focus:outline-none"
                  >
                    <option value="retail">Détail</option>
                    <option value="demi-gros">Demi Gros</option>
                    <option value="super-gros">Super Gros</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[16px] transition-transform hover:scale-103 active:scale-97 flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                <span>{saving ? 'Enregistrement...' : editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
