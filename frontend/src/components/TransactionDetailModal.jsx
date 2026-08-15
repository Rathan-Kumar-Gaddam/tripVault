import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Calendar, 
  Clock, 
  CreditCard, 
  Users, 
  User, 
  HandCoins, 
  Tag, 
  AlertTriangle,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getCategoryMeta } from '../utils/categoryUtils';

export default function TransactionDetailModal({ 
  transaction, 
  isOpen, 
  onClose, 
  onDelete, 
  currency = '₹', 
  currentUser,
  isAdmin 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  const isSettlement = transaction.type === 'settlement';
  const meta = getCategoryMeta(transaction.category || (isSettlement ? 'Settlement' : 'Other'));
  const emoji = meta.emoji;
  const payerName = transaction.payer?.name || 'Unknown';
  const isPayerMe = (transaction.payer?._id || transaction.payer) === currentUser?._id;
  const canDelete = isAdmin || (transaction.createdBy?._id || transaction.createdBy) === currentUser?._id;

  const dateObj = new Date(transaction.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(transaction._id);
      onClose();
    } catch (err) {
      toast.error('Failed to delete transaction.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col gap-5"
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              isSettlement ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (meta.theme?.badge || 'bg-indigo-100 text-indigo-800 border-indigo-200')
            }`}>
              {isSettlement ? 'Settlement' : (transaction.category || 'Expense')}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Title & Amount */}
        <div className="text-center py-2 border-b border-slate-100">
          <h3 className="text-xl font-extrabold text-slate-900 font-heading mb-1">
            {transaction.description || 'Untitled Transaction'}
          </h3>
          <div className="text-3xl font-black text-slate-900 tracking-tight font-heading flex items-center justify-center gap-1">
            <span className="text-indigo-600 font-bold">{currency}</span>
            <span>{transaction.amount?.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-400 text-xs mt-2 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formattedTime}
            </span>
          </div>
        </div>

        {/* Payer Info */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md overflow-hidden">
              {transaction.payer?.avatar ? (
                <img src={transaction.payer.avatar} alt={payerName} className="w-full h-full object-cover" />
              ) : (
                payerName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid In Full By</p>
              <p className="font-extrabold text-slate-900 text-sm">
                {payerName} {isPayerMe ? '(You)' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-emerald-600 font-heading">
              {currency}{transaction.amount?.toFixed(2)}
            </p>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              Full Payment
            </span>
          </div>
        </div>

        {/* Splits Breakdown */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={13} className="text-indigo-600" />
              <span>{isSettlement ? 'Settlement Recipient' : 'Split Breakdown'}</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-bold">
              {(transaction.splits || []).length} {isSettlement ? 'Recipient' : 'Members'}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 space-y-2">
            {(transaction.splits || []).map((s, idx) => {
              const splitUser = s.user || {};
              const sName = splitUser.name || 'Companion';
              const isMe = (splitUser._id || splitUser) === currentUser?._id;
              return (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                      {sName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-800">
                      {sName} {isMe ? '(You)' : ''}
                    </span>
                  </div>
                  <div className="font-black text-slate-900 font-heading">
                    {currency}{s.amount?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Confirmation or Actions */}
        {canDelete && (
          <div className="pt-2">
            {showDeleteConfirm ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                  <AlertTriangle size={16} />
                  <span>Delete this transaction permanently?</span>
                </div>
                <p className="text-[11px] text-rose-600">
                  This will reverse all associated debt shares and recalculate live balances for everyone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-white text-slate-700 font-bold rounded-xl text-xs border border-slate-200"
                  >
                    Keep Transaction
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 flex items-center justify-center gap-1 shadow-md shadow-rose-600/25"
                  >
                    <Trash2 size={13} />
                    <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 size={14} />
                <span>Delete Transaction</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
