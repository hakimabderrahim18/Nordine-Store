import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, CheckCircle, ShieldAlert, Truck, CreditCard } from 'lucide-react';

export default function FAQ() {
  const [activeIdx, setActiveIdx] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Toutes les Questions' },
    { id: 'quality', label: 'Qualité & Pièces', icon: <CheckCircle size={14} /> },
    { id: 'b2b', label: 'Tarifs B2B & Gros', icon: <ShieldAlert size={14} /> },
    { id: 'shipping', label: 'Expédition & Wilayas', icon: <Truck size={14} /> },
    { id: 'payment', label: 'Paiements & Retours', icon: <CreditCard size={14} /> }
  ];

  const faqs = [
    {
      category: 'quality',
      question: "Quelle est la différence entre un Service Pack Original et de l'OEM ?",
      answer: "Les pièces estampillées 'Service Pack Original' proviennent directement des centres officiels des constructeurs (Samsung, Apple, Xiaomi, etc.) sous emballage certifié. Les pièces 'Premium OEM' sont fabriquées selon un cahier des charges rigoureux par des tiers qualifiés utilisant des dalles et circuits de même niveau de performance pour offrir un rapport qualité-prix optimal."
    },
    {
      category: 'quality',
      question: "Comment fonctionne la garantie à vie sur les dalles d'affichage ?",
      answer: "Tous nos écrans tactiles et afficheurs bénéficient d'une garantie à vie limitée. Elle couvre les pannes tactiles et d'affichage, sous réserve que la pièce ne présente aucune trace de casse physique, d'oxydation, de nappe déchirée ou de mauvaise installation. Les films de protection ne doivent pas être retirés avant les tests préalables."
    },
    {
      category: 'b2b',
      question: "Comment puis-je bénéficier des tarifs de Demi-Gros ou de Super-Gros ?",
      answer: "Lors de la création de votre compte, vous pouvez indiquer votre profil de client (Technicien indépendant, Atelier de réparation, Distributeur). Les tarifs de Gros (Demi-Gros / Super-Gros) sont automatiquement appliqués sur l'ensemble du catalogue dès lors que votre compte est validé par notre équipe commerciale ou que votre panier atteint les seuils minimums requis."
    },
    {
      category: 'b2b',
      question: "Combien de temps prend la validation d'un compte professionnel ?",
      answer: "Une fois votre inscription finalisée avec les détails de votre atelier ou entreprise, notre service commercial valide votre dossier sous 2 à 4 heures ouvrables. Vous recevrez un e-mail de confirmation et votre grille tarifaire B2B sera activée instantanément sur la boutique."
    },
    {
      category: 'shipping',
      question: "Quelles sont les options d'expédition disponibles pour l'Algérie ?",
      answer: "Nous collaborons avec Yalidine pour couvrir l'intégralité des 58 wilayas. Deux formules vous sont proposées : la livraison à domicile (directement à votre atelier ou domicile) et la livraison StopDesk (retrait dans le bureau Yalidine le plus proche de chez vous), cette dernière étant généralement plus rapide et économique."
    },
    {
      category: 'shipping',
      question: "Quel est le délai de livraison moyen ?",
      answer: "Les commandes validées avant 15h00 sont expédiées le jour même. Les délais indicatifs sont de 24 à 48 heures pour les grandes wilayas (Alger, Oran, Constantine, Sétif) et de 48 à 72 heures pour les wilayas du Sud et zones éloignées."
    },
    {
      category: 'payment',
      question: "Proposez-vous le paiement à la livraison (Cash on Delivery) ?",
      answer: "Oui, le paiement en espèces à la livraison est disponible pour toutes les wilayas d'Algérie, que ce soit en livraison à domicile ou au niveau des bureaux de retrait Yalidine (StopDesk). Vous inspectez le colis à la réception et réglez le livreur."
    },
    {
      category: 'payment',
      question: "Quelle est la politique de retour pour les pièces défectueuses ?",
      answer: "Si un composant présente un défaut d'usine constaté au moment des tests avant pose, vous pouvez initier un retour depuis votre compte client. Après validation par notre labo technique, un avoir ou une pièce de remplacement vous sera attribué immédiatement. Les retours doivent être effectués sous 15 jours ouvrables."
    }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (index) => {
    setActiveIdx(activeIdx === index ? null : index);
  };

  return (
    <div className="pt-32 pb-24 bg-brand-bg text-left min-h-screen text-slate-500">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* Title / Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Centre de Support</span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">
            QUESTIONS FRÉQUENTES
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            Retrouvez les réponses à toutes vos questions concernant la qualité de nos écrans, nos grilles de tarifs professionnels et nos modalités de livraison dans toutes les wilayas.
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
                    className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
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
              Aucune question ne correspond à cette catégorie.
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="p-6 bg-gray-50/50 border border-gray-200 rounded-[24px] text-center max-w-lg mx-auto space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Vous ne trouvez pas votre réponse ?</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Notre support technique et commercial est à votre écoute pour vous aider sur vos commandes de gros ou demandes de garanties spécifiques.
          </p>
          <a
            href="/contact"
            className="inline-block bg-transparent border border-gray-200 hover:bg-gray-50 text-brand-primary hover:border-brand-primary font-black text-xs uppercase tracking-wider px-5 py-3 rounded-[12px] transition-all cursor-pointer"
          >
            Contacter Notre Labo
          </a>
        </div>

      </div>
    </div>
  );
}
