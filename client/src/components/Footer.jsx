import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, ShieldCheck, Facebook, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-24 bg-gray-50 text-slate-500 overflow-hidden border-t border-gray-200">
      {/* Background Animated Glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] -bottom-48 -left-48 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[100px] top-12 -right-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Description */}
        <div className="flex flex-col space-y-5">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 select-none group text-left">
            <img src="/01.svg" alt="Nounou Telecom Logo" className="h-8 w-auto object-contain" />
            <span className="font-black text-xs sm:text-sm md:text-base tracking-[0.12em] sm:tracking-[0.15em] text-slate-800 whitespace-nowrap">
              NOUNOU<span className="text-brand-primary"> TELECOM</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-slate-500 text-left">
            Le dépôt de matériel haut de gamme fournissant des écrans de rechange mobiles, des batteries, des circuits et des accessoires de qualité supérieure.
          </p>
          <div className="flex space-x-3 pt-2">
            <a href="https://www.facebook.com/share/1UAZUrx7Fh/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all duration-300">
              <Facebook size={13} />
            </a>
            <a href="https://www.instagram.com/nounoutelecomtiaret?igsh=ZGUzMzM3NWJiOQ==" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all duration-300">
              <Instagram size={13} />
            </a>
            <a href="https://www.tiktok.com/@nounoutelecomtiaret?_r=1&_t=ZS-954VXoWiF6t" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all duration-300 text-[10px] font-black">
              T
            </a>
          </div>
        </div>

        {/* Sitemap / Quick Links */}
        <div className="text-left">
          <h4 className="text-slate-800 font-bold text-xs tracking-wider uppercase mb-5">Liens Rapides</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/shop" className="hover:text-brand-primary transition-colors">Parcourir les produits</Link></li>
            <li><Link to="/about" className="hover:text-brand-primary transition-colors">Notre Standard</Link></li>
            <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Support Technique</Link></li>
            <li><Link to="/faq" className="hover:text-brand-primary transition-colors">Aide & FAQ</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="text-left">
          <h4 className="text-slate-800 font-bold text-xs tracking-wider uppercase mb-5">Support & Politique</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/profile" className="hover:text-brand-primary transition-colors">Mon Profil</Link></li>
            <li><Link to="/orders" className="hover:text-brand-primary transition-colors">Suivi de Commande</Link></li>
            <li><a href="#return-policy" className="hover:text-brand-primary transition-colors">Politique de Retour</a></li>
            <li><a href="#warranty" className="hover:text-brand-primary transition-colors">Garantie à Vie</a></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="flex flex-col space-y-3.5 text-left">
          <h4 className="text-slate-800 font-bold text-xs tracking-wider uppercase mb-1.5">Siège Social</h4>
          <a
            href="https://maps.app.goo.gl/4NvyMuBrLTtcVBnP6"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start space-x-2.5 text-xs text-slate-500 hover:text-brand-primary transition-colors"
          >
            <MapPin size={15} className="text-brand-primary mt-0.5 flex-shrink-0" />
            <span>15 Rue Emir Abd El Kader, Tiaret, Algérie</span>
          </a>
          <a
            href="tel:0550082685"
            className="flex items-center space-x-2.5 text-xs text-slate-500 hover:text-brand-primary transition-colors"
          >
            <Phone size={15} className="text-brand-primary flex-shrink-0" />
            <span>0550 08 26 85</span>
          </a>
          <a
            href="mailto:nounoutelecomtiaret@gmail.com"
            className="flex items-center space-x-2.5 text-xs text-slate-500 hover:text-brand-primary transition-colors"
          >
            <Mail size={15} className="text-brand-primary flex-shrink-0" />
            <span>nounoutelecomtiaret@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Copy and badges */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 relative z-10 gap-4">
        <p>© 2026 Nounou Telecom. Tous droits réservés. Destiné aux techniciens certifiés.</p>
        <div className="flex items-center space-x-2 text-slate-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
          <ShieldCheck size={13} className="text-brand-primary" />
          <span>Commande Sécurisée SSL 256-bit</span>
        </div>
      </div>
    </footer>
  );
}
