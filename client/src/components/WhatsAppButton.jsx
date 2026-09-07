import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, X, Instagram, Send, Sparkles, Smartphone, ChevronRight, Wrench } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function WhatsAppButton() {
  const { t, language, toggleLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showPhones, setShowPhones] = useState(false);
  const widgetRef = useRef(null);

  const phoneNumbers = [
    { label: language === 'ar' ? 'خدمة العملاء 1' : 'Service Client 1', number: '0550082685' },
    { label: language === 'ar' ? 'خدمة العملاء 2' : 'Service Client 2', number: '0550793379' },
    { label: language === 'ar' ? 'الدعم الفني 1' : 'Service Technique 1', number: '0662816569' },
    { label: language === 'ar' ? 'الدعم الفني 2' : 'Service Technique 2', number: '0795773324' }
  ];

  // Close widget when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowPhones(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3 font-semibold text-slate-800">
      
      {/* SOCIAL OPTIONS PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-100 shadow-2xl p-5 space-y-4 text-left mr-1 select-none"
          >
            {/* Header info */}
            <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center">
                  <Sparkles size={12} className="mr-1.5 text-brand-primary" />
                  {language === 'ar' ? 'الدعم وخدمة العملاء' : 'Service Support'}
                </h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{language === 'ar' ? 'اختر وسيلة الاتصال المناسبة لك :' : 'Choisissez votre moyen de contact :'}</p>
              </div>
              <button 
                onClick={() => { setIsOpen(false); setShowPhones(false); }}
                className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main channels */}
            <div className="space-y-2">
              {/* WhatsApp Link */}
              <a
                href="https://wa.me/213550082685"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-950">WhatsApp</h5>
                    <p className="text-[9px] text-emerald-700/80 font-medium">{language === 'ar' ? 'محادثة فورية مباشرة' : 'Discuter instantanément'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Telegram Link */}
              <a
                href="https://t.me/+213550082685"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-sky-50/50 hover:bg-sky-50 border border-sky-100/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                    <Send size={14} className="mr-0.5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-sky-950">Telegram</h5>
                    <p className="text-[9px] text-sky-700/80 font-medium">{language === 'ar' ? 'القناة الرسمية والدعم' : 'Canal officiel & support'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-sky-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Messenger Link */}
              <a
                href="https://m.me/100063990864388"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-950">Messenger</h5>
                    <p className="text-[9px] text-blue-700/80 font-medium">{language === 'ar' ? 'مراسلة صفحة الفيسبوك' : 'Message Facebook'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Instagram Link */}
              <a
                href="https://www.instagram.com/nounoutelecomtiaret?igsh=ZGUzMzM3NWJiOQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white flex items-center justify-center">
                    <Instagram size={15} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-pink-950">Instagram</h5>
                    <p className="text-[9px] text-pink-700/80 font-medium">{language === 'ar' ? 'تابع آخر أخبارنا' : 'Suivre nos actualités'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-pink-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Direct Calls Drawer Trigger */}
              <button
                onClick={() => setShowPhones(!showPhones)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
                    <Phone size={15} />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-950">{language === 'ar' ? 'اتصال مباشر' : 'Appels Directs'}</h5>
                    <p className="text-[9px] text-amber-700/80 font-medium">{language === 'ar' ? 'خطوطنا الأربعة الرسمية' : 'Nos 4 lignes officielles'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className={`text-amber-400 transition-transform ${showPhones ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
              </button>

              {/* Collapsible Direct Calls Drawer */}
              <AnimatePresence>
                {showPhones && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50 border border-slate-100 rounded-xl mt-1.5 p-2 space-y-1"
                  >
                    {phoneNumbers.map((ph, idx) => (
                      <a
                        key={idx}
                        href={`tel:${ph.number}`}
                        className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-white hover:shadow-sm text-[10px] text-slate-700 transition-all font-semibold cursor-pointer"
                      >
                        <Smartphone size={11} className="text-slate-400 flex-shrink-0" />
                        <div className="flex-grow text-left">
                          <span className="block text-[8px] text-slate-400 font-bold uppercase leading-none mb-0.5">{ph.label}</span>
                          <span className="font-bold text-slate-700">{ph.number}</span>
                        </div>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOAT TRIGGER BUTTONS STACKED VERTICALLY */}
      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        className="bg-slate-900/90 hover:bg-slate-950 text-brand-primary p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-108 active:scale-95 border border-slate-800 backdrop-blur-sm cursor-pointer text-[10px] font-black w-12 h-12 select-none"
        title={language === 'fr' ? 'Changer de langue (العربية)' : 'Changer de langue (FR)'}
      >
        {language === 'fr' ? 'AR' : 'FR'}
      </button>

      {/* Consulting / Devis Link (takes to contact) */}
      <Link
        to="/contact"
        className="bg-slate-900/90 hover:bg-slate-900 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-slate-800 backdrop-blur-sm animate-bounce-subtle cursor-pointer group"
        title="Consultation & Devis"
      >
        <Wrench size={20} className="text-brand-primary group-hover:rotate-45 transition-transform duration-300" />
      </Link>

      {/* Social Help Widget Trigger Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center relative cursor-pointer group ${
          isOpen 
            ? 'bg-slate-800 text-white rotate-90 scale-95' 
            : 'gold-bg-gradient text-slate-950 hover:scale-110 active:scale-95'
        }`}
        title="Contactez-nous"
      >
        {/* Pulsing ring if closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-brand-primary/40 animate-ping opacity-75 pointer-events-none" />
        )}

        {isOpen ? <X size={20} /> : <Phone size={20} />}
      </button>

    </div>
  );
}
