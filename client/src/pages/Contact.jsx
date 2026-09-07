import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, ShieldCheck, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactService } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function Contact() {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'support',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await contactService.submitContactForm(formData);
      if (res.success) {
        toast.success(language === 'ar' ? t('form_success') : res.message);
        setFormData({
          name: '',
          email: '',
          subject: 'support',
          message: ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة.' : 'Erreur lors de l\'envoi du message.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-brand-bg text-left min-h-screen text-slate-500">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Page Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">{language === 'ar' ? 'الدعم والمبيعات' : 'Support & Ventes'}</span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">
            {t('contact_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            {t('contact_subtitle')}
          </p>
        </section>

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Info cards */}
          <section className="lg:col-span-5 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-brand-primary">{language === 'ar' ? 'بيانات الاتصال بنا' : 'Nos Coordonnées'}</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">{language === 'ar' ? 'معلومات الاتصال المباشرة' : 'INFORMATIONS DE CONTACT'}</h2>
            </div>

            <div className="space-y-4">
              {/* Card 1: Telephone */}
              <div className="bg-brand-card border border-gray-200 rounded-[20px] p-5 flex items-start space-x-4">
                <div className="p-3 bg-gray-50 border border-gray-200 text-brand-primary rounded-[14px] flex-shrink-0">
                  <Phone size={18} />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('contact_phone')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    <p className="text-xs font-semibold text-slate-600"><a href="tel:0550082685" className="hover:text-brand-primary ltr-text">0550 08 26 85</a></p>
                    <p className="text-xs font-semibold text-slate-600"><a href="tel:0550793379" className="hover:text-brand-primary ltr-text">0550 79 33 79</a></p>
                    <p className="text-xs font-semibold text-slate-600"><a href="tel:0662816569" className="hover:text-brand-primary ltr-text">0662 81 65 69</a></p>
                    <p className="text-xs font-semibold text-slate-600"><a href="tel:0795773324" className="hover:text-brand-primary ltr-text">0795 77 33 24</a></p>
                  </div>
                </div>
              </div>

              {/* Card 2: E-mail */}
              <div className="bg-brand-card border border-gray-200 rounded-[20px] p-5 flex items-start space-x-4">
                <div className="p-3 bg-gray-50 border border-gray-200 text-brand-primary rounded-[14px] flex-shrink-0">
                  <Mail size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('contact_email')}</h4>
                  <p className="text-xs font-semibold text-slate-600">service@nounoutelecom.com</p>
                </div>
              </div>

              {/* Card 3: Address */}
              <div className="bg-brand-card border border-gray-200 rounded-[20px] p-5 flex items-start space-x-4">
                <div className="p-3 bg-gray-50 border border-gray-200 text-brand-primary rounded-[14px] flex-shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="space-y-1 text-start">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('contact_location')}</h4>
                  <p className="text-xs font-semibold text-slate-600">{t('contact_address')}</p>
                  <p className="text-xs font-semibold text-slate-500">{t('contact_country')}</p>
                </div>
              </div>

              {/* Card 4: Hours */}
              <div className="bg-brand-card border border-gray-200 rounded-[20px] p-5 flex items-start space-x-4">
                <div className="p-3 bg-gray-50 border border-gray-200 text-brand-primary rounded-[14px] flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('contact_hours')}</h4>
                  <p className="text-xs font-semibold text-slate-600">{language === 'ar' ? 'السبت – الخميس : 09:00 – 20:00' : 'Samedi – Jeudi : 09:00 – 20:00'}</p>
                  <p className="text-xs font-semibold text-slate-500">{language === 'ar' ? 'الجمعة : مغلق' : 'Vendredi : Fermé'}</p>
                </div>
              </div>
            </div>

            {/* Google Maps Button Card */}
            <div className="bg-brand-card border border-gray-200 rounded-[24px] p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative space-y-3 z-10">
                <div className="w-12 h-12 bg-amber-50 border border-brand-primary/20 rounded-full flex items-center justify-center mx-auto text-brand-primary">
                  <MapPin size={22} className="animate-bounce" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{language === 'ar' ? 'تيارت، الجزائر' : 'Tiaret, ALGÉRIE'}</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{language === 'ar' ? 'تفضل بزيارة نقطة استلام وبيع قطع الغيار الخاصة بنا' : 'Retrouvez notre point de dépôt de pièces détachées sur la carte'}</p>
                </div>
                <a
                  href="https://maps.app.goo.gl/4NvyMuBrLTtcVBnP6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex gold-bg-gradient text-slate-950 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-[12px] hover:scale-103 active:scale-97 transition-transform cursor-pointer"
                >
                  {language === 'ar' ? 'فتح في خرائط جوجل' : 'Ouvrir dans Google Maps'}
                </a>
              </div>
            </div>

          </section>

          {/* Right Column: Form */}
          <section className="lg:col-span-7 bg-brand-card border border-gray-200 rounded-[32px] p-8 md:p-10 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-brand-primary">{language === 'ar' ? 'هل لديك أي استفسار؟' : 'Des questions ?'}</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">{t('contact_form_title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {t('form_name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={language === 'ar' ? 'الاسم بالكامل أو اسم المحل' : 'Votre nom ou atelier'}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-[16px] px-5 py-3.5 text-xs focus:outline-none focus:border-brand-primary font-medium"
                    required
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {t('form_email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nom@exemple.com"
                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-[16px] px-5 py-3.5 text-xs focus:outline-none focus:border-brand-primary font-medium"
                    required
                  />
                </div>
              </div>

              {/* Subject dropdown */}
              <div className="space-y-2">
                <label htmlFor="subject" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {language === 'ar' ? 'موضوع الرسالة' : 'Objet de la demande'}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-600 rounded-[16px] px-5 py-3.5 text-xs focus:outline-none focus:border-brand-primary font-bold uppercase tracking-wider cursor-pointer"
                >
                  <option value="support">{language === 'ar' ? 'الدعم الفني / الجودة' : 'Support Technique / Qualité'}</option>
                  <option value="wholesale">{language === 'ar' ? 'حساب الجملة وأسعار الوكلاء B2B' : 'Compte Grossiste & Tarifs B2B'}</option>
                  <option value="orders">{language === 'ar' ? 'الطلبات ومتابعة الشحن والتسليم' : 'Commandes & Suivi de Livraison'}</option>
                  <option value="warranty">{language === 'ar' ? 'خدمة ما بعد البيع والضمان' : 'Service Après-Vente & Garanties'}</option>
                  <option value="other">{language === 'ar' ? 'طلب آخر' : 'Autre demande'}</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {t('form_message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder={language === 'ar' ? 'يرجى كتابة تفاصيل طلبك الفني أو التجاري هنا...' : 'Décrivez votre besoin technique ou commercial...'}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-800 rounded-[16px] px-5 py-3.5 text-xs focus:outline-none focus:border-brand-primary font-medium resize-none"
                  required
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full gold-bg-gradient text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-[16px] flex items-center justify-center space-x-2 shadow-lg shadow-brand-primary/15 hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <span className="inline-block animate-pulse">{language === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...'}</span>
                ) : (
                  <>
                    <Send size={13} className="fill-slate-950 text-slate-950" />
                    <span>{t('btn_send')}</span>
                  </>
                )}
              </button>
            </form>

            {/* Verification highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/60 text-slate-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className="text-brand-primary flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'ar' ? 'اتصال آمن ومحمي' : 'Données Sécurisées'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <HeartHandshake size={16} className="text-brand-primary flex-shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'ar' ? 'الرد خلال 24 ساعة' : 'Réponse sous 24h'}</span>
              </div>
            </div>

          </section>

        </div>

      </div>
    </div>
  );
}
