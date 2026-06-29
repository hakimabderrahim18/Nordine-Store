import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Bell, ShoppingBag, AlertTriangle, CheckCheck, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../services/api';

// Simple French relative time formatter
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHr < 24) return `Il y a ${diffHr} h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Pure JS synthesis for a clean double-ding notification chime
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(987.77, now, 0.15); // B5 note
    playTone(1318.51, now + 0.08, 0.35); // E6 note
  } catch (err) {
    console.warn('AudioContext sound blocked or unsupported:', err);
  }
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        const unread = res.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Socket.io connection setup
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';

    const socket = io(backendUrl, {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected to admin client');
      socket.emit('joinAdminRoom');
    });

    socket.on('newOrder', (data) => {
      console.log('Real-time order notification received:', data);
      
      // Trigger Audio Alert
      playChime();

      // Trigger beautiful hot toast alert
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[24px] pointer-events-auto flex ring-1 ring-black/5 border border-slate-100 overflow-hidden text-left`}>
          <div className="flex-1 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-[16px] bg-brand-primary/10 flex items-center justify-center text-slate-900 border border-brand-primary/20">
                  <ShoppingBag size={20} className="animate-bounce" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Nouvelle Commande !
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  {data.customerName} vient de commander ({data.totalPrice?.toLocaleString()} DA)
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-100">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Redirect user to orders panel if needed
                window.location.href = `/admin/orders`;
              }}
              className="w-full border border-transparent rounded-none rounded-r-[24px] p-4 flex items-center justify-center text-xs font-black text-brand-primary hover:text-slate-950 focus:outline-none uppercase tracking-wider"
            >
              Voir
            </button>
          </div>
        </div>
      ), { duration: 6000 });

      // Refresh notifications list
      fetchNotifications();

      // Broadcast event so other pages (like Dashboard stats) can refresh automatically
      window.dispatchEvent(new Event('newOrderReceived'));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleReadAll = async () => {
    try {
      const res = await notificationService.readAll();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('Toutes les notifications ont été marquées comme lues');
      }
    } catch (err) {
      console.error('Error reading all notifications:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Voulez-vous supprimer définitivement toutes les notifications ?')) return;
    try {
      const res = await notificationService.clearAll();
      if (res.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('Toutes les notifications ont été supprimées');
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={14} className="text-slate-800" />;
      case 'alert':
        return <ShieldAlert size={14} className="text-red-650" />;
      default:
        return <AlertTriangle size={14} className="text-amber-600" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'order':
        return 'bg-brand-primary/10 border border-brand-primary/20';
      case 'alert':
        return 'bg-red-50 border border-red-150';
      default:
        return 'bg-amber-50 border border-amber-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-slate-900 rounded-[14px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200 cursor-pointer focus:outline-none"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 shadow-2xl rounded-[24px] z-50 overflow-hidden text-left origin-top-right transition-transform">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-brand-primary/20 text-slate-955 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  className="text-[10px] font-black text-brand-primary hover:text-slate-955 uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors duration-150 focus:outline-none"
                >
                  <CheckCheck size={12} className="mr-0.5" />
                  Tout lire
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] font-black text-red-500 hover:text-red-750 uppercase tracking-wider cursor-pointer transition-colors duration-150 focus:outline-none"
                >
                  Tout effacer
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Bell size={32} className="stroke-[1.5] mb-2 opacity-50" />
                <span className="text-[11px] font-semibold">Aucune notification</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                  className={`p-4 flex items-start space-x-3 transition-colors duration-250 cursor-pointer ${
                    notification.isRead ? 'hover:bg-slate-50/40' : 'bg-brand-primary/5 hover:bg-brand-primary/10'
                  }`}
                >
                  {/* Category icon */}
                  <div className={`p-2 rounded-[12px] flex-shrink-0 ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${notification.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed break-words">
                      {notification.message}
                    </p>
                    <div className="mt-1.5 flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                      <Clock size={10} className="mr-1" />
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
