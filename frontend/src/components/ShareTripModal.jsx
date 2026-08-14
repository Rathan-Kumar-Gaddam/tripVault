import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Send, 
  QrCode, 
  Users, 
  Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareTripModal({ trip, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trip) return null;

  const tripId = trip._id;
  const inviteUrl = `${window.location.origin}/join/${tripId}`;
  const shareText = `Join my trip vault "${trip.name}" on TripVault to track expenses, live balances, and settle debts: ${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Trip link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TripVault: ${trip.name}`,
          text: shareText,
          url: inviteUrl,
        });
        toast.success('Shared successfully! 🚀');
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`Join my trip "${trip.name}" on TripVault!`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Share2 size={22} />
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 font-heading">
            Share Trip Vault
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite travel companions to track shared expenses and view passbook balances together.
          </p>
        </div>

        {/* Copy Link Input Box */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
          <input 
            type="text" 
            readOnly 
            value={inviteUrl}
            className="bg-transparent text-xs font-semibold text-slate-700 truncate w-full outline-none select-all"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl text-xs border border-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageCircle size={16} className="text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-2xl text-xs border border-sky-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send size={15} className="text-sky-600" />
            <span>Telegram</span>
          </button>
        </div>

        {/* Native Mobile Share Button */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
        >
          <Share2 size={15} />
          <span>More Share Options</span>
        </button>
      </div>
    </div>
  );
}
