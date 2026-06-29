import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function WhatsAppButton() {
  const phoneNumber = '213550082685';
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      title="Discuter sur WhatsApp"
    >
      {/* Pulse rings */}
      <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping opacity-75 pointer-events-none" />
      
      {/* Icon */}
      <svg
        className="w-6 h-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436.002 9.858-4.42 9.86-9.864.001-2.636-1.02-5.11-2.871-6.963C16.612 1.93 14.135.912 11.5.912c-5.438 0-9.861 4.417-9.863 9.861-.001 1.77.463 3.5 1.34 5.02L2.01 21.905l6.19-1.625.447.264zm10.297-7.14c-.266-.134-1.57-.775-1.814-.863-.243-.089-.42-.134-.595.134-.176.268-.68.864-.834 1.04-.155.178-.309.2-.575.067-.266-.134-1.126-.415-2.145-1.325-.793-.707-1.329-1.58-1.485-1.848-.155-.266-.016-.41.118-.543.12-.12.266-.312.4-.468.132-.156.176-.268.264-.446.089-.178.045-.335-.022-.469-.067-.134-.595-1.432-.814-1.962-.213-.515-.447-.446-.595-.446-.145-.004-.31-.004-.475-.004-.165 0-.433.063-.66.312-.226.249-.863.844-.863 2.057 0 1.213.882 2.383 1.003 2.55.122.167 1.737 2.653 4.207 3.717.587.253 1.047.404 1.405.518.59.188 1.128.161 1.553.097.473-.07 1.57-.642 1.792-1.261.221-.62.221-1.15.155-1.261-.067-.11-.243-.178-.509-.312z" />
      </svg>
    </a>
  );
}
