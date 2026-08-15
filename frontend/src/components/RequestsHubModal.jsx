import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  ShieldCheck, 
  HandCoins, 
  HelpCircle, 
  Check, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react';

export default function RequestsHubModal({
  isOpen,
  onClose,
  tripName,
  currency = '₹',
  user,
  fundRequests = [],
  onRespond,
  onCancel,
  respondingId,
}) {
  const [activeTab, setActiveTab] = useState('action'); // 'action' | 'outgoing' | 'history'

  if (!isOpen) return null;

  const currentUserIdStr = user?._id?.toString();

  // 1. Action Required Requests (Current user must act)
  const actionRequiredRequests = (fundRequests || []).filter((r) => {
    const targetId = (r.targetUser?._id || r.targetUser)?.toString();
    const reqId = (r.requester?._id || r.requester)?.toString();

    if (r.requestType === 'fund_request' && r.status === 'pending' && targetId === currentUserIdStr) return true;
    if (r.requestType === 'fund_request' && r.status === 'payment_sent' && reqId === currentUserIdStr) return true;
    if (r.requestType === 'settlement' && r.status === 'pending' && targetId === currentUserIdStr) return true;
    return false;
  });

  // 2. Pending Outgoing Requests (Current user is waiting on companion)
  const outgoingRequests = (fundRequests || []).filter((r) => {
    const targetId = (r.targetUser?._id || r.targetUser)?.toString();
    const reqId = (r.requester?._id || r.requester)?.toString();

    if (r.requestType === 'fund_request' && r.status === 'pending' && reqId === currentUserIdStr) return true;
    if (r.requestType === 'fund_request' && r.status === 'payment_sent' && targetId === currentUserIdStr) return true;
    if (r.requestType === 'settlement' && r.status === 'pending' && reqId === currentUserIdStr) return true;
    return false;
  });

  // 3. Resolved / Completed History
  const historyRequests = (fundRequests || []).filter((r) => 
    r.status === 'accepted' || r.status === 'declined' || r.status === 'cancelled'
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <Bell size={20} />
              {actionRequiredRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white">
                  {actionRequiredRequests.length}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                Requests & Notifications Hub
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[240px]">
                {tripName || 'Trip Vault'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('action')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'action'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Action Required</span>
            {actionRequiredRequests.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {actionRequiredRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'outgoing'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pending Outgoing</span>
            {outgoingRequests.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {outgoingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Activity Log</span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 no-scrollbar">
          
          {/* TAB 1: ACTION REQUIRED */}
          {activeTab === 'action' && (
            <>
              {actionRequiredRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">You're All Caught Up!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    No pending fund requests or settlements need your action right now.
                  </p>
                </div>
              ) : (
                actionRequiredRequests.map((req) => {
                  const isSettlement = req.requestType === 'settlement';
                  const isPaymentSentConfirmation = req.requestType === 'fund_request' && req.status === 'payment_sent';

                  return (
                    <div 
                      key={req._id}
                      className={`border-2 rounded-[2rem] p-4 sm:p-5 shadow-md flex flex-col gap-3.5 transition-all ${
                        isPaymentSentConfirmation
                          ? 'bg-gradient-to-tr from-purple-50/80 to-indigo-50/60 border-purple-300'
                          : isSettlement
                            ? 'bg-gradient-to-tr from-emerald-50/80 to-teal-50/60 border-emerald-300'
                            : 'bg-gradient-to-tr from-amber-50/80 to-orange-50/60 border-amber-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${
                          isPaymentSentConfirmation 
                            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white' 
                            : isSettlement 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-amber-500 text-white'
                        }`}>
                          {isPaymentSentConfirmation ? <ShieldCheck size={20} /> : isSettlement ? <HandCoins size={20} /> : <HelpCircle size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isPaymentSentConfirmation 
                                ? 'bg-purple-200 text-purple-900' 
                                : isSettlement 
                                  ? 'bg-emerald-200 text-emerald-900' 
                                  : 'bg-amber-200 text-amber-900'
                            }`}>
                              {isPaymentSentConfirmation 
                                ? 'Confirm Funds Received' 
                                : isSettlement 
                                  ? 'Settlement Verification' 
                                  : 'Incoming Fund Request'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDate(req.createdAt)}
                            </span>
                          </div>

                          <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                            {isPaymentSentConfirmation ? (
                              <>
                                {req.targetUser?.name} marked <span className="text-purple-700 font-black">{currency}{req.amount.toFixed(2)}</span> as sent
                              </>
                            ) : isSettlement ? (
                              <>
                                {req.requester?.name} sent <span className="text-emerald-700 font-black">{currency}{req.amount.toFixed(2)}</span> settlement
                              </>
                            ) : (
                              <>
                                {req.requester?.name} is asking for <span className="text-amber-700 font-black">{currency}{req.amount.toFixed(2)}</span>
                              </>
                            )}
                          </h3>

                          <p className="text-xs text-slate-600 font-medium mt-0.5 italic">
                            "{req.description}"
                          </p>

                          <p className="text-[11px] font-semibold mt-1 text-slate-700">
                            {isPaymentSentConfirmation && (
                              <span className="text-purple-900">
                                💡 Please check your UPI / Bank account. Click confirm once received to log the expense.
                              </span>
                            )}
                            {isSettlement && (
                              <span className="text-emerald-800">
                                Verify you received {currency}{req.amount.toFixed(2)} before confirming.
                              </span>
                            )}
                            {!isPaymentSentConfirmation && !isSettlement && (
                              <span className="text-amber-900">
                                Transfer to {req.requester?.name} via UPI/Cash and mark as sent.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-black/5">
                        {isPaymentSentConfirmation ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'not_received', req.targetUser?.name, req.amount, 'fund_request')}
                              disabled={respondingId === req._id}
                              className="flex-1 py-2.5 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Not Received
                            </button>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'confirm_receipt', req.targetUser?.name, req.amount, 'fund_request')}
                              disabled={respondingId === req._id}
                              className="flex-2 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 px-4"
                            >
                              <Check size={16} strokeWidth={3} />
                              <span>
                                {respondingId === req._id ? 'Logging...' : `Confirm Receipt (${currency}${req.amount.toFixed(2)})`}
                              </span>
                            </button>
                          </>
                        ) : isSettlement ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'decline', req.requester?.name, req.amount, 'settlement')}
                              disabled={respondingId === req._id}
                              className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'confirm_receipt', req.requester?.name, req.amount, 'settlement')}
                              disabled={respondingId === req._id}
                              className="flex-1 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700"
                            >
                              <Check size={16} strokeWidth={3} />
                              <span>
                                {respondingId === req._id ? 'Verifying...' : `Confirm Receipt (${currency}${req.amount.toFixed(2)})`}
                              </span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'decline', req.requester?.name, req.amount, 'fund_request')}
                              disabled={respondingId === req._id}
                              className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => onRespond(req._id, 'mark_sent', req.requester?.name, req.amount, 'fund_request')}
                              disabled={respondingId === req._id}
                              className="flex-2 py-2.5 text-white font-extrabold rounded-xl text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 px-4"
                            >
                              <Send size={14} strokeWidth={2.5} />
                              <span>
                                {respondingId === req._id ? 'Updating...' : `I Transferred ${currency}${req.amount.toFixed(2)} (Mark Sent)`}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: PENDING OUTGOING */}
          {activeTab === 'outgoing' && (
            <>
              {outgoingRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                    <Clock size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Outgoing Pending Requests</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    You have no active requests waiting on companion response.
                  </p>
                </div>
              ) : (
                outgoingRequests.map((req) => {
                  const isSettlement = req.requestType === 'settlement';
                  const isFunderWaiting = req.requestType === 'fund_request' && req.status === 'payment_sent';
                  const isRequesterWaiting = req.requestType === 'fund_request' && req.status === 'pending';

                  return (
                    <div 
                      key={req._id}
                      className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{isFunderWaiting ? '💸' : '⏳'}</span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {isFunderWaiting ? (
                                <>Payment of <strong>{currency}{req.amount.toFixed(2)}</strong> sent to {req.requester?.name}</>
                              ) : isSettlement ? (
                                <>Settlement of <strong>{currency}{req.amount.toFixed(2)}</strong> sent to {req.targetUser?.name}</>
                              ) : (
                                <>Requested <strong>{currency}{req.amount.toFixed(2)}</strong> from {req.targetUser?.name}</>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              "{req.description}" • {formatDate(req.createdAt)}
                            </p>
                          </div>
                        </div>

                        {isRequesterWaiting && (
                          <button
                            type="button"
                            onClick={() => onCancel(req._id)}
                            className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 shrink-0 active:scale-95 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div className="bg-white/80 p-2 rounded-xl text-[11px] font-semibold text-indigo-700 flex items-center gap-1.5 border border-slate-200/50">
                        <Clock size={12} />
                        <span>
                          {isFunderWaiting 
                            ? `Waiting for ${req.requester?.name} to verify & confirm receipt`
                            : isSettlement 
                              ? `Waiting for ${req.targetUser?.name} to verify receipt`
                              : `Waiting for ${req.targetUser?.name} to transfer funds`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 3: ACTIVITY LOG */}
          {activeTab === 'history' && (
            <>
              {historyRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Past Request History</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Completed and resolved requests will appear here.
                  </p>
                </div>
              ) : (
                historyRequests.map((req) => {
                  const isAccepted = req.status === 'accepted';
                  const isDeclined = req.status === 'declined';
                  
                  return (
                    <div 
                      key={req._id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isAccepted 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : isDeclined 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isAccepted ? <Check size={16} /> : isDeclined ? <X size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {req.requester?.name} • <strong className="text-slate-800">{currency}{req.amount.toFixed(2)}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            "{req.description}" • {formatDate(req.updatedAt || req.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        isAccepted 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : isDeclined 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
