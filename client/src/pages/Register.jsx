import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, clearError } from '../store/authSlice';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientType, setClientType] = useState('retail');

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }

    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [isAuthenticated, error, navigate, redirect, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Tous les détails d\'inscription sont requis');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    dispatch(register({ name, email, password, clientType }));
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-bg flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[150px] -top-96 -left-48 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 relative z-10">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <img src="/01.svg" alt="Nounou Telecom Logo" className="h-12 w-auto object-contain mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">CRÉER UN COMPTE</h2>
          <p className="text-xs text-slate-500">Inscrivez-vous pour passer des commandes et suivre vos achats</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom complet</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary"
              />
              <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@example.com"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary"
              />
              <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Type de client */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type de Client</label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] px-4 py-3.5 focus:outline-none focus:border-brand-primary"
            >
              <option value="retail">Détail (Particulier)</option>
              <option value="demi-gros">Demi-Gros (Professionnel)</option>
              <option value="super-gros">Super-Gros (Distributeur)</option>
            </select>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary"
              />
              <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3 focus:outline-none focus:border-brand-primary"
              />
              <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[18px] hover:scale-105 active:scale-95 transition-transform duration-300 flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Création du compte...' : 'Créer le compte'}</span>
            <UserPlus size={14} />
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Vous avez déjà un compte ?{' '}
          <Link to={`/login?redirect=${redirect}`} className="text-brand-primary font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
