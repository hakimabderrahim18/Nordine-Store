import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, CheckCircle, ShieldAlert, Truck, CreditCard } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function FAQ() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [activeIdx, setActiveIdx] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: isAr ? 'جميع الأسئلة' : 'Toutes les Questions' },
    { id: 'quality', label: isAr ? 'الجودة وقطع الغيار' : 'Qualité & Pièces', icon: <CheckCircle size={14} /> },
    { id: 'b2b', label: isAr ? 'أسعار الجملة وB2B' : 'Tarifs B2B & Gros', icon: <ShieldAlert size={14} /> },
    { id: 'shipping', label: isAr ? 'الشحن والولايات' : 'Expédition & Wilayas', icon: <Truck size={14} /> },
    { id: 'payment', label: isAr ? 'الدفع والإرجاع' : 'Paiements & Retours', icon: <CreditCard size={14} /> }
  ];

  const faqs = [
    {
      category: 'quality',
      question: isAr 
        ? "ما الفرق بين شاشات Service Pack الأصلية وقطع الـ OEM؟"
        : "Quelle est la différence entre un Service Pack Original et de l'OEM ?",
      answer: isAr
        ? "القطع التي تحمل علامة 'Service Pack Original' تأتي مباشرة من المراكز الرسمية للمصنعين (سامسونج، آبل، شاومي، إلخ) في عبوات معتمدة. أما قطع 'Premium OEM' فيتم تصنيعها وفقًا لمواصفات صارمة من قِبل جهات خارجية مؤهلة تستخدم شاشات ودوائر بنفس مستوى الأداء لتقديم أفضل قيمة مقابل السعر."
        : "Les pièces estampillées 'Service Pack Original' proviennent directement des centres officiels des constructeurs (Samsung, Apple, Xiaomi, etc.) sous emballage certifié. Les pièces 'Premium OEM' sont fabriquées selon un cahier des charges rigoureux par des tiers qualifiés utilisant des dalles et circuits de même niveau de performance pour offrir un rapport qualité-prix optimal."
    },
    {
      category: 'quality',
      question: isAr
        ? "كيف يعمل الضمان مدى الحياة على شاشات العرض؟"
        : "Comment fonctionne la garantie à vie sur les dalles d'affichage ?",
      answer: isAr
        ? "تستفيد جميع شاشات اللمس وأجهزة العرض لدينا من ضمان محدود مدى الحياة. ويغطي هذا الضمان أعطال اللمس والشاشة، بشرط ألا تظهر على القطعة أي آثار لكسر مادي أو أكسدة أو فليكس ممزق أو تركيب خاطئ. يجب عدم إزالة ملصقات الحماية قبل إجراء الاختبارات الأولية."
        : "Tous nos écrans tactiles et afficheurs bénéficient d'une garantie à vie limitée. Elle couvre les pannes tactiles et d'affichage, sous réserve que la pièce ne présente aucune trace de casse physique, d'oxydation, de nappe déchirée ou de mauvaise installation. Les films de protection ne doivent pas être retirés avant les tests préalables."
    },
    {
      category: 'b2b',
      question: isAr
        ? "كيف يمكنني الاستفادة من أسعار نصف الجملة أو الجملة الكبيرة؟"
        : "Comment puis-je bénéficier des tarifs de Demi-Gros ou de Super-Gros ?",
      answer: isAr
        ? "عند إنشاء حسابك، يمكنك تحديد طبيعة نشاطك (فني مستقل، ورشة إصلاح، موزع). يتم تطبيق أسعار الجملة (نصف الجملة / الجملة الكبيرة) تلقائيًا على كامل الكتالوج بمجرد التحقق من حسابك وتفعيله من قِبل فريقنا التجاري."
        : "Lors de la création de votre compte, vous pouvez indiquer votre profil de client (Technicien indépendant, Atelier de réparation, Distributeur). Les tarifs de Gros (Demi-Gros / Super-Gros) sont automatiquement appliqués sur l'ensemble du catalogue dès lors que votre compte est validé par notre équipe commerciale ou que votre panier atteint les seuils minimums requis."
    },
    {
      category: 'b2b',
      question: isAr
        ? "كم من الوقت يستغرق التحقق من الحساب المهني وتفعيله؟"
        : "Comment combien de temps prend la validation d'un compte professionnel ?",
      answer: isAr
        ? "بمجرد الانتهاء من التسجيل وإدخال تفاصيل ورشتك أو شركتك، يقوم قسم المبيعات لدينا بمراجعة وتفعيل حسابك في غضون ساعتين إلى 4 ساعات عمل. ستتلقى رسالة تأكيد عبر البريد الإلكتروني وسيتم تفعيل جدول أسعار الجملة الخاص بك فورًا على المتجر."
        : "Une fois votre inscription finalisée avec les détails de votre atelier ou entreprise, notre service commercial valide votre dossier sous 2 à 4 heures ouvrables. Vous recevrez un e-mail de confirmation et votre grille tarifaire B2B sera activée instantanément sur la boutique."
    },
    {
      category: 'shipping',
      question: isAr
        ? "ما هي خيارات الشحن المتوفرة داخل الجزائر؟"
        : "Quelles sont les options d'expédition disponibles pour l'Algérie ?",
      answer: isAr
        ? "نحن نتعامل مع شركة ياليدين (Yalidine) لتغطية الـ 58 ولاية بأكملها. نوفر لك خيارين: التوصيل إلى المنزل (مباشرة إلى ورشتك أو منزلك) والتوصيل إلى المكتب (StopDesk) حيث تستلم الطرد من أقرب مكتب ياليدين إليك، وهذا الأخير يكون أسرع وأقل تكلفة عادة."
        : "Nous collaborons avec Yalidine pour couvrir l'intégralité des 58 wilayas. Deux formules vous sont proposées : la livraison à domicile (directement à votre atelier ou domicile) et la livraison StopDesk (retrait dans le bureau Yalidine le plus proche de chez vous), cette dernière étant généralement plus rapide et économique."
    },
    {
      category: 'shipping',
      question: isAr
        ? "ما هو متوسط وقت التوصيل المتوقع؟"
        : "Quel est le délai de livraison moyen ?",
      answer: isAr
        ? "الطلبات التي يتم تأكيدها قبل الساعة 3:00 مساءً يتم شحنها في نفس اليوم. أوقات التوصيل التقريبية هي 24 إلى 48 ساعة للولايات الكبرى (الجزائر، وهران، قسنطينة، سطيف) و48 إلى 72 ساعة للولايات الجنوبية والمناطق البعيدة."
        : "Les commandes validées avant 15h00 sont expédiées le jour même. Les délais indicatifs sont de 24 à 48 heures pour les grandes wilayas (Alger, Oran, Constantine, Sétif) et de 48 à 72 heures pour les wilayas du Sud et zones éloignées."
    },
    {
      category: 'payment',
      question: isAr
        ? "هل توفرون خدمة الدفع عند الاستلام؟"
        : "Proposez-vous le paiement à la livraison (Cash on Delivery) ?",
      answer: isAr
        ? "نعم، الدفع نقدًا عند الاستلام متوفر لجميع الولايات الجزائرية، سواء للتوصيل المنزلي أو عند الاستلام من مكاتب ياليدين (StopDesk). يمكنك فحص الطرد عند الاستلام والدفع للموزع."
        : "Oui, le paiement en espèces à la livraison est disponible pour toutes les wilayas d'Algérie, que ce soit en livraison à domicile ou au niveau des bureaux de retrait Yalidine (StopDesk). Vous inspectez le colis à la réception et réglez le livreur."
    },
    {
      category: 'payment',
      question: isAr
        ? "ما هي سياسة إرجاع القطع والمنتجات التالفة؟"
        : "Quelle est la politique de retour pour les pièces défectueuses ?",
      answer: isAr
        ? "إذا تبين وجود عيب مصنعي في أي قطعة أثناء اختبارها قبل التركيب النهائي، يمكنك بدء طلب إرجاع من حساب العميل الخاص بك. بعد فحصها وتأكيد العيب من قِبل مختبرنا الفني، سيتم تعويضك بقطعة بديلة أو إضافة رصيد لحسابك فورًا. يجب إجراء الإرجاع في غضون 15 يوم عمل."
        : "Si un composant présente un défaut d'usine constaté au moment des tests avant pose, vous pouvez initier un retour depuis votre compte client. Après validation par notre labo technique, un avoir ou une pièce de remplacement vous sera attribué immédiatement. Les retours doivent être effectués sous 15 jours ouvrables."
    }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (index) => {
    setActiveIdx(activeIdx === index ? null : index);
  };

  return (
    <div className="pt-32 pb-24 bg-brand-bg text-start min-h-screen text-slate-500">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* Title / Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
            {isAr ? "مركز الدعم الفني" : "Centre de Support"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">
            {isAr ? "الأسئلة الشائعة" : "QUESTIONS FRÉQUENTES"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            {isAr 
              ? "ابحث عن إجابات لجميع أسئلتكم المتعلقة بجودة شاشاتنا، وقوائم أسعارنا المهنية، وطرق التوصيل لدينا في جميع الولايات."
              : "Retrouvez les réponses à toutes vos questions concernant la qualité de nos écrans, nos grilles de tarifs professionnels et nos modalités de livraison dans toutes les wilayas."
            }
          </p>
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveIdx(null);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                activeCategory === cat.id
                  ? 'gold-bg-gradient text-slate-950 border-brand-primary shadow-lg shadow-brand-primary/20'
                  : 'bg-brand-card border-gray-200 text-slate-500 hover:text-slate-800 hover:border-gray-300'
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeIdx === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-brand-card border border-gray-200 rounded-[20px] overflow-hidden hover:border-brand-primary/10 transition-colors duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full flex items-center justify-between p-6 text-start cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <HelpCircle size={18} className="text-brand-primary flex-shrink-0" />
                      <span className="text-sm font-black text-slate-800 uppercase tracking-wide leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <div className={`p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}>
                      <ChevronDown size={14} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 pt-1 border-t border-gray-200/60 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-bold">
              {isAr ? "لا توجد أسئلة تطابق هذه الفئة." : "Aucune question ne correspond à cette catégorie."}
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="p-6 bg-gray-50/50 border border-gray-200 rounded-[24px] text-center max-w-lg mx-auto space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {isAr ? "ألم تجد إجابتك هنا؟" : "Vous ne trouvez pas votre réponse ?"}
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {isAr 
              ? "فريق الدعم الفني والتجاري لدينا في الخدمة لمساعدتك في طلبات الجملة أو استفسارات الضمان الخاصة بك."
              : "Notre support technique et commercial est à votre écoute pour vous aider sur vos commandes de gros ou demandes de garanties spécifiques."
            }
          </p>
          <a
            href="/contact"
            className="inline-block bg-transparent border border-gray-200 hover:bg-gray-50 text-brand-primary hover:border-brand-primary font-black text-xs uppercase tracking-wider px-5 py-3 rounded-[12px] transition-all cursor-pointer"
          >
            {isAr ? "الاتصال بورشة الدعم" : "Contacter Notre Labo"}
          </a>
        </div>

      </div>
    </div>
  );
}
