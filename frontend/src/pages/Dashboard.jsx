import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTripStore, { computeBilateralDebts } from '../store/useTripStore';
import { 
  WalletCards, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Users, 
  History, 
  Sparkles, 
  ShieldCheck, 
  HandCoins, 
  Receipt,
  ArrowRight,
  CheckCircle2,
  X,
  Send,
  AlertCircle,
  HelpCircle,
  Bell,
  Check,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    user, 
    currentTrip, 
    transactions, 
    fundRequests, 
    fetchTripDetails, 
    logTransaction, 
    createFundRequest, 
    respondToFundRequest, 
    cancelFundRequest, 
    isLoading 
  } = useTripStore();

  // Quick Settle Modal State
  const [settleTarget, setSettleTarget] = useState(null); // { user, amount, status }
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Ask Funds Modal State
  const [showAskModal, setShowAskModal] = useState(false);
  const [askTargetUser, setAskTargetUser] = useState('');
  const [askAmount, setAskAmount] = useState('');
  const [askReason, setAskReason] = useState('');
  const [askCategory, setAskCategory] = useState('Food & Dining');
  const [isAsking, setIsAsking] = useState(false);

  // Responding state for incoming requests
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    fetchTripDetails(id);
  }, [id]);

  if (isLoading || !currentTrip) return (
    <div className="p-10 flex flex-col items-center justify-center h-full text-slate-400 gap-3 min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="font-semibold text-xs animate-pulse">Calculating live passbook & balances...</p>
    </div>
  );

  const currency = currentTrip.currency || '₹';
  const members = currentTrip.members || [];
  const myData = members.find(m => (m.user?._id || m.user) === user?._id);
  const isAdmin = myData?.role === 'admin';

  // Compute exact P2P bilateral balances
  const { 
    totalYouAreOwed, 
    totalYouOwe, 
    netPosition, 
    companionDebts 
  } = computeBilateralDebts(members, transactions, user?._id);

  // Incoming and Outgoing Fund Requests
  const incomingRequests = (fundRequests || []).filter(
    (r) => (r.targetUser?._id || r.targetUser) === user?._id && r.status === 'pending'
  );

  const outgoingRequests = (fundRequests || []).filter(
    (r) => (r.requester?._id || r.requester) === user?._id && r.status === 'pending'
  );

  // Group trip stats
  const totalTripSpend = transactions
    ?.filter(t => t.type === 'expense')
    ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const totalTransactionsCount = transactions?.length || 0;

  // Open Quick Settle Modal
  const handleOpenSettleModal = (companion) => {
    setSettleTarget(companion);
    setSettleAmount(companion.amount ? companion.amount.toString() : '');
  };

  // Confirm Quick Settle
  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!settleTarget || isSettling) return;

    const numAmount = Number(settleAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid settlement amount.');
      return;
    }

    const targetUserId = settleTarget.user?._id || settleTarget.user;
    const isPayingThem = settleTarget.status === 'you_owe';
    const payer = isPayingThem ? user?._id : targetUserId;
    const recipient = isPayingThem ? targetUserId : user?._id;

    try {
      setIsSettling(true);
      await logTransaction({
        tripId: id,
        type: 'settlement',
        amount: numAmount,
        description: isPayingThem ? `Settlement to ${settleTarget.user?.name}` : `Settlement from ${settleTarget.user?.name}`,
        payer,
        recipient,
        sharedBy: [recipient],
        splits: [{ user: recipient, amount: numAmount }],
        category: 'Settlement',
      });

      toast.success(`Settlement of ${currency}${numAmount.toFixed(2)} recorded! 🎉`);
      setSettleTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record settlement.');
    } finally {
      setIsSettling(false);
    }
  };

  // Handle Respond to Incoming Request (Accept & Pay OR Decline)
  const handleRespondRequest = async (requestId, action, requesterName, reqAmount) => {
    if (respondingId) return;

    try {
      setRespondingId(requestId);
      await respondToFundRequest(requestId, action, id);
      if (action === 'accept') {
        toast.success(`Fund request accepted! Covered ${currency}${reqAmount} for ${requesterName}. 🎉`);
      } else {
        toast('Fund request declined.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setRespondingId(null);
    }
  };

  // Handle Cancel Outgoing Request
  const handleCancelRequest = async (requestId) => {
    try {
      await cancelFundRequest(requestId, id);
      toast.success('Fund request cancelled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  // Handle Submit Ask Funds
  const handleSubmitAskFunds = async (e) => {
    e.preventDefault();
    if (isAsking) return;

    const numAmount = Number(askAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (!askTargetUser) {
      toast.error('Please select which companion to ask.');
      return;
    }

    if (!askReason.trim()) {
      toast.error('Please provide a reason or note.');
      return;
    }

    try {
      setIsAsking(true);
      await createFundRequest({
        tripId: id,
        targetUser: askTargetUser,
        amount: numAmount,
        description: askReason.trim(),
        category: askCategory,
      });

      toast.success('Request sent to companion! 📩');
      setShowAskModal(false);
      setAskAmount('');
      setAskReason('');
      setAskTargetUser('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="p-6 pb-28">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate font-heading">
              {currentTrip.name}
            </h1>
            {isAdmin && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            Trip Spend: <strong className="text-rose-600 font-bold">-{currency}{totalTripSpend.toFixed(2)}</strong>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>{totalTransactionsCount} {totalTransactionsCount === 1 ? 'activity' : 'activities'}</span>
          </p>
        </div>

        <button 
          onClick={() => navigate('/profile')} 
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform border-2 border-white shrink-0"
          title="My Profile"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
          )}
        </button>
      </header>

      {/* ===================== INCOMING FUND REQUESTS BANNER ===================== */}
      {incomingRequests.length > 0 && (
        <div className="mb-6 space-y-3">
          {incomingRequests.map((req) => (
            <div 
              key={req._id}
              className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border-2 border-amber-400/60 rounded-3xl p-4 shadow-lg shadow-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-sm font-black shrink-0 overflow-hidden shadow-md">
                  {req.requester?.avatar ? (
                    <img src={req.requester.avatar} alt={req.requester.name} className="w-full h-full object-cover" />
                  ) : (
                    req.requester?.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <Bell size={10} className="animate-bounce" /> Fund Request
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                    {req.requester?.name} is asking for <span className="text-amber-700 font-black">{currency}{req.amount.toFixed(2)}</span>
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 italic">
                    "{req.description}"
                  </p>
                </div>
              </div>

              {/* Action Buttons: Accept & Pay vs Decline */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRespondRequest(req._id, 'decline', req.requester?.name, req.amount)}
                  disabled={respondingId === req._id}
                  className="flex-1 py-2.5 bg-white/80 hover:bg-white text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleRespondRequest(req._id, 'accept', req.requester?.name, req.amount)}
                  disabled={respondingId === req._id}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Check size={14} strokeWidth={3} />
                  <span>{respondingId === req._id ? 'Processing...' : `Accept & Pay ${currency}${req.amount.toFixed(2)}`}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== OUTGOING PENDING REQUEST TRACKER ===================== */}
      {outgoingRequests.length > 0 && (
        <div className="mb-6 space-y-2">
          {outgoingRequests.map((req) => (
            <div 
              key={req._id}
              className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base animate-pulse">⏳</span>
                <div className="min-w-0">
                  <p className="font-bold text-indigo-950 truncate">
                    Requested <strong>{currency}{req.amount.toFixed(2)}</strong> from {req.targetUser?.name}
                  </p>
                  <p className="text-[11px] text-indigo-600 truncate font-medium">
                    Waiting for approval • "{req.description}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCancelRequest(req._id)}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hero Passbook Card (Personal Net Position) */}
      <div className={`relative overflow-hidden p-6 rounded-[2.5rem] shadow-2xl text-white mb-6 transition-all ${
        netPosition > 0.01 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 shadow-emerald-600/25' 
          : netPosition < -0.01
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 shadow-slate-950/25'
            : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 shadow-indigo-600/25'
      }`}>
        <WalletCards className="absolute -right-8 -top-8 w-44 h-44 opacity-10 rotate-12 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 bg-white/20 flex items-center justify-center text-[10px] font-extrabold shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-white/80 font-bold tracking-wider text-[11px] uppercase">My Net Standing</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold border border-white/20 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-300" />
            <span>Live Passbook</span>
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm font-heading">
          {currency}{Math.abs(netPosition).toFixed(2)}
        </h2>
        
        <div className="mt-4 flex items-center gap-2">
          <div className="bg-white/15 border border-white/20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold backdrop-blur-md">
            {netPosition > 0.01 ? (
              <span className="flex items-center gap-1">🎉 You are owed overall</span>
            ) : netPosition < -0.01 ? (
              <span className="flex items-center gap-1">💸 You owe overall</span>
            ) : (
              <span className="flex items-center gap-1">✨ All settled up!</span>
            )}
          </div>
        </div>

        {/* Mini Balance Summary inside Card */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
          <div className="bg-black/10 rounded-xl p-2 flex flex-col">
            <span className="text-[10px] text-white/70 font-semibold uppercase">Owed to You</span>
            <span className="font-extrabold text-emerald-300 text-sm">{currency}{totalYouAreOwed.toFixed(2)}</span>
          </div>
          <div className="bg-black/10 rounded-xl p-2 flex flex-col">
            <span className="text-[10px] text-white/70 font-semibold uppercase">You Owe</span>
            <span className="font-extrabold text-rose-300 text-sm">{currency}{totalYouOwe.toFixed(2)}</span>
          </div>
        </div>

        {/* Ask Companion Shortcut Button in Hero Card */}
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => setShowAskModal(true)}
            className="w-full py-2 px-3 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-1.5 shadow-sm border border-white/20"
          >
            <HelpCircle size={14} className="text-amber-300" />
            <span>Low on cash? Ask a companion to cover you</span>
          </button>
        </div>
      </div>

      {/* Quick Action Pills Grid (Available to ALL members) */}
      <div className="grid grid-cols-4 gap-2 mb-7">
        <button
          onClick={() => navigate(`/trip/${id}/add-money`)}
          className="bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-slate-800">Add Expense</span>
        </button>

        <button
          onClick={() => setShowAskModal(true)}
          className="bg-amber-50 border border-amber-200/90 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-amber-300 hover:shadow-md transition-all active:scale-95 group ring-2 ring-amber-500/10"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-md shadow-amber-500/20">
            <HelpCircle size={18} />
          </div>
          <span className="text-[10px] font-black text-amber-900">Ask Funds</span>
        </button>

        <button
          onClick={() => navigate(`/trip/${id}/add-money?mode=settle`)}
          className="bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-emerald-300 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <HandCoins size={18} />
          </div>
          <span className="text-[10px] font-bold text-slate-800">Settle Up</span>
        </button>

        <button
          onClick={() => navigate(`/trip/${id}/history`)}
          className="bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-purple-300 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <History size={18} />
          </div>
          <span className="text-[10px] font-bold text-slate-800">Timeline</span>
        </button>
      </div>

      {/* ===================== PEER-TO-PEER DEBT BREAKDOWN ===================== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
              <HandCoins size={16} className="text-indigo-600" />
              <span>Personal Passbook</span>
            </h3>
            <p className="text-[11px] font-medium text-slate-400">Direct balances between you and companions</p>
          </div>
          <button 
            onClick={() => setShowAskModal(true)}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm"
          >
            <HelpCircle size={13} />
            <span>Ask Funds</span>
          </button>
        </div>

        {companionDebts.length === 0 ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-sm">
            <p className="text-xs font-semibold text-slate-400">No companions added to this trip yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {companionDebts.map((debt) => {
              const compUser = debt.user;
              const isYouOwe = debt.status === 'you_owe';
              const isOwesYou = debt.status === 'owes_you';
              const isSettled = debt.status === 'settled';

              return (
                <div 
                  key={compUser?._id || compUser} 
                  className={`bg-white p-4 rounded-3xl flex items-center justify-between gap-3 shadow-sm border transition-all ${
                    isYouOwe 
                      ? 'border-rose-100/90 hover:border-rose-300' 
                      : isOwesYou 
                        ? 'border-emerald-100/90 hover:border-emerald-300' 
                        : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white border-2 border-white shadow-sm flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {compUser?.avatar ? (
                        <img src={compUser.avatar} alt={compUser.name} className="w-full h-full object-cover" />
                      ) : (
                        compUser?.name ? compUser.name.charAt(0).toUpperCase() : <User size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{compUser?.name}</p>
                      
                      {/* Dynamic Debt Text */}
                      {isOwesYou && (
                        <p className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <span>Owes you</span>
                          <strong className="text-emerald-700 font-black">{currency}{debt.amount.toFixed(2)}</strong>
                        </p>
                      )}

                      {isYouOwe && (
                        <p className="text-xs font-extrabold text-rose-600 flex items-center gap-1 mt-0.5">
                          <span>You owe</span>
                          <strong className="text-rose-700 font-black">{currency}{debt.amount.toFixed(2)}</strong>
                        </p>
                      )}

                      {isSettled && (
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span>All settled up</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions / Settle Up & Ask Button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* Ask ₹ button for every companion */}
                    <button
                      onClick={() => { setAskTargetUser((compUser?._id || compUser)?.toString()); setShowAskModal(true); }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                      title={`Ask ${compUser?.name} for funds`}
                    >
                      <HelpCircle size={12} />
                      <span>Ask ₹</span>
                    </button>

                    {isYouOwe && (
                      <button
                        onClick={() => handleOpenSettleModal(debt)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>Settle</span>
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {isOwesYou && (
                      <button
                        onClick={() => handleOpenSettleModal(debt)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs active:scale-95 transition-all"
                      >
                        Record Paid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================== GROUP LEDGER ===================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <span>Group Standings ({members.length})</span>
          </h3>
          <button 
            onClick={() => navigate(`/trip/${id}/add-member`)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Manage
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {members.map((member) => {
            const isMemberAdmin = member.role === 'admin';
            const isSelf = (member.user?._id || member.user) === user?._id;
            const balance = member.balance || 0;
            const mUser = member.user || member;

            return (
              <div 
                key={mUser?._id || member._id} 
                className="bg-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                    {mUser?.avatar ? (
                      <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                    ) : (
                      mUser?.name ? mUser.name.charAt(0).toUpperCase() : <User size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {mUser?.name} {isSelf ? '(You)' : ''}
                      </p>
                      {isMemberAdmin && (
                        <ShieldCheck size={12} className="text-indigo-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-black text-xs tracking-tight font-heading ${
                    balance > 0.01 ? 'text-emerald-600' : (balance < -0.01 ? 'text-rose-600' : 'text-slate-400')
                  }`}>
                    {balance > 0.01 ? '+' : ''}{currency}{balance.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== QUICK SETTLE-UP MODAL ===================== */}
      {settleTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <HandCoins size={24} />
              </div>
              <button 
                onClick={() => setSettleTarget(null)}
                disabled={isSettling}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">
              {settleTarget.status === 'you_owe' ? `Pay ${settleTarget.user?.name}` : `Settle with ${settleTarget.user?.name}`}
            </h3>
            
            <p className="text-xs text-slate-500 mb-4">
              {settleTarget.status === 'you_owe' 
                ? `Record payment made to ${settleTarget.user?.name} to clear your debt.` 
                : `Record payment received from ${settleTarget.user?.name}.`}
            </p>

            <form onSubmit={handleConfirmSettle} className="flex flex-col gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isSettling}
                  className="text-3xl font-black text-slate-900 text-center outline-none w-36 bg-transparent tracking-tight font-heading"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleTarget(null)}
                  disabled={isSettling}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling || !Number(settleAmount) || Number(settleAmount) <= 0}
                  className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                >
                  {isSettling ? 'Recording...' : 'Confirm Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== ASK COMPANION FOR FUNDS MODAL ===================== */}
      {showAskModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <HelpCircle size={24} />
              </div>
              <button 
                onClick={() => setShowAskModal(false)}
                disabled={isAsking}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">
              Ask Companion for Funds
            </h3>
            
            <p className="text-xs text-slate-500 mb-4">
              Running low on cash? Ask a companion to cover your expense. Once they accept, the transaction will be logged automatically.
            </p>

            <form onSubmit={handleSubmitAskFunds} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Ask Whom? (Companion)
                </label>
                <select
                  value={askTargetUser}
                  onChange={(e) => setAskTargetUser(e.target.value)}
                  required
                  disabled={isAsking}
                  className="w-full p-3.5 font-bold text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="">Select Companion...</option>
                  {members.map((m) => {
                    const mUser = m.user || m;
                    const uid = (mUser?._id || mUser)?.toString();
                    if (uid === user?._id?.toString()) return null; // Can't ask self
                    return (
                      <option key={uid} value={uid}>
                        {mUser?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={askAmount}
                  onChange={(e) => setAskAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isAsking}
                  className="text-3xl font-black text-slate-900 text-center outline-none w-36 bg-transparent tracking-tight font-heading"
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  What is it for? (Reason)
                </label>
                <input
                  type="text"
                  value={askReason}
                  onChange={(e) => setAskReason(e.target.value)}
                  placeholder="e.g. Ran out of cash for jet ski tickets"
                  required
                  disabled={isAsking}
                  className="w-full p-3.5 font-medium text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  disabled={isAsking}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAsking || !Number(askAmount) || Number(askAmount) <= 0 || !askTargetUser || !askReason.trim()}
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-amber-600/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{isAsking ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}