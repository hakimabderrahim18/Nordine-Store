import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, Award, Zap, HeartHandshake, CheckCircle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function About() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const steps = [
    {
      icon: <ShieldCheck size={28} className="text-brand-primary" />,
      title: isAr ? "التشخيص الإلكتروني" : "Diagnostic Électronique",
      desc: isAr 
        ? "يتم توصيل كل فليكس ودارة ومتحكم لمس على منصات الاختبار المخصصة لدينا لقياس استقرار الجهد وتجنب التلامس السيئ."
        : "Chaque nappe, circuit et contrôleur tactile est branché sur nos bancs de test dédiés pour mesurer la stabilité des tensions et éviter les faux contacts."
    },
    {
      icon: <Cpu size={28} className="text-brand-primary" />,
      title: isAr ? "فحص الشاشات" : "Vérification des Dalles",
      desc: isAr
        ? "تخضع الشاشات لاختبارات ألوان صارمة للتحقق من دقة الألوان وتناسق الإضاءة الخلفية واستجابة اللمس السعوي 100% بدون أي بكسل ميت."
        : "Les écrans subissent des mires de couleurs rigoureuses pour valider la colorimétrie, l'homogénéité du rétroéclairage et la réactivité du capacitif 100% sans pixel mort."
    },
    {
      icon: <Award size={28} className="text-brand-primary" />,
      title: isAr ? "شاشة أصلية (Service Pack)" : "Service Pack Original",
      desc: isAr
        ? "نحن نفضل الإمدادات المباشرة من مراكز التوزيع الرسمية لضمان الحصول على قطع غيار أصلية من الشركة المصنعة بموثوقية مطلقة."
        : "Nous privilégions les approvisionnements directs auprès des centres de distribution officiels pour vous garantir des pièces d'origine constructeur d'une fiabilité absolue."
    }
  ];

  return (
    <div className="pt-32 pb-24 bg-brand-bg text-left min-h-screen text-slate-600">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-2"
          >
            <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
              {isAr ? "من نحن" : "Qui sommes-nous"}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">
              {isAr ? "معايير الجودة لدينا" : "NOTRE STANDARD DE QUALITÉ"}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-sm md:text-base leading-relaxed text-slate-500 font-medium"
          >
            {isAr 
              ? "تأسست نونو تليكوم من قبل مهندسين وفنيين في إصلاح الهواتف الذكية لحل أزمة إمداد قطع الغيار ذات الجودة الرديئة. نحن نوفر للمصلحين المستقلين والموزعين مكونات ذات درجة احترافية تم اختبارها وضمانها."
              : "Nounou Telecom a été fondé par des ingénieurs et techniciens en réparation de smartphones pour résoudre la crise d'approvisionnement en pièces de mauvaise qualité. Nous fournissons aux réparateurs indépendants et distributeurs des composants de grade professionnel testés et garantis."
            }
          </motion.p>
        </section>

        {/* Quality Standards / Steps */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-brand-card border border-gray-200 rounded-[24px] p-8 shadow-md shadow-gray-200/50 hover:border-brand-primary/20 transition-all duration-300 flex flex-col space-y-4"
            >
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-[16px] w-fit">
                {step.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">{step.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{step.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Our Laboratory section */}
        <section className="bg-brand-card rounded-[32px] border border-gray-200 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
                {isAr ? "التشخيص والموثوقية" : "Diagnostic & Fiabilité"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase">
                {isAr ? "أداء العتاد الحقيقي الأصلي" : "LE COMPORTEMENT DU VRAI MATÉRIEL"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              {isAr 
                ? "يتم اختبار كل دفعة مستوردة في مستودعاتنا يدويًا. هدفنا هو خفض معدل الإرجاع إلى أقل من 0.5%. نوفر بطاريات بديلة بدورات شحن جديدة (صفر دورة) وفلكسات توصيل مزودة بفلاتر حماية من الجهد الزائد لحماية اللوحات الأم لعملائك."
                : "Chaque lot importé dans nos entrepôts est testé manuellement. Notre objectif est de ramener le taux de retour sous la barre des 0,5%. Nous fournissons des batteries de rechange à cycles de charge vierges (zéro-cycle) et des nappes de connecteurs dotées de filtres de surtension pour protéger les cartes mères de vos clients."
              }
            </p>
            <ul className="space-y-3.5 text-xs font-bold text-slate-700">
              <li className="flex items-center space-x-2.5">
                <CheckCircle size={15} className="text-brand-primary" />
                <span>
                  {isAr ? "ضمان مدى الحياة على الشاشات (أعطال اللمس والشاشة)" : "Garantie à vie sur les écrans (défaut tactile et afficheur)"}
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle size={15} className="text-brand-primary" />
                <span>
                  {isAr ? "حماية حرارية معتمدة على بطاريات الليثيوم أيون" : "Protection thermique certifiée sur les batteries Li-ion"}
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle size={15} className="text-brand-primary" />
                <span>
                  {isAr ? "دعم فني مباشر وقوائم أسعار B2B مرنة" : "Support direct technicien et grilles de tarifs B2B flexibles"}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="h-[250px] sm:h-[350px] rounded-[24px] overflow-hidden relative shadow-lg shadow-gray-200/50 border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800&auto=format&fit=crop"
              alt="Laboratoire de Réparation"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent" />
          </div>
        </section>

        {/* Commitment Statement */}
        <section className="text-center max-w-2xl mx-auto py-8">
          <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-[20px] flex items-center space-x-4 text-left">
            <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isAr ? "شراكة ثقة" : "Un Partenariat de Confiance"}
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                {isAr 
                  ? "نحن ملتزمون بشحن طلباتكم في وقت قياسي مع تغليف معزز لتجنب أي أضرار أثناء النقل البري."
                  : "Nous nous engageons à expédier vos commandes en un temps record avec un emballage renforcé pour éviter tout sinistre de transport routier."
                }
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
