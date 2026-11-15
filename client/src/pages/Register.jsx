import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, User, UserPlus, CheckCircle, Info, Store, ArrowRight, ArrowLeft, Eye, EyeOff, MapPin, Building, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, clearError } from '../store/authSlice';
import { yalidineService } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

const DEFAULT_WILAYAS = [
  { id: 1, name: 'Adrar' },
  { id: 2, name: 'Chlef' },
  { id: 3, name: 'Laghouat' },
  { id: 4, name: 'Oum El Bouaghi' },
  { id: 5, name: 'Batna' },
  { id: 6, name: 'Béjaïa' },
  { id: 7, name: 'Biskra' },
  { id: 8, name: 'Béchar' },
  { id: 9, name: 'Blida' },
  { id: 10, name: 'Bouira' },
  { id: 11, name: 'Tamanrasset' },
  { id: 12, name: 'Tébessa' },
  { id: 13, name: 'Tlemcen' },
  { id: 14, name: 'Tiaret' },
  { id: 15, name: 'Tizi Ouzou' },
  { id: 16, name: 'Alger' },
  { id: 17, name: 'Djelfa' },
  { id: 18, name: 'Jijel' },
  { id: 19, name: 'Sétif' },
  { id: 20, name: 'Saïda' },
  { id: 21, name: 'Skikda' },
  { id: 22, name: 'Sidi Bel Abbès' },
  { id: 23, name: 'Annaba' },
  { id: 24, name: 'Guelma' },
  { id: 25, name: 'Constantine' },
  { id: 26, name: 'Médéa' },
  { id: 27, name: 'Mostaganem' },
  { id: 28, name: "M'Sila" },
  { id: 29, name: 'Mascara' },
  { id: 30, name: 'Ouargla' },
  { id: 31, name: 'Oran' },
  { id: 32, name: 'El Bayadh' },
  { id: 33, name: 'Illizi' },
  { id: 34, name: 'Bordj Bou Arreridj' },
  { id: 35, name: 'Boumerdès' },
  { id: 36, name: 'El Tarf' },
  { id: 37, name: 'Tindouf' },
  { id: 38, name: 'Tissemsilt' },
  { id: 39, name: 'El Oued' },
  { id: 40, name: 'Khenchela' },
  { id: 41, name: 'Souk Ahras' },
  { id: 42, name: 'Tipaza' },
  { id: 43, name: 'Mila' },
  { id: 44, name: 'Aïn Defla' },
  { id: 45, name: 'Naâma' },
  { id: 46, name: 'Aïn Témouchent' },
  { id: 47, name: 'Ghardaïa' },
  { id: 48, name: 'Relizane' },
  { id: 49, name: "El M'Ghair" },
  { id: 50, name: 'El Meniaa' },
  { id: 51, name: 'Ouled Djellal' },
  { id: 52, name: 'Bordj Baji Mokhtar' },
  { id: 53, name: 'Béni Abbès' },
  { id: 54, name: 'Timimoun' },
  { id: 55, name: 'Touggourt' },
  { id: 56, name: 'Djanet' },
  { id: 57, name: 'In Salah' },
  { id: 58, name: 'In Guezzam' }
];

