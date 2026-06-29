import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, clearError } from '../store/authSlice';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect url if checkout is pending
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
    if (!email || !password) {
      toast.error('Tous les identifiants sont requis');
      return;
    }
    dispatch(login({ email, password }));
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[150px] -top-96 -left-48 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[120px] -bottom-96 -right-48 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 relative z-10">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <img src="/01.svg" alt="Nounou Telecom Logo" className="h-12 w-auto object-contain mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">CONNEXION</h2>
          <p className="text-xs text-slate-500">Connectez-vous pour gérer vos commandes et votre panier</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@example.com"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-4 py-3.5 focus:outline-none focus:border-brand-primary"
              />
              <Mail size={14} className="absolute left-3.5 top-4 text-slate-400" />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs rounded-[16px] pl-10 pr-12 py-3.5 focus:outline-none focus:border-brand-primary"
              />
              <Lock size={14} className="absolute left-3.5 top-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[18px] hover:scale-105 active:scale-95 transition-transform duration-300 flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            <LogIn size={14} />
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-8">
          Vous n'avez pas de compte ?{' '}
          <Link to={`/register?redirect=${redirect}`} className="text-brand-primary font-bold hover:underline">
            Inscrivez-vous maintenant
          </Link>
        </p>
      </div>
    </div>
  );
}
