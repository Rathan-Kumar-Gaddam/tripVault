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
  Crown,
  Trash2,
  LogOut,
  SlidersHorizontal,
  AlertTriangle
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

const CURRENCIES = [
  { code: '₹', label: '₹ INR (India)' },
  { code: '$', label: '$ USD (United States)' },
  { code: '€', label: '€ EUR (Europe)' },
  { code: '£', label: '£ GBP (United Kingdom)' },
  { code: 'AED', label: 'AED (UAE Dirham)' },
  { code: '¥', label: '¥ JPY (Japan)' },
  { code: '฿', label: '฿ THB (Thailand)' },
  { code: 'CAD $', label: 'CAD $ (Canada)' },
  { code: 'AUD $', label: 'AUD $ (Australia)' },
];

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
    deleteTrip,
    leaveTrip,
    updateTrip,
    closeTrip,
    createFundRequest, 
    respondToFundRequest, 
    cancelFundRequest, 
    isLoading 
  } = useTripStore();

  // Quick Settle Modal State
  const [settleTarget, setSettleTarget] = useState(null); // { user, amount, status }
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Settle & Close Vault Wizard Modal State
  const [showSettleWizard, setShowSettleWizard] = useState(false);
  const [isClosingVault, setIsClosingVault] = useState(false);

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

  // Trip Settings & Management Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editTripName, setEditTripName] = useState('');
  const [editTripBudget, setEditTripBudget] = useState('');
  const [editTripCurrency, setEditTripCurrency] = useState('₹');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Delete / Leave confirmation states
  const [showDeleteTripConfirm, setShowDeleteTripConfirm] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [showLeaveTripConfirm, setShowLeaveTripConfirm] = useState(false);
  const [isLeavingTrip, setIsLeavingTrip] = useState(false);

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
  const isViewer = myData?.role === 'viewer';
  const isClosed = !!currentTrip?.isClosed;
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

  // Memoized End-of-Trip Minimal Debt Settlements (Who pays whom)
  const minimalSettlements = useMemo(() => {
    const creditors = [];
    const debtors = [];

    members.forEach((m) => {
      const u = m.user || m;
      const balance = Math.round((m.balance || 0) * 100) / 100;
      if (balance > 0.01) {
        creditors.push({ user: u, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ user: u, amount: Math.abs(balance) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let cIdx = 0;
    let dIdx = 0;

    const cList = creditors.map(c => ({ ...c }));
    const dList = debtors.map(d => ({ ...d }));

    while (cIdx < cList.length && dIdx < dList.length) {
      const creditor = cList[cIdx];
      const debtor = dList[dIdx];
      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtor.user,
          to: creditor.user,
          amount: Math.round(settlementAmount * 100) / 100,
        });
      }

      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      if (creditor.amount < 0.01) cIdx++;
      if (debtor.amount < 0.01) dIdx++;
    }

    return settlements;
  }, [members]);

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

  // Handle Save Trip Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (isSavingSettings) return;

    if (!editTripName.trim()) {
      toast.error('Trip destination name is required');
      return;
    }

    try {
      setIsSavingSettings(true);
      await updateTrip(id, {
        name: editTripName.trim(),
        budget: Math.max(0, Number(editTripBudget) || 0),
        currency: editTripCurrency.trim() || '₹',
      });
      toast.success('Trip settings updated! ⚙️');
      setShowSettingsModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update trip settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Delete Trip Vault (Admin)
  const handleDeleteTripVault = async () => {
    try {
      setIsDeletingTrip(true);
      await deleteTrip(id);
      toast.success('Trip vault permanently deleted 🗑️');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete trip.');
    } finally {
      setIsDeletingTrip(false);
    }
  };

  // Handle Leave Trip Vault (Member)
  const handleLeaveTripVault = async () => {
    try {
      setIsLeavingTrip(true);
      await leaveTrip(id);
      toast.success('Successfully left the trip vault 🚪');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave trip.');
    } finally {
      setIsLeavingTrip(false);
    }
  };

  // Handle End-of-Trip Settle & Close Vault
  const handleCloseVault = async (reopen = false) => {
    try {
      setIsClosingVault(true);
      await closeTrip(id, reopen);
      toast.success(reopen ? 'Trip vault reopened for logging! 🔓' : 'Trip vault closed & all balances finalized! 🔒');
      setShowSettleWizard(false);
      setShowSettingsModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update vault status.');
    } finally {
      setIsClosingVault(false);
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
    <div className="p-3 sm:p-6 md:p-8 lg:p-10 pb-24 sm:pb-20 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* CLOSED VAULT / VIEWER MODE BANNERS                                        */}
      {/* ========================================================================= */}
      {isClosed && (
        <div className="mb-5 p-4 rounded-3xl bg-slate-900 text-white border border-slate-700 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-lg shrink-0">
              🔒
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black truncate">Trip Vault Closed & Archived</h4>
              <p className="text-[11px] text-slate-400 font-medium truncate">All expenses, debts, and settlements are finalized.</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleCloseVault(true)}
              disabled={isClosingVault}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shrink-0 border border-white/10"
            >
              Reopen Vault
            </button>
          )}
        </div>
      )}

      {isViewer && !isClosed && (
        <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900 animate-in fade-in">
          <span className="text-sm">👁️</span>
          <span className="font-semibold">You are viewing this trip in <strong>Read-Only</strong> mode.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP RESPONSIVE HEADER                                                  */}
      {/* ========================================================================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb & Roles */}
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 active:scale-95 transition-all bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs"
            >
              <ArrowLeft size={13} />
              <span>All Trips</span>
            </button>

            {isAdmin ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-black px-2 py-1 rounded-xl flex items-center gap-1">
                <Crown size={11} className="fill-indigo-600" />
                <span>ORGANIZER</span>
              </span>
            ) : isViewer ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-black px-2 py-1 rounded-xl">
                READ-ONLY VIEWER
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
            <span className="text-slate-400 hidden sm:inline">{totalTransactionsCount} activities</span>
          </p>
        </div>

        {/* Action Controls Suite */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* End of trip Settle Wizard button */}
          <button
            type="button"
            onClick={() => setShowSettleWizard(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-2xs active:scale-95 transition-all"
            title="End-of-Trip Settle Wizard"
          >
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="hidden xs:inline">Settle Wizard</span>
          </button>

          {/* Requests & Notifications Hub Bell */}
          <button
            type="button"
            onClick={() => setShowRequestsModal(true)}
            className="relative w-11 h-11 rounded-2xl bg-white text-slate-700 border border-slate-200/90 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs flex items-center justify-center active:scale-90 transition-all"
            title={actionRequiredRequests.length > 0 ? `${actionRequiredRequests.length} action(s) required` : 'Requests & Notifications Hub'}
          >
            <Bell size={19} className={actionRequiredRequests.length > 0 ? 'text-indigo-600' : 'text-slate-600'} />
            {actionRequiredRequests.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md animate-pulse">
                {actionRequiredRequests.length}
              </span>
            ) : waitingRequests.length > 0 ? (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-11 h-11 rounded-2xl bg-white text-indigo-600 border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-2xs flex items-center justify-center active:scale-90 transition-all"
            title="Share Trip Vault / Invite Friends"
          >
            <Share2 size={17} />
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-11 h-11 rounded-2xl bg-white text-slate-600 border border-slate-200/90 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            title="Sync Live Passbook"
          >
            <RefreshCw size={17} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditTripName(currentTrip?.name || '');
              setEditTripBudget(currentTrip?.budget || '');
              setEditTripCurrency(currentTrip?.currency || '₹');
              setShowSettingsModal(true);
            }}
            className="w-11 h-11 rounded-2xl bg-white text-slate-700 border border-slate-200/90 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs flex items-center justify-center active:scale-90 transition-all"
            title="Trip Settings & Vault Options"
          >
            <SlidersHorizontal size={17} />
          </button>

          <button 
            onClick={() => navigate('/profile')} 
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-base overflow-hidden shadow-md shadow-indigo-500/20 active:scale-95 transition-transform border-2 border-white"
            title="My Profile"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. RESPONSIVE MULTI-COLUMN WORKSPACE (MOBILE STREAMLINED + DESKTOP DUAL)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mb-8">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: HERO CARD + PERSONAL PASSBOOK + RECENT ACTIVITY            */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
          
          {/* HERO PASSBOOK CARD (Personal Net Position) */}
          <div className={`relative overflow-hidden p-6 sm:p-7 rounded-[2.5rem] shadow-2xl text-white transition-all ${
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
                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-white/80 font-bold tracking-wider text-xs uppercase">Your Net Balance</p>
              </div>

              <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-2xs">
                <Sparkles size={12} className="text-amber-300" />
                <span>Live Passbook</span>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-sm font-heading">
                {currency}{Math.abs(netPosition).toFixed(2)}
              </h2>
              
              <div className="mt-2.5 flex items-center gap-2">
                <div className="bg-white/15 border border-white/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md">
                  {netPosition > 0.01 ? (
                    <span className="flex items-center gap-1 text-emerald-200">🎉 You are owed overall</span>
                  ) : netPosition < -0.01 ? (
                    <span className="flex items-center gap-1 text-rose-200">💸 You owe overall</span>
                  ) : (
                    <span className="flex items-center gap-1 text-teal-200">✨ All settled up!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Balance Summary */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15 text-xs">
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 flex flex-col border border-white/10">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Owed to You</span>
                <span className="font-black text-emerald-300 text-base sm:text-lg font-heading mt-0.5">
                  {currency}{totalYouAreOwed.toFixed(2)}
                </span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 flex flex-col border border-white/10">
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">You Owe</span>
                <span className="font-black text-rose-300 text-base sm:text-lg font-heading mt-0.5">
                  {currency}{totalYouOwe.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ONE PRIMARY ACTION BUTTON + ASK COVER SHORTCUT */}
            <div className="relative z-10 mt-5 pt-3 border-t border-white/15 flex flex-col sm:flex-row gap-2.5">
              {!isViewer && !isClosed ? (
                <button
                  type="button"
                  onClick={() => navigate(`/trip/${id}/add-money`)}
                  className="flex-1 py-3.5 px-4 bg-white text-slate-900 hover:bg-slate-50 font-black text-xs sm:text-sm rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={18} strokeWidth={3} className="text-indigo-600 group-hover:rotate-90 transition-transform" />
                  <span>+ Add Spend / Settle Up</span>
                </button>
              ) : isClosed ? (
                <div className="flex-1 py-3 px-4 bg-white/10 text-white/70 font-bold text-xs rounded-2xl text-center border border-white/10">
                  🔒 Vault is settled & closed
                </div>
              ) : null}

              {!isViewer && !isClosed && (
                <button
                  type="button"
                  onClick={() => setShowAskModal(true)}
                  className="py-3 px-4 bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white font-bold text-xs rounded-2xl backdrop-blur-md transition-all flex items-center justify-center gap-1.5 border border-white/15"
                  title="Ask companion to cover an expense"
                >
                  <HelpCircle size={14} className="text-amber-300" />
                  <span>Ask Cover</span>
                </button>
              )}
            </div>
          </div>

          {/* ZERO-SCROLL PERSONAL PASSBOOK (Bilateral Debts with Direct Settle) */}
          <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                    <HandCoins size={17} className="text-indigo-600 shrink-0" />
                    <span>Personal Passbook</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-400">Direct companion balances</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                  {companionDebts.length} {companionDebts.length === 1 ? 'companion' : 'companions'}
                </span>
              </div>

              {companionDebts.length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <p className="text-xs font-semibold text-slate-400">No companions in this trip yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {companionDebts.map((debt) => {
                    const compUser = debt.user;
                    const isYouOwe = debt.status === 'you_owe';
                    const isOwesYou = debt.status === 'owes_you';
                    const isSettled = debt.status === 'settled';

                    return (
                      <div 
                        key={compUser?._id || compUser} 
                        className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                          isYouOwe 
                            ? 'border-rose-200/80 bg-rose-50/40 hover:border-rose-300' 
                            : isOwesYou 
                              ? 'border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300' 
                              : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300'
                        }`}
                      >
                        {/* Companion Avatar & Debt Status */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white border-2 border-white shadow-2xs flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                            {compUser?.avatar ? (
                              <img src={compUser.avatar} alt={compUser.name} className="w-full h-full object-cover" />
                            ) : (
                              compUser?.name ? compUser.name.charAt(0).toUpperCase() : <User size={15} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {compUser?.name}
                            </p>
                            
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

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isYouOwe && !isViewer && !isClosed && (
                            <button
                              onClick={() => handleOpenSettleModal(debt)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1"
                            >
                              <span>Settle</span>
                              <ArrowRight size={13} />
                            </button>
                          )}

                          {isOwesYou && !isViewer && !isClosed && (
                            <button
                              onClick={() => handleOpenSettleModal(debt)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Send size={12} />
                              <span>Remind</span>
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

          {/* RECENT ACTIVITY FEED */}
          <section className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                    <Receipt size={17} className="text-indigo-600" />
                    <span>Recent Activity</span>
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">Tap to inspect receipt & breakdown</p>
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
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <p className="text-xs font-semibold text-slate-400 mb-2">No expenses logged yet.</p>
                  {!isViewer && !isClosed && (
                    <button
                      onClick={() => navigate(`/trip/${id}/add-money`)}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
                    >
                      + Log First Spend
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
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
                        className="bg-slate-50/80 hover:bg-indigo-50/40 p-3 rounded-2xl flex items-center justify-between gap-3 border border-slate-100 hover:border-indigo-200 cursor-pointer active:scale-[0.99] transition-all group"
                        title="Tap to view details & receipt"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-2xs"
                            style={{ backgroundColor: `${catColor}20` }}
                          >
                            <span>{catEmoji}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {tx.description}
                              </p>
                              {tx.receipt && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 shrink-0">
                                  🧾 Receipt
                                </span>
                              )}
                              {isSettlement && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                  Settle
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {payerName} paid • {formatDate(tx.date || tx.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-black text-xs sm:text-sm text-slate-900 font-heading">
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
                                ? 'Personal' 
                                : isPayer 
                                  ? `+${currency}${(tx.amount - myShare).toFixed(0)} lent` 
                                  : (myShare > 0 ? `-${currency}${myShare.toFixed(0)}` : '0')}
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
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: BUDGET + CATEGORY BREAKDOWN + COMPANIONS LEADERBOARD       */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
          
          {/* TRIP BUDGET TRACKER CARD */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider">Trip Budget Target</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Real-time spend meter</p>
                </div>
              </div>

              {!isViewer && (
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="px-3 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                >
                  <Edit3 size={12} />
                  <span>{budget > 0 ? 'Edit' : '+ Set'}</span>
                </button>
              )}
            </div>

            {budget > 0 ? (
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                      {currency}{totalTripSpend.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-1.5">
                      / {currency}{budget.toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
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
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
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

                <div className="flex justify-between items-center mt-2 text-xs font-semibold text-slate-400">
                  <span>{currency}{(totalTripSpend).toFixed(0)} spent</span>
                  <span>{isOverBudget ? '0.00' : `${currency}${budgetRemaining?.toFixed(0)}`} left</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => !isViewer && setShowBudgetModal(true)}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center cursor-pointer transition-colors group"
              >
                <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  🎯 No spending target set
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set a budget to track group expenses
                </p>
              </div>
            )}
          </div>

          {/* SPEND BY CATEGORY */}
          {sortedCategories.length > 0 && (
            <section className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-1.5">
                      <PieChart size={17} className="text-indigo-600" />
                      <span>Spend by Category</span>
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                    {sortedCategories.length} categories
                  </span>
                </div>

                {/* Segmented Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/60 mb-4 shadow-inner">
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

                {/* Category Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {sortedCategories.map((cat) => {
                    const pct = totalTripSpend > 0 ? ((cat.total / totalTripSpend) * 100).toFixed(0) : '0';
                    return (
                      <div
                        key={cat.name}
                        onClick={() => navigate(`/trip/${id}/history?category=${encodeURIComponent(cat.name)}`)}
                        className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">{cat.emoji}</span>
                          <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-100 px-1.5 py-0.2 rounded-full">
                            {pct}%
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 truncate">{cat.name}</p>
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

          {/* GROUP COMPANIONS & STANDINGS */}
          <section className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-2">
                  <Users size={17} className="text-indigo-600 shrink-0" />
                  <span>Travel Companions ({members.length})</span>
                </h3>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl active:scale-95 transition-all shrink-0"
                >
                  + Invite
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {members.map((member) => {
                  const isMemberAdmin = member.role === 'admin';
                  const isMemberViewer = member.role === 'viewer';
                  const isSelf = (member.user?._id || member.user) === user?._id;
                  const balance = member.balance || 0;
                  const mUser = member.user || member;

                  return (
                    <div 
                      key={mUser?._id || member._id} 
                      className="bg-slate-50/80 p-3 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 shadow-2xs">
                          {mUser?.avatar ? (
                            <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                          ) : (
                            mUser?.name ? mUser.name.charAt(0).toUpperCase() : <User size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {mUser?.name} {isSelf ? '(You)' : ''}
                            </p>
                            {isMemberAdmin && (
                              <ShieldCheck size={13} className="text-indigo-600 shrink-0" title="Organizer" />
                            )}
                            {isMemberViewer && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Viewer
                              </span>
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

              {/* End of Trip Wizard Launch Card */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettleWizard(true)}
                  className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xs"
                >
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>End-of-Trip Settle Wizard ➔</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODALS SUITE                                                           */}
      {/* ========================================================================= */}
      
      {/* Quick Settle Modal (with UPI Deep Link & 1-Tap Pay) */}
      {settleTarget && (() => {
        const isYouOwe = settleTarget.status === 'you_owe';
        const targetName = settleTarget.user?.name || 'Companion';
        const targetUserId = (settleTarget.user?._id || settleTarget.user)?.toString();
        const targetUpiId = settleTarget.user?.upiId || (settleTarget.user?.phone ? `${settleTarget.user.phone}@upi` : '');
        const numAmount = Number(settleAmount) || 0;
        
        // UPI deep link
        const upiPayLink = targetUpiId && numAmount > 0
          ? `upi://pay?pa=${encodeURIComponent(targetUpiId)}&pn=${encodeURIComponent(targetName)}&am=${numAmount}&cu=INR&tn=${encodeURIComponent('TripVault Settle: ' + currentTrip?.name)}`
          : '';

        const handleCopyUpi = () => {
          if (!targetUpiId) {
            toast.error('No UPI ID found for this companion.');
            return;
          }
          navigator.clipboard.writeText(targetUpiId);
          toast.success(`Copied UPI ID: ${targetUpiId} 📋`);
        };

        const handleCopyAmount = () => {
          if (!numAmount) return;
          navigator.clipboard.writeText(numAmount.toString());
          toast.success(`Copied amount: ${currency}${numAmount} 📋`);
        };

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
                  <>Send payment to <strong>{targetName}</strong> via UPI / Cash, then notify them to clear the debt.</>
                ) : (
                  <><strong>{targetName}</strong> owes you <strong>{currency}{settleTarget.amount?.toFixed(2)}</strong>. Send a settlement request asking them to pay you back.</>
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

                {/* UPI Action Card for Debtor */}
                {isYouOwe && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                        <span>📲</span>
                        <span>UPI Payment Direct</span>
                      </div>
                      {targetUpiId ? (
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white border border-indigo-200/80 px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                          {targetUpiId}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No UPI set</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {upiPayLink ? (
                        <a
                          href={upiPayLink}
                          className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl text-center shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Open UPI App ➔</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="py-2 px-3 bg-white border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl text-center active:scale-95 transition-all truncate"
                        >
                          Copy UPI ID
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyAmount}
                        className="py-2 px-3 bg-white border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl text-center active:scale-95 transition-all truncate"
                      >
                        Copy Amount
                      </button>
                    </div>
                  </div>
                )}

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
                    disabled={isSettling || !numAmount || numAmount <= 0}
                    className={`flex-1 py-3.5 text-white font-bold rounded-2xl text-xs shadow-lg active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      isYouOwe 
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    }`}
                  >
                    {isYouOwe ? <HandCoins size={15} /> : <Send size={15} />}
                    <span>{isSettling ? 'Submitting...' : isYouOwe ? 'Notify Settle Sent' : 'Send Settle Request'}</span>
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

      {/* End-of-Trip Settle & Close Vault Wizard Modal */}
      {showSettleWizard && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={24} />
              </div>
              <button 
                onClick={() => setShowSettleWizard(false)}
                disabled={isClosingVault}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1 font-heading">
              End-of-Trip Settle Wizard 🏁
            </h3>
            
            <p className="text-xs text-slate-500 mb-5">
              The minimal settlement transactions below will zero-out all companion balances for <strong>{currentTrip?.name}</strong>.
            </p>

            {/* Minimal Settlements List */}
            {minimalSettlements.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-3xl text-center mb-6">
                <div className="text-3xl mb-2">🎉</div>
                <h4 className="text-sm font-black text-emerald-950">All Debts Already Settled!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Every companion has a net balance of ₹0.00. This trip is completely balanced!
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Who Pays Whom ({minimalSettlements.length} Transfers)</span>
                </div>

                {minimalSettlements.map((step, idx) => {
                  const isSelfPayer = (step.from?._id || step.from)?.toString() === user?._id?.toString();
                  const isSelfReceiver = (step.to?._id || step.to)?.toString() === user?._id?.toString();

                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        isSelfPayer 
                          ? 'bg-rose-50/60 border-rose-200' 
                          : isSelfReceiver 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : 'bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-[11px] font-black text-slate-600 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 text-xs">
                          <p className="font-bold text-slate-900 truncate">
                            <span className={isSelfPayer ? 'text-rose-700 font-black' : ''}>{step.from?.name || 'Companion'}</span>
                            <span className="text-slate-400 font-normal"> pays </span>
                            <span className={isSelfReceiver ? 'text-emerald-700 font-black' : ''}>{step.to?.name || 'Companion'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isSelfPayer ? '👉 You need to send this transfer' : isSelfReceiver ? '📥 You will receive this' : 'Group companion transfer'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-black text-slate-900 font-heading">
                          {currency}{step.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Wizard Actions */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
              {isAdmin && !isClosed && (
                <button
                  type="button"
                  onClick={() => handleCloseVault(false)}
                  disabled={isClosingVault}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>{isClosingVault ? 'Archiving Vault...' : 'Mark All Settled & Close Vault 🔒'}</span>
                </button>
              )}

              {isClosed && (
                <div className="p-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-2xl text-center">
                  🔒 This vault is closed.
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSettleWizard(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-2xl active:scale-95 transition-all"
              >
                Close Wizard
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ========================================================================= */}
      {/* TRIP SETTINGS & VAULT MANAGEMENT MODAL                                    */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xl">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-heading">
                    Vault Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Manage {currentTrip?.name} configuration
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                disabled={isSavingSettings}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Trip Destination Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Trip Destination / Name
                </label>
                <input
                  type="text"
                  value={editTripName}
                  onChange={(e) => setEditTripName(e.target.value)}
                  placeholder="e.g. Goa Trip 🏖️"
                  required
                  disabled={isSavingSettings}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Currency & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <CustomSelect
                    options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
                    value={editTripCurrency}
                    onChange={setEditTripCurrency}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Budget Limit ({editTripCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editTripBudget}
                    onChange={(e) => setEditTripBudget(e.target.value)}
                    placeholder="0 (Unlimited)"
                    disabled={isSavingSettings}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Save Settings Button */}
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isSavingSettings ? 'Saving Changes...' : 'Save Settings'}</span>
              </button>
            </form>

            {/* Quick Actions Strip */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Vault Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    navigate(`/trip/${id}/members`);
                  }}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 transition-all active:scale-95 text-left"
                >
                  <Users size={16} className="text-indigo-600 shrink-0" />
                  <span>Manage Members</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowShareModal(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 transition-all active:scale-95 text-left"
                >
                  <Share2 size={16} className="text-purple-600 shrink-0" />
                  <span>Invite Friends</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 transition-all active:scale-95 text-left"
                >
                  <Download size={16} className="text-emerald-600 shrink-0" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 transition-all active:scale-95 text-left"
                >
                  <Printer size={16} className="text-blue-600 shrink-0" />
                  <span>Print Report</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleCloseVault(!isClosed)}
                    disabled={isClosingVault}
                    className="p-3 bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 transition-all active:scale-95 text-left col-span-2 sm:col-span-1"
                  >
                    <span>{isClosed ? '🔓' : '🔒'}</span>
                    <span>{isClosed ? 'Reopen Vault' : 'Close & Freeze Vault'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-3">
                Danger Zone
              </p>

              {isAdmin ? (
                <div className="bg-rose-50/60 border border-rose-100 p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-rose-900">Delete Trip Vault</h4>
                    <p className="text-[11px] font-medium text-rose-600">
                      Permanently delete this trip, transactions, and member balances.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowDeleteTripConfirm(true);
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-rose-600/20 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-amber-900">Leave Trip Vault</h4>
                    <p className="text-[11px] font-medium text-amber-700">
                      Remove this trip vault from your dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowLeaveTripConfirm(true);
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-amber-600/20 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <LogOut size={13} />
                    <span>Leave</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE TRIP CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {showDeleteTripConfirm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-lg font-extrabold text-center text-slate-900 mb-1.5 font-heading">
              Delete Trip Vault?
            </h3>

            <p className="text-xs text-center text-slate-500 mb-6">
              This will permanently delete <strong className="text-slate-800">{currentTrip?.name}</strong>, all its transactions, and all member balances. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteTripConfirm(false)}
                disabled={isDeletingTrip}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTripVault}
                disabled={isDeletingTrip}
                className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
              >
                {isDeletingTrip ? 'Deleting...' : 'Delete Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAVE TRIP CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
      {showLeaveTripConfirm && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <LogOut size={28} />
            </div>

            <h3 className="text-lg font-extrabold text-center text-slate-900 mb-1.5 font-heading">
              Leave Trip Vault?
            </h3>

            <p className="text-xs text-center text-slate-500 mb-6">
              You will be removed from <strong className="text-slate-800">{currentTrip?.name}</strong> and it will no longer appear on your dashboard. You will need an invite link to rejoin.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveTripConfirm(false)}
                disabled={isLeavingTrip}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveTripVault}
                disabled={isLeavingTrip}
                className="flex-1 py-3.5 bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-amber-600/25 hover:bg-amber-700 active:scale-95 transition disabled:opacity-50"
              >
                {isLeavingTrip ? 'Leaving...' : 'Leave Vault'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}