import { useEffect, useState, useMemo } from 'react';
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
  Ban,
  PieChart,
  TrendingUp,
  Download,
  Printer,
  FileSpreadsheet,
  Target,
  Edit3,
  Layers,
  ChevronRight,
  UserCheck,
  Share2,
  RefreshCw,
  ArrowLeft,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  exportTripToCSV, 
  exportPersonalExpenseToCSV,
  printTripReport, 
  printPersonalExpenseReport,
  computeUserShare 
} from '../utils/exportUtils';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ShareTripModal from '../components/ShareTripModal';
import RequestsHubModal from '../components/RequestsHubModal';
import CustomSelect from '../components/CustomSelect';
import { getCategoryMeta } from '../utils/categoryUtils';

const PRESET_BUDGETS = [10000, 25000, 50000, 100000];

// Helper to extract emoji or destination icon
const getTripIcon = (name = '') => {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
  const match = name.match(emojiRegex);
  if (match) return match[0];
  const lower = name.toLowerCase();
  if (lower.includes('beach') || lower.includes('goa') || lower.includes('island')) return '🏖️';
  if (lower.includes('trek') || lower.includes('mountain') || lower.includes('hill') || lower.includes('manali')) return '🏔️';
  if (lower.includes('road') || lower.includes('trip') || lower.includes('drive') || lower.includes('ladakh')) return '🚗';
  if (lower.includes('camp') || lower.includes('forest')) return '🏕️';
  if (lower.includes('flight') || lower.includes('europe') || lower.includes('euro')) return '✈️';
  return '🗺️';
};

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
    deleteTransaction,
    updateTrip,
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

  // Requests Hub Modal State
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Share Modal & Transaction Detail Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Responding state for incoming requests
  const [respondingId, setRespondingId] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    setFetchError(null);
    fetchTripDetails(id).catch((err) => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load trip vault');
    });
  }, [id]);

  useEffect(() => {
    if (currentTrip?.budget) {
      setBudgetValue(currentTrip.budget.toString());
    }
  }, [currentTrip?.budget]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchTripDetails(id);
      toast.success('Live passbook synchronized! 🔄');
    } catch (e) {
      toast.error('Failed to sync passbook.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    try {
      await deleteTransaction(txId, id);
      toast.success('Transaction removed and balances recalculated 🗑️');
    } catch (e) {
      toast.error('Failed to delete transaction.');
    }
  };

  const members = currentTrip?.members || [];
  const myData = members.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = myData?.role === 'admin';
  const currency = currentTrip?.currency || '₹';
  const tripIcon = getTripIcon(currentTrip?.name);

  // Memoized P2P bilateral debt computation (executed unconditionally)
  const { 
    totalYouAreOwed, 
    totalYouOwe, 
    netPosition, 
    companionDebts 
  } = useMemo(
    () => computeBilateralDebts(members, transactions, user?._id),
    [members, transactions, user?._id]
  );

  // Memoized Action-Required Requests (where user must act: fund, confirm receipt, or verify settlement)
  const actionRequiredRequests = useMemo(() => {
    const myId = user?._id?.toString();
    return (fundRequests || []).filter((r) => {
      const targetId = (r.targetUser?._id || r.targetUser)?.toString();
      const reqId = (r.requester?._id || r.requester)?.toString();

      // Case 1: You are asked for funds (status: pending)
      if (r.requestType === 'fund_request' && r.status === 'pending' && targetId === myId) return true;
      // Case 2: You asked for funds, companion marked sent, you must confirm receipt! (status: payment_sent)
      if (r.requestType === 'fund_request' && r.status === 'payment_sent' && reqId === myId) return true;
      // Case 3: You are the receiver of a settlement payment (status: pending)
      if (r.requestType === 'settlement' && r.status === 'pending' && targetId === myId) return true;
      return false;
    });
  }, [fundRequests, user?._id]);

  // Memoized Outgoing/Waiting Requests (where you are waiting on your companion)
  const waitingRequests = useMemo(() => {
    const myId = user?._id?.toString();
    return (fundRequests || []).filter((r) => {
      const targetId = (r.targetUser?._id || r.targetUser)?.toString();
      const reqId = (r.requester?._id || r.requester)?.toString();

      // Case 1: You asked for funds, waiting for companion to pay (status: pending)
      if (r.requestType === 'fund_request' && r.status === 'pending' && reqId === myId) return true;
      // Case 2: You paid/marked sent, waiting for requester to confirm receipt (status: payment_sent)
      if (r.requestType === 'fund_request' && r.status === 'payment_sent' && targetId === myId) return true;
      // Case 3: You sent a settlement payment, waiting for receiver to confirm (status: pending)
      if (r.requestType === 'settlement' && r.status === 'pending' && reqId === myId) return true;
      return false;
    });
  }, [fundRequests, user?._id]);

  // Memoized Group & Category Calculations
  const {
    totalTripSpend,
    myTotalShare,
    recentTransactions,
    sortedCategories,
    budget,
    budgetRemaining,
    budgetPercentage,
    isOverBudget,
  } = useMemo(() => {
    let spend = 0;
    let myShare = 0;
    const catStats = {};

    (transactions || []).forEach((t) => {
      if (t.type === 'expense') {
        const amt = t.amount || 0;
        spend += amt;
        myShare += computeUserShare(t, user?._id, members);

        const cat = t.category || 'Other';
        const meta = getCategoryMeta(cat, id);
        if (!catStats[cat]) {
          catStats[cat] = {
            name: cat,
            total: 0,
            count: 0,
            color: meta.hex || meta.theme?.hex || '#6366f1',
            emoji: meta.emoji || '🏷️',
          };
        }
        catStats[cat].total += amt;
        catStats[cat].count += 1;
      }
    });

    const sortedCats = Object.values(catStats).sort((a, b) => b.total - a.total);
    const tripBudget = currentTrip?.budget || 0;
    const rem = tripBudget > 0 ? tripBudget - spend : null;
    const rawPct = tripBudget > 0 ? (spend / tripBudget) * 100 : 0;
    const pct = Math.min(100, Math.round(rawPct));
    const over = tripBudget > 0 && spend > tripBudget;

    return {
      totalTripSpend: spend,
      myTotalShare: myShare,
      recentTransactions: (transactions || []).slice(0, 6),
      sortedCategories: sortedCats,
      budget: tripBudget,
      budgetRemaining: rem,
      budgetPercentage: pct,
      isOverBudget: over,
    };
  }, [transactions, currentTrip?.budget, user?._id, members, id]);

  const totalTransactionsCount = transactions?.length || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Render skeleton loader while trip details are loading
  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <DashboardSkeleton />;
  }

  if (fetchError || !currentTrip) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 font-heading">
          {fetchError || 'Trip Vault Not Found'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
          This trip vault might have been removed, or your account may need to be added as a companion to access it.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            ← Back to All Trips
          </button>
          <button
            onClick={() => {
              setFetchError(null);
              fetchTripDetails(id).catch(err => setFetchError(err.response?.data?.message || 'Failed to load trip'));
            }}
            className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
    const targetName = settleTarget.user?.name || 'Companion';
    const isYouOwe = settleTarget.status === 'you_owe';

    try {
      setIsSettling(true);
      if (isYouOwe) {
        // You owe them, so you are sending a settlement payment
        await createFundRequest({
          tripId: id,
          requestType: 'settlement',
          targetUser: targetUserId,
          amount: numAmount,
          description: `Settlement payment to ${targetName}`,
          category: 'Settlement',
        });
        toast.success(`Settlement payment sent to ${targetName} for approval! 📩`);
      } else {
        // They owe you, so you are requesting them to settle
        await createFundRequest({
          tripId: id,
          requestType: 'fund_request',
          targetUser: targetUserId,
          amount: numAmount,
          description: `Settlement request (${currency}${numAmount.toFixed(2)})`,
          category: 'Settlement',
        });
        toast.success(`Settlement request sent to ${targetName}! 📩`);
      }
      setSettleTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit settlement.');
    } finally {
      setIsSettling(false);
    }
  };

  // Handle Respond to Request: Funder marks sent, Requester confirms receipt, or Receiver verifies settlement
  const handleRespondRequest = async (requestId, action, otherUserName, reqAmount, requestType) => {
    if (respondingId) return;

    try {
      setRespondingId(requestId);
      const res = await respondToFundRequest(requestId, action, id);
      if (res?.message) {
        toast.success(res.message);
      } else if (action === 'mark_sent' || action === 'pay') {
        toast.success(`Marked as sent! ${otherUserName} will confirm receipt before transaction is logged. 📩`);
      } else if (action === 'confirm_receipt' || action === 'accept') {
        toast.success(`Receipt confirmed! Transaction logged in vault. 🎉`);
      } else if (action === 'not_received') {
        toast('Marked as not received. Funder has been notified.', { icon: '⚠️' });
      } else {
        toast('Request declined.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process request.');
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
        requestType: 'fund_request',
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

  // Handle Save Budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (isSavingBudget) return;

    const num = Math.max(0, Number(budgetValue) || 0);

    try {
      setIsSavingBudget(true);
      await updateTrip(id, { budget: num });
      toast.success(num > 0 ? `Trip budget set to ${currency}${num.toLocaleString()} 🎯` : 'Budget limit cleared.');
      setShowBudgetModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    try {
      exportTripToCSV(currentTrip, transactions, user);
      toast.success('Group Passbook CSV exported! 📊');
    } catch (err) {
      toast.error('Failed to export CSV.');
    }
  };

  const handleExportPersonalCSV = () => {
    try {
      exportPersonalExpenseToCSV(currentTrip, transactions, user);
      toast.success('My Expenses CSV exported! 👤');
    } catch (err) {
      toast.error('Failed to export personal CSV.');
    }
  };

  const handlePrintPDF = () => {
    try {
      printTripReport(currentTrip, transactions, user);
    } catch (err) {
      toast.error('Failed to generate PDF statement.');
    }
  };

  const handlePrintPersonalPDF = () => {
    try {
      printPersonalExpenseReport(currentTrip, transactions, user);
    } catch (err) {
      toast.error('Failed to generate personal PDF statement.');
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 lg:p-10 pb-24 sm:pb-20">
      
      {/* ========================================================================= */}
      {/* 1. TOP RESPONSIVE HEADER                                                  */}
      {/* ========================================================================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb back navigation */}
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 active:scale-95 transition-all bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>All Trips</span>
            </button>

            {isAdmin ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-black px-2 py-1 rounded-xl flex items-center gap-1">
                <Crown size={11} className="fill-indigo-600" />
                <span>ORGANIZER</span>
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-xl">
                MEMBER
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl shrink-0">{tripIcon}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate font-heading">
              {currentTrip.name}
            </h1>
          </div>

          <p className="text-slate-500 text-xs sm:text-sm font-semibold flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1">
            <span>Vault: <strong className="text-slate-900 font-bold">{currency}{totalTripSpend.toFixed(2)}</strong></span>
            <span className="text-slate-300 hidden xs:inline">•</span>
            <span>Your Share: <strong className="text-indigo-600 font-bold">{currency}{myTotalShare.toFixed(2)}</strong></span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">{totalTransactionsCount} {totalTransactionsCount === 1 ? 'activity' : 'activities'}</span>
          </p>
        </div>

        {/* Action Controls Suite */}
        <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto shrink-0">
          {/* Requests & Notifications Hub Bell */}
          <button
            type="button"
            onClick={() => setShowRequestsModal(true)}
            className="relative w-11 h-11 rounded-2xl bg-white text-slate-700 border border-slate-200/90 hover:border-indigo-300 hover:text-indigo-600 shadow-sm flex items-center justify-center active:scale-90 transition-all"
            title={actionRequiredRequests.length > 0 ? `${actionRequiredRequests.length} action(s) required` : 'Requests & Notifications Hub'}
          >
            <Bell size={20} className={actionRequiredRequests.length > 0 ? 'text-indigo-600' : 'text-slate-600'} />
            {actionRequiredRequests.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5 px-1 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md animate-pulse">
                {actionRequiredRequests.length}
              </span>
            ) : waitingRequests.length > 0 ? (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full"></span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-11 h-11 rounded-2xl bg-white text-indigo-600 border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm flex items-center justify-center active:scale-90 transition-all"
            title="Share Trip Vault / Invite Friends"
          >
            <Share2 size={18} />
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 border border-slate-200/90 hover:border-indigo-300 hover:text-indigo-600 shadow-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            title="Sync Live Passbook"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button 
            onClick={() => navigate('/profile')} 
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-base overflow-hidden shadow-lg shadow-indigo-500/25 active:scale-95 transition-transform border-2 border-white"
            title="My Profile"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TOP HERO & QUICK ACTIONS GRID                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mb-8">
        
        {/* Left Column (Hero Net Position + Budget Tracker) */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
          
          {/* HERO PASSBOOK CARD (Personal Net Position) */}
          <div className={`relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] shadow-2xl text-white transition-all ${
            netPosition > 0.01 
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 shadow-emerald-600/20' 
              : netPosition < -0.01
                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 shadow-slate-950/20'
                : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 shadow-indigo-600/20'
          }`}>
            <WalletCards className="absolute -right-8 -top-8 w-52 h-52 opacity-10 rotate-12 pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-white/80 font-bold tracking-wider text-xs uppercase">Your Net Balance</p>
              </div>

              <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-xs">
                <Sparkles size={13} className="text-amber-300" />
                <span>Live Passbook</span>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-sm font-heading">
                {currency}{Math.abs(netPosition).toFixed(2)}
              </h2>
              
              <div className="mt-3 flex items-center gap-2">
                <div className="bg-white/15 border border-white/20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md">
                  {netPosition > 0.01 ? (
                    <span className="flex items-center gap-1.5 text-emerald-200">🎉 You are owed overall</span>
                  ) : netPosition < -0.01 ? (
                    <span className="flex items-center gap-1.5 text-rose-200">💸 You owe overall</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-teal-200">✨ All settled up!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Balance Summary inside Card */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3.5 flex flex-col border border-white/10">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Owed to You</span>
                <span className="font-black text-emerald-300 text-lg sm:text-xl font-heading mt-0.5">
                  {currency}{totalYouAreOwed.toFixed(2)}
                </span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3.5 flex flex-col border border-white/10">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">You Owe</span>
                <span className="font-black text-rose-300 text-lg sm:text-xl font-heading mt-0.5">
                  {currency}{totalYouOwe.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ask Companion Shortcut Prompt */}
            <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAskModal(true)}
                className="w-full py-2.5 px-3.5 bg-white/15 hover:bg-white/25 active:scale-[0.99] text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-sm border border-white/15"
              >
                <HelpCircle size={15} className="text-amber-300" />
                <span>Low on cash? Request companion to cover you</span>
              </button>
            </div>
          </div>

          {/* TRIP BUDGET TRACKER CARD */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider">Trip Budget Target</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-semibold">Real-time spend meter</p>
                </div>
              </div>

              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              >
                <Edit3 size={13} />
                <span>{budget > 0 ? 'Edit Limit' : '+ Set Target'}</span>
              </button>
            </div>

            {budget > 0 ? (
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                      {currency}{totalTripSpend.toFixed(2)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-semibold ml-1.5">
                      / {currency}{budget.toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    isOverBudget 
                      ? 'bg-rose-100 text-rose-700' 
                      : budgetPercentage >= 75 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isOverBudget ? `⚠️ Over by ${currency}${Math.abs(budgetRemaining).toFixed(0)}` : `${budgetPercentage}% used`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget 
                        ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                        : budgetPercentage >= 75 
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, budgetPercentage))}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2.5 text-xs font-semibold text-slate-400">
                  <span>{currency}{(totalTripSpend).toFixed(0)} spent</span>
                  <span>{isOverBudget ? '0.00' : `${currency}${budgetRemaining?.toFixed(0)}`} remaining</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setShowBudgetModal(true)}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-5 text-center cursor-pointer transition-colors group"
              >
                <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  🎯 No spending limit set for this trip
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set a budget target to monitor group spending in real-time
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Grid & Action Banners */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Quick Action Grid (6 high-utility tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/trip/${id}/add-money`)}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-xs">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">Add Expense</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">Split with group</span>
              </div>
            </button>

            <button
              onClick={() => setShowAskModal(true)}
              className="bg-amber-50/70 border border-amber-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-amber-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-amber-500/20 shrink-0">
                <HelpCircle size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-amber-950 block truncate">Ask Funds</span>
                <span className="text-[10px] text-amber-700/90 font-medium truncate block">Request cover</span>
              </div>
            </button>

            <button
              onClick={() => setShowRequestsModal(true)}
              className="relative bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ${
                actionRequiredRequests.length > 0 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse' 
                  : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Bell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-slate-900 block truncate">Requests Hub</span>
                  {actionRequiredRequests.length > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                      {actionRequiredRequests.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate block">
                  {actionRequiredRequests.length > 0 ? `${actionRequiredRequests.length} need action` : 'Approvals & logs'}
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate(`/trip/${id}/add-money?mode=settle`)}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-xs">
                <HandCoins size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">Settle Up</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">Clear debts</span>
              </div>
            </button>

            <button
              onClick={() => navigate(`/trip/${id}/history`)}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-purple-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-xs">
                <History size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">Timeline</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">All activity & logs</span>
              </div>
            </button>

            <button
              onClick={() => navigate(`/trip/${id}/add-member`)}
              className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-xs">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">Companions</span>
                <span className="text-[10px] text-slate-400 font-medium truncate block">{members.length} members</span>
              </div>
            </button>
          </div>

          {/* Action Required Callout Banner */}
          {actionRequiredRequests.length > 0 && (
            <div 
              onClick={() => setShowRequestsModal(true)}
              className="cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4 rounded-3xl shadow-xl shadow-indigo-500/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 hover:opacity-95 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bell size={20} className="animate-bounce" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs sm:text-sm truncate">
                    {actionRequiredRequests.length} {actionRequiredRequests.length === 1 ? 'Action Required' : 'Actions Required'}
                  </h4>
                  <p className="text-[11px] text-white/80 font-medium truncate">
                    Verify transfers or approve companion requests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-black bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl shrink-0 transition-colors">
                <span>View</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}

          {/* Pending Outgoing Tracker Pill */}
          {actionRequiredRequests.length === 0 && waitingRequests.length > 0 && (
            <div 
              onClick={() => setShowRequestsModal(true)}
              className="cursor-pointer bg-indigo-50/80 border border-indigo-200/80 hover:bg-indigo-100/70 p-3.5 rounded-2xl flex items-center justify-between text-xs text-indigo-900 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">⏳</span>
                <span className="font-bold truncate">
                  {waitingRequests.length} {waitingRequests.length === 1 ? 'outgoing request pending' : 'outgoing requests pending'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 underline shrink-0">
                Track Status
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MID SECTION: SPEND BY CATEGORY & PERSONAL PASSBOOK                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-8">
        
        {/* Left: Spend by Category */}
        {sortedCategories.length > 0 && (
          <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                    <PieChart size={17} className="text-indigo-600" />
                    <span>Spend by Category</span>
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">Where the trip vault money went</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                  {sortedCategories.length} categories
                </span>
              </div>

              {/* Segmented Proportional Bar */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/60 mb-5 shadow-inner">
                {sortedCategories.map((cat) => {
                  const pct = totalTripSpend > 0 ? (cat.total / totalTripSpend) * 100 : 0;
                  if (pct < 1) return null;
                  return (
                    <div
                      key={cat.name}
                      className="h-full rounded-sm transition-all first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      title={`${cat.name}: ${currency}${cat.total.toFixed(2)} (${pct.toFixed(1)}%)`}
                    ></div>
                  );
                })}
              </div>

              {/* Category Ranked Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                {sortedCategories.map((cat) => {
                  const pct = totalTripSpend > 0 ? ((cat.total / totalTripSpend) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={cat.name}
                      onClick={() => navigate(`/trip/${id}/history?category=${encodeURIComponent(cat.name)}`)}
                      className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 hover:shadow-md active:scale-95 transition-all group"
                      title={`View ${cat.name} expenses in History`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                        <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-full shadow-xs">
                          {pct}%
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{cat.name}</p>
                          <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs font-black text-slate-900 mt-0.5 font-heading">
                          {currency}{cat.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Right: Personal Passbook (Direct Companion Debts) */}
        <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                  <HandCoins size={17} className="text-indigo-600 shrink-0" />
                  <span>Personal Passbook</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">Direct companion balances (0 debt on self expenses)</p>
              </div>
              <button 
                onClick={() => setShowAskModal(true)}
                className="text-[11px] sm:text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 border border-amber-300/80 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
              >
                <HelpCircle size={13} />
                <span>Ask Funds</span>
              </button>
            </div>

            {companionDebts.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400">No companions added to this trip yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {companionDebts.map((debt) => {
                  const compUser = debt.user;
                  const isYouOwe = debt.status === 'you_owe';
                  const isOwesYou = debt.status === 'owes_you';
                  const isSettled = debt.status === 'settled';

                  return (
                    <div 
                      key={compUser?._id || compUser} 
                      className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border transition-all ${
                        isYouOwe 
                          ? 'border-rose-200/80 bg-rose-50/40 hover:border-rose-300' 
                          : isOwesYou 
                            ? 'border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300' 
                            : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Avatar, Name & Live Debt Status */}
                      <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white border-2 border-white shadow-xs flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                            {compUser?.avatar ? (
                              <img src={compUser.avatar} alt={compUser.name} className="w-full h-full object-cover" />
                            ) : (
                              compUser?.name ? compUser.name.charAt(0).toUpperCase() : <User size={15} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px]">
                              {compUser?.name}
                            </p>
                            
                            {/* Subtitle / Debt status */}
                            {isOwesYou && (
                              <p className="text-[11px] sm:text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                                <span>Owes you</span>
                                <strong className="text-emerald-700 font-black">{currency}{debt.amount.toFixed(2)}</strong>
                              </p>
                            )}

                            {isYouOwe && (
                              <p className="text-[11px] sm:text-xs font-extrabold text-rose-600 flex items-center gap-1">
                                <span>You owe</span>
                                <strong className="text-rose-700 font-black">{currency}{debt.amount.toFixed(2)}</strong>
                              </p>
                            )}

                            {isSettled && (
                              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span>Settled up</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Mobile-only compact balance indicator */}
                        <div className="sm:hidden text-right shrink-0">
                          {isOwesYou && (
                            <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-lg">
                              +{currency}{debt.amount.toFixed(2)}
                            </span>
                          )}
                          {isYouOwe && (
                            <span className="text-[11px] font-black text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-lg">
                              -{currency}{debt.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions Buttons Row */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t border-slate-200/50 sm:border-t-0">
                        <button
                          onClick={() => { setAskTargetUser((compUser?._id || compUser)?.toString()); setShowAskModal(true); }}
                          className="flex-1 sm:flex-initial px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-[11px] sm:text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shadow-2xs"
                          title={`Ask ${compUser?.name} for funds`}
                        >
                          <HelpCircle size={13} />
                          <span>Ask {currency}</span>
                        </button>

                        {isYouOwe && (
                          <button
                            onClick={() => handleOpenSettleModal(debt)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[11px] sm:text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <span>Settle</span>
                            <ArrowRight size={13} />
                          </button>
                        )}

                        {isOwesYou && (
                          <button
                            onClick={() => handleOpenSettleModal(debt)}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] sm:text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Send size={13} />
                            <span>Request</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: RECENT ACTIVITY & GROUP STANDINGS                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-8">
        
        {/* Left: Recent Activity Feed */}
        <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                  <Receipt size={17} className="text-indigo-600" />
                  <span>Recent Activity Feed</span>
                </h3>
                <p className="text-[11px] font-medium text-slate-400">Tap any item to view split receipt & breakdown</p>
              </div>
              <button 
                onClick={() => navigate(`/trip/${id}/history`)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 active:scale-95 transition-all bg-indigo-50 px-3 py-1.5 rounded-xl"
              >
                <span>All Logs</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-400 mb-2">No activity logged in this vault yet.</p>
                <button
                  onClick={() => navigate(`/trip/${id}/add-money`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  + Log First Expense
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentTransactions.map((tx) => {
                  const isSettlement = tx.type === 'settlement';
                  const isPayer = (tx.payer?._id || tx.payer || tx.paidBy?._id || tx.paidBy || tx.createdBy?._id || tx.createdBy)?.toString() === user?._id?.toString();
                  const payerName = isPayer ? 'You' : (tx.payer?.name || tx.paidBy?.name || tx.createdBy?.name || 'Companion');
                  const mySplit = tx.splits?.find(s => (s.user?._id || s.user)?.toString() === user?._id?.toString());
                  const myShare = mySplit ? (mySplit.amount || 0) : computeUserShare(tx, user?._id, members);
                  const isPersonal = tx.splitType === 'self' || (tx.splits?.length === 1 && (tx.splits[0]?.user?._id || tx.splits[0]?.user)?.toString() === (tx.payer?._id || tx.payer)?.toString());
                  const catMeta = getCategoryMeta(tx.category || (isSettlement ? 'Settlement' : 'Other'), id);
                  const catColor = catMeta.hex || catMeta.theme?.hex || '#6366f1';
                  const catEmoji = catMeta.emoji || '🏷️';

                  return (
                    <div
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="bg-slate-50/80 hover:bg-indigo-50/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 border border-slate-100 hover:border-indigo-200 cursor-pointer active:scale-[0.99] transition-all group"
                      title="Tap to view receipt details"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `${catColor}20` }}
                        >
                          <span>{catEmoji}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {tx.description}
                            </p>
                            {isSettlement && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                Settle
                              </span>
                            )}
                            {isPersonal && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                                Personal
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {payerName} paid • {formatDate(tx.date || tx.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs sm:text-sm text-slate-900 font-heading">
                          {currency}{tx.amount.toFixed(2)}
                        </p>
                        {!isSettlement && (
                          <p className={`text-[10px] font-bold mt-0.5 ${
                            isPersonal 
                              ? 'text-purple-600' 
                              : isPayer 
                                ? 'text-emerald-600' 
                                : (myShare > 0 ? 'text-rose-600' : 'text-slate-400')
                          }`}>
                            {isPersonal 
                              ? 'No debt created' 
                              : isPayer 
                                ? `You lent ${currency}${(tx.amount - myShare).toFixed(2)}` 
                                : (myShare > 0 ? `Your share ${currency}${myShare.toFixed(2)}` : 'Not involved')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right: Group Standings Ledger */}
        <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-2">
                <Users size={17} className="text-indigo-600 shrink-0" />
                <span>Group Standings ({members.length})</span>
              </h3>
              <button 
                onClick={() => navigate(`/trip/${id}/add-member`)}
                className="text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl active:scale-95 transition-all shrink-0"
              >
                + Add Member
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
                    className="bg-slate-50/80 p-3.5 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 shadow-xs">
                        {mUser?.avatar ? (
                          <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                        ) : (
                          mUser?.name ? mUser.name.charAt(0).toUpperCase() : <User size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {mUser?.name} {isSelf ? '(You)' : ''}
                          </p>
                          {isMemberAdmin && (
                            <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-black text-xs sm:text-sm tracking-tight font-heading ${
                        balance > 0.01 ? 'text-emerald-600' : (balance < -0.01 ? 'text-rose-600' : 'text-slate-400')
                      }`}>
                        {balance > 0.01 ? '+' : ''}{currency}{balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPORT PASSBOOK & REPORT SUITE                                         */}
      {/* ========================================================================= */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <Download size={22} className="text-indigo-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-wider font-heading">
                Export Passbook & Statements
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Download spreadsheet reports for Excel/Sheets or print official PDF statements
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <button
              onClick={handleExportCSV}
              className="py-3.5 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2 shadow-sm"
              title="Download group passbook CSV"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>Group CSV</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="py-3.5 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2 shadow-sm"
              title="Print group statement PDF"
            >
              <Printer size={16} className="text-indigo-300" />
              <span>Group PDF</span>
            </button>

            <button
              onClick={handleExportPersonalCSV}
              className="py-3.5 px-3 bg-indigo-600/80 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all border border-indigo-400/30 flex items-center justify-center gap-2 shadow-sm"
              title="Download personal expenses for tracking & reimbursements"
            >
              <UserCheck size={16} className="text-emerald-300" />
              <span>My Expenses CSV</span>
            </button>

            <button
              onClick={handlePrintPersonalPDF}
              className="py-3.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              title="Print personal statement PDF"
            >
              <Printer size={16} className="text-purple-200" />
              <span>My Statement PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MODALS SUITE                                                           */}
      {/* ========================================================================= */}
      
      {/* Quick Settle Modal */}
      {settleTarget && (() => {
        const isYouOwe = settleTarget.status === 'you_owe';
        const targetName = settleTarget.user?.name || 'Companion';
        const targetUserId = (settleTarget.user?._id || settleTarget.user)?.toString();

        return (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-2xl ${isYouOwe ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isYouOwe ? <HandCoins size={24} /> : <Send size={24} />}
                </div>
                <button 
                  onClick={() => setSettleTarget(null)}
                  disabled={isSettling}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1 font-heading">
                {isYouOwe ? `Pay & Settle with ${targetName}` : `Request Settlement from ${targetName}`}
              </h3>
              
              <p className="text-xs text-slate-500 mb-4">
                {isYouOwe ? (
                  <>Send settlement payment to <strong>{targetName}</strong>. Once they approve receipt, your debt will be cleared.</>
                ) : (
                  <><strong>{targetName}</strong> owes you <strong>{currency}{settleTarget.amount?.toFixed(2)}</strong>. Send a settlement request asking them to pay you back and settle up.</>
                )}
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
                    className={`flex-1 py-3.5 text-white font-bold rounded-2xl text-xs shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      isYouOwe 
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    }`}
                  >
                    {isYouOwe ? <HandCoins size={15} /> : <Send size={15} />}
                    <span>{isSettling ? 'Sending...' : isYouOwe ? 'Send Payment' : 'Send Request'}</span>
                  </button>
                </div>

                {!isYouOwe && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettleTarget(null);
                      navigate(`/trip/${id}/add-money?mode=settle&with=${targetUserId}&amount=${settleAmount}`);
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 text-center transition-colors pt-1"
                  >
                    Already received cash/UPI? Record directly →
                  </button>
                )}
              </form>
            </div>
          </div>
        );
      })()}

      {/* Ask Companion For Funds Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
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

            <h3 className="text-lg font-black text-slate-900 mb-1 font-heading">
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
                <CustomSelect
                  value={askTargetUser}
                  onChange={(val) => setAskTargetUser(val)}
                  placeholder="Select Companion..."
                  disabled={isAsking}
                  options={members
                    .filter((m) => {
                      const mUser = m.user || m;
                      const uid = (mUser?._id || mUser)?.toString();
                      return uid !== user?._id?.toString();
                    })
                    .map((m) => {
                      const mUser = m.user || m;
                      const uid = (mUser?._id || mUser)?.toString();
                      return {
                        value: uid,
                        label: mUser?.name || 'Companion',
                        avatar: mUser?.avatar,
                        initials: mUser?.name?.charAt(0).toUpperCase() || '?',
                        sublabel: m.role === 'admin' ? 'Organizer' : 'Member',
                      };
                    })}
                />
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

      {/* Set/Edit Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Target size={24} />
              </div>
              <button 
                onClick={() => setShowBudgetModal(false)}
                disabled={isSavingBudget}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1 font-heading">
              Trip Budget Target
            </h3>
            
            <p className="text-xs text-slate-500 mb-4">
              Set a spending limit for this trip. All group expenses will be tracked against this limit.
            </p>

            <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
              {/* Quick Presets */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {PRESET_BUDGETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBudgetValue(p.toString())}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all"
                  >
                    {currency}{(p / 1000)}k
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBudgetValue('0')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 active:scale-95 transition-all"
                >
                  Clear
                </button>
              </div>

              {/* Amount Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  placeholder="0"
                  required
                  disabled={isSavingBudget}
                  className="text-3xl font-black text-slate-900 text-center outline-none w-44 bg-transparent tracking-tight font-heading"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  disabled={isSavingBudget}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/25 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{isSavingBudget ? 'Saving...' : 'Save Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Detail Sheet Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={handleDeleteTx}
        currency={currency}
        currentUser={user}
        isAdmin={isAdmin}
      />

      {/* Share Trip Modal */}
      <ShareTripModal
        trip={currentTrip}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Requests & Notifications Hub Modal */}
      <RequestsHubModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        tripName={currentTrip?.name}
        currency={currency}
        user={user}
        fundRequests={fundRequests}
        onRespond={handleRespondRequest}
        onCancel={handleCancelRequest}
        respondingId={respondingId}
      />
    </div>
  );
}