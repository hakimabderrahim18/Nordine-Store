import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, LogIn, Info, User, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, clearError } from '../store/authSlice';
import { useTranslation } from '../context/LanguageContext';

export default function Login() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const isAr = language === 'ar';
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

    if (searchParams.get('expired') === 'true') {
      toast.error(
        isAr
          ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
          : 'Votre session a expiré. Veuillez vous connecter à nouveau.'
      );
      navigate(window.location.pathname + (redirect !== '/' ? `?redirect=${redirect}` : ''), { replace: true });
    }

    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [isAuthenticated, error, navigate, redirect, dispatch, searchParams, isAr]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Tous les identifiants sont requis');
      return;
    }
    dispatch(login({ email, password }));
  };

  return (
    <div className="pt-24 min-h-screen bg-brand-bg flex items-center justify-center px-4 sm:px-6 relative overflow-hidden py-12">
      {/* Background gradients */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[150px] -top-96 -left-48 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[120px] -bottom-96 -right-48 pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        
        {/* LOGIN CARD */}
        <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col space-y-2 text-center mb-6">
            <img src="/01.svg" alt="Nounou Telecom Logo" className="h-12 w-auto object-contain mx-auto mb-2" />
            <h2 className="text-2xl font-black text-slate-800 tracking-wide">{t('auth_login_title')}</h2>
            <p className="text-xs text-slate-500">{t('auth_login_subtitle')}</p>
          </div>

          {/* Account Approval Note Banner (Matching screenshot) */}
          <div className="mb-6 bg-amber-50/80 border border-amber-200/70 rounded-[18px] p-3.5 flex items-start gap-3 text-amber-900">
            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed font-semibold">
              {t('auth_login_note')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username field */}
            <div className="flex flex-col space-y-1.5 text-start">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {t('auth_identity_label')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'مثال: client@example.com أو 0550123456' : 'exemple@domain.com ou 0550123456'}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary ${
                    isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  }`}
                />
                <Mail size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col space-y-1.5 text-start">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t('auth_password_label')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  {t('auth_forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary ${
                    isAr ? 'pr-10 pl-12' : 'pl-10 pr-12'
                  }`}
                />
                <Lock size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 ${isAr ? 'left-3.5' : 'right-3.5'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-4 rounded-[18px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 mt-2"
            >
              <span>{loading ? t('auth_btn_logging_in') : t('auth_btn_login')}</span>
              <LogIn size={15} className={isAr ? 'rotate-180' : ''} />
            </button>
          </form>

        </div>

        {/* REGISTRATION ACCOUNT TYPE SELECTION SECTION (Matching Screenshot) */}
        <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-6 sm:p-8 space-y-5 text-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-wide">
              {t('auth_register_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth_register_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Card 1: Customer Account */}
            <div className="bg-slate-50/70 border border-slate-200/80 hover:border-brand-primary/60 rounded-[22px] p-5 text-start transition-all hover:shadow-md relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User size={18} className="text-brand-primary" />
                  <h4 className="text-sm font-black text-slate-800">{t('account_customer_title')}</h4>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-200/70 px-2.5 py-1 rounded-full">
                  {t('account_customer_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {t('account_customer_desc')}
              </p>
              <Link
                to={`/register?type=retail&redirect=${redirect}`}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 rounded-[14px] flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <span>{t('account_customer_btn')}</span>
              </Link>
            </div>

            {/* Card 2: Merchant / Shop Owner Account */}
            <div className="bg-blue-50/40 border border-blue-100 hover:border-blue-300 rounded-[22px] p-5 text-start transition-all hover:shadow-md relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Store size={18} className="text-blue-600" />
                  <h4 className="text-sm font-black text-slate-800">{t('account_trader_title')}</h4>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {t('account_trader_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {t('account_trader_desc')}
              </p>
              <Link
                to={`/register?type=demi-gros&redirect=${redirect}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-[14px] flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <span>{t('account_trader_btn')}</span>
              </Link>
            </div>

          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            {t('auth_register_support_note')}
          </p>

          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-brand-primary inline-flex items-center gap-1.5 transition-colors"
            >
              {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>{t('auth_back_home')}</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