export default function Register() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const isAr = language === 'ar';
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Read initial clientType from query parameter if present
  const initialType = searchParams.get('type') === 'demi-gros' || searchParams.get('type') === 'super-gros' 
    ? searchParams.get('type') 
    : 'retail';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientType, setClientType] = useState(initialType);
  const [showPassword, setShowPassword] = useState(false);

  // Wilaya and Commune selection state
  const [wilayasList, setWilayasList] = useState(DEFAULT_WILAYAS);
  const [communesList, setCommunesList] = useState([]);
  const [selectedWilayaId, setSelectedWilayaId] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  // Fetch official wilayas from Yalidine on mount
  useEffect(() => {
    let isMounted = true;
    yalidineService.getWilayas().then((res) => {
      if (isMounted && res.success && res.data && res.data.length > 0) {
        const sorted = [...res.data].sort((a, b) => Number(a.id) - Number(b.id));
        setWilayasList(sorted);
      }
    }).catch((err) => {
      console.warn('Could not load wilayas from Yalidine, using default list:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch communes when selected wilaya changes
  const handleWilayaChange = async (e) => {
    const wId = e.target.value;
    setSelectedWilayaId(wId);
    setCommune('');
    setCommunesList([]);

    if (!wId) {
      setWilaya('');
      return;
    }

    const match = wilayasList.find((w) => w.id.toString() === wId.toString());
    const wilayaName = match ? match.name : '';
    setWilaya(wilayaName);

    setLoadingCommunes(true);
    try {
      const res = await yalidineService.getCommunes(wId);
      if (res.success && res.data) {
        setCommunesList(res.data);
      }
    } catch (err) {
      console.error('Error fetching communes:', err);
    } finally {
      setLoadingCommunes(false);
    }
  };

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
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error(isAr ? 'يرجى ملء جميع الخانات المطلوبة' : 'Tous les détails d\'inscription sont requis');
      return;
    }
    if (!wilaya || !commune) {
      toast.error(isAr ? 'يرجى اختيار الولاية والبلدية' : 'Veuillez sélectionner votre Wilaya et votre Commune');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isAr ? 'كلمتا السر غير متطابقتين' : 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      toast.error(isAr ? 'يجب أن تحتوي كلمة السر على 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    dispatch(register({ name: name.trim(), email: email.trim(), password, clientType, wilaya: wilaya.trim(), commune: commune.trim() })).then((action) => {
      if (register.fulfilled.match(action)) {
        toast.success(
          isAr
            ? (clientType !== 'retail'
                ? 'تم تسجيل حساب التاجر بنجاح. حسابك في انتظار موافقة المسؤول لتفعيل أسعار الجملة.'
                : 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.')
            : (clientType !== 'retail'
                ? 'Votre inscription Pro a été enregistrée. Votre compte est en attente d\'approbation administrative.'
                : 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.'),
          { duration: 8000 }
        );
        navigate(`/login?redirect=${redirect}`);
      }
    });
  };

  const isProType = clientType === 'demi-gros' || clientType === 'super-gros';

  return (
    <div className="pt-24 min-h-screen bg-brand-bg flex items-center justify-center px-4 sm:px-6 relative overflow-hidden py-12">
      {/* Background gradients */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[150px] -top-96 -left-48 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[120px] -bottom-96 -right-48 pointer-events-none" />

      <div className="w-full max-w-xl bg-white border border-slate-100 rounded-[32px] shadow-xl p-6 sm:p-10 relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col space-y-2 text-center">
          <img src="/01.svg" alt="Nounou Telecom Logo" className="h-12 w-auto object-contain mx-auto mb-2" />
          <h2 className="text-2xl font-black text-slate-800 tracking-wide">{t('auth_register_title')}</h2>
          <p className="text-xs text-slate-500">{t('auth_register_subtitle')}</p>
        </div>

        {/* STEP 1: ACCOUNT TYPE CARDS (Matching Screenshot Layout) */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider text-start block">
            {t('auth_register_choose_type')}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Retail Customer Account */}
            <div
              onClick={() => setClientType('retail')}
              className={`p-5 rounded-[22px] border text-start cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                clientType === 'retail'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                  : 'bg-slate-50 border-slate-200/80 hover:border-slate-400 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    clientType === 'retail' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {t('account_customer_badge')}
                  </span>
                  {clientType === 'retail' && <CheckCircle size={18} className="text-amber-400" />}
                </div>
                <h4 className="text-sm font-black mb-1">{t('account_customer_title')}</h4>
                <p className={`text-xs leading-relaxed ${clientType === 'retail' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t('account_customer_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientType('retail');
                  }}
                  className={`w-full text-xs font-bold py-2.5 rounded-[12px] transition-colors ${
                    clientType === 'retail'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  {t('account_customer_btn')}
                </button>
              </div>
            </div>

            {/* Card 2: Merchant / Shop Owner Account */}
            <div
              onClick={() => {
                if (!isProType) setClientType('demi-gros');
              }}
              className={`p-5 rounded-[22px] border text-start cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                isProType
                  ? 'bg-blue-900 text-white border-blue-900 shadow-lg scale-[1.02]'
                  : 'bg-blue-50/50 border-blue-100 hover:border-blue-300 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    isProType ? 'bg-blue-400 text-slate-950' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t('account_trader_badge')}
                  </span>
                  {isProType && <CheckCircle size={18} className="text-blue-400" />}
                </div>
                <h4 className="text-sm font-black mb-1">{t('account_trader_title')}</h4>
                <p className={`text-xs leading-relaxed ${isProType ? 'text-blue-200' : 'text-slate-500'}`}>
                  {t('account_trader_desc')}
                </p>

                {/* Sub-type selector if pro is chosen */}
                {isProType && (
                  <div className="mt-3 bg-blue-950/60 p-2 rounded-[14px] border border-blue-800 space-y-1">
                    <label className="text-[10px] font-bold text-blue-300 block">
                      {isAr ? 'حدد مستوى الشراء بالجملة:' : 'Niveau de tarif pro :'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientType('demi-gros');
                        }}
                        className={`text-[10px] font-bold py-1.5 px-2 rounded-[10px] transition-colors ${
                          clientType === 'demi-gros' ? 'bg-blue-500 text-white' : 'text-blue-200 hover:bg-blue-900'
                        }`}
                      >
                        {isAr ? 'نصف الجملة' : 'Demi-Gros'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientType('super-gros');
                        }}
                        className={`text-[10px] font-bold py-1.5 px-2 rounded-[10px] transition-colors ${
                          clientType === 'super-gros' ? 'bg-blue-500 text-white' : 'text-blue-200 hover:bg-blue-900'
                        }`}
                      >
                        {isAr ? 'الجملة الكبيرة' : 'Super-Gros'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientType('demi-gros');
                  }}
                  className={`w-full text-xs font-bold py-2.5 rounded-[12px] transition-colors ${
                    isProType
                      ? 'bg-blue-400 text-slate-950 font-black'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('account_trader_btn')}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* STEP 2: REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          
          {/* Full Name */}
          <div className="flex flex-col space-y-1.5 text-start">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('auth_name_label')}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'الاسم واللقب' : 'Prénom et Nom'}
                className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary ${
                  isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
                }`}
              />
              <User size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            </div>
          </div>

          {/* Email or Phone Number Identifier */}
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

          {/* Wilaya & Commune Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
            {/* Wilaya */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>{isAr ? 'الولاية' : 'Wilaya'} *</span>
                <span className="text-[10px] text-amber-600 font-bold">58 wilayas</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedWilayaId}
                  onChange={handleWilayaChange}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary appearance-none cursor-pointer font-medium ${
                    isAr ? 'pr-10 pl-8' : 'pl-10 pr-8'
                  }`}
                >
                  <option value="">{isAr ? '-- اختر الولاية --' : '-- Sélectionner la wilaya --'}</option>
                  {wilayasList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id} - {w.name}
                    </option>
                  ))}
                </select>
                <MapPin size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] ${isAr ? 'left-3' : 'right-3'}`}>▼</div>
              </div>
            </div>

            {/* Commune */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>{isAr ? 'البلدية' : 'Commune'} *</span>
                {loadingCommunes && <Loader2 size={12} className="animate-spin text-amber-500" />}
              </label>
              <div className="relative">
                {communesList.length > 0 || !selectedWilayaId || loadingCommunes ? (
                  <select
                    required
                    disabled={!selectedWilayaId || loadingCommunes}
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary appearance-none cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                      isAr ? 'pr-10 pl-8' : 'pl-10 pr-8'
                    }`}
                  >
                    <option value="">
                      {!selectedWilayaId 
                        ? (isAr ? '-- اختر الولاية أولاً --' : '-- Choisir d\'abord la wilaya --') 
                        : loadingCommunes 
                        ? (isAr ? 'جاري تحميل البلديات...' : 'Chargement des communes...')
                        : (isAr ? '-- اختر البلدية --' : '-- Sélectionner la commune --')}
                    </option>
                    {communesList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder={isAr ? 'اكتب اسم البلدية' : 'Nom de la commune'}
                    className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary ${
                      isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
                    }`}
                  />
                )}
                <Building size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px] ${isAr ? 'left-3' : 'right-3'}`}>▼</div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5 text-start">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('auth_password_label')}
            </label>
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

          {/* Confirm Password */}
          <div className="flex flex-col space-y-1.5 text-start">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t('auth_confirm_password_label')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-[16px] py-3.5 focus:outline-none focus:border-brand-primary ${
                  isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
                }`}
              />
              <Lock size={16} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            </div>
          </div>

          {/* Registration Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-4 rounded-[18px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 mt-4"
          >
            <span>{loading ? (isAr ? 'جاري إنشاء الحساب...' : 'Création du compte...') : (isAr ? 'تأكيد وإنشاء الحساب' : 'Créer le compte')}</span>
            <UserPlus size={16} />
          </button>
        </form>

        {/* Footer Support Note & Login Link */}
        <div className="space-y-3 text-center pt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            {t('auth_register_support_note')}
          </p>

          <p className="text-xs text-slate-600">
            {t('auth_already_registered')}{' '}
            <Link to={`/login?redirect=${redirect}`} className="text-brand-primary font-bold hover:underline">
              {t('auth_login_link')}
            </Link>
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
