import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTripStore, { computeBilateralDebts } from '../store/useTripStore';
import { 
  Plus, 
  Receipt,
  ArrowRight, 
  ArrowLeft,
  ChevronRight, 
  Share2, 
  RefreshCw, 
  SlidersHorizontal,
  Download,
  HandCoins,
  X,
  Camera,
  Upload,
  LogOut,
  PieChart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ShareTripModal from '../components/ShareTripModal';
import ExportModal from '../components/ExportModal';
import { getCategoryMeta } from '../utils/categoryUtils';
import { getCoverPhotoForTrip, COVER_PHOTOS, compressCoverImage } from '../utils/coverPhotos';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    user, 
    currentTrip, 
    transactions, 
    fetchTripDetails, 
    deleteTransaction,
    updateTrip,
    closeTrip,
    logTransaction,
    logout,
    subscribeToTripEvents,
    unsubscribeFromTripEvents
  } = useTripStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Quick Settle Confirmation Modal
  const [settleDebt, setSettleDebt] = useState(null); // { fromUser, toUser, amount }
  const [isSettling, setIsSettling] = useState(false);

  // Settings State
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editCoverPhoto, setEditCoverPhoto] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isClosingVault, setIsClosingVault] = useState(false);
  const [showAllGroupDebts, setShowAllGroupDebts] = useState(false);

  // Fetch Trip Details & Live SSE sync
  useEffect(() => {
    let isMounted = true;
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id).catch((err) => {
        if (isMounted) {
          setFetchError(err.response?.data?.message || err.message || 'Failed to load trip details');
        }
      });
    }

    subscribeToTripEvents(id);

    return () => {
      isMounted = false;
      unsubscribeFromTripEvents();
    };
  }, [id, currentTrip, fetchTripDetails, subscribeToTripEvents, unsubscribeFromTripEvents]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchTripDetails(id);
      toast.success('Live balances updated! 🔄');
    } catch {
      toast.error('Failed to sync vault.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const members = useMemo(() => currentTrip?.members || [], [currentTrip?.members]);
  const myData = members.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = (currentTrip?.createdBy?._id || currentTrip?.createdBy)?.toString() === user?._id?.toString() || myData?.role === 'admin';
  const isClosed = !!currentTrip?.isClosed;
  const currency = currentTrip?.currency || '₹';
  const coverPhoto = useMemo(() => {
    return getCoverPhotoForTrip(currentTrip?.name || currentTrip?.destination, currentTrip?.coverPhoto);
  }, [currentTrip?.name, currentTrip?.destination, currentTrip?.coverPhoto]);

  // Quick Direct Hero Photo Upload
  const handleHeroPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressCoverImage(file);
      await updateTrip(id, { coverPhoto: compressed });
      toast.success('Cover photo updated! 📸');
    } catch (err) {
      toast.error(err.message || 'Failed to update cover photo');
    }
  };

  const handleSettingsPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressCoverImage(file);
      setEditCoverPhoto(compressed);
      toast.success('Custom photo loaded! Click Save to apply.');
    } catch (err) {
      toast.error(err.message || 'Failed to process image');
    }
  };

  // Bilateral Debt Computation
  const { 
    netPosition, 
    companionDebts 
  } = useMemo(
    () => computeBilateralDebts(members, transactions, user?._id),
    [members, transactions, user?._id]
  );

  // Minimal Settlements (Simplified who-pays-whom)
  const minimalSettlements = useMemo(() => {
    const debtors = [];
    const creditors = [];

    members.forEach((m) => {
      const bal = m.balance || 0;
      if (bal < -0.01) {
        debtors.push({ user: m.user || m, amount: Math.abs(bal) });
      } else if (bal > 0.01) {
        creditors.push({ user: m.user || m, amount: bal });
      }
    });

    const result = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0.01) {
        result.push({
          fromUser: debtor.user,
          toUser: creditor.user,
          amount: Math.round(settledAmount * 100) / 100,
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount <= 0.01) i++;
      if (creditor.amount <= 0.01) j++;
    }

    return result;
  }, [members]);

  // Settlements specifically involving the logged-in member
  const mySettlements = useMemo(() => {
    const myId = user?._id?.toString();
    return minimalSettlements.filter((s) => {
      const fromId = (s.fromUser?._id || s.fromUser)?.toString();
      const toId = (s.toUser?._id || s.toUser)?.toString();
      return fromId === myId || toId === myId;
    });
  }, [minimalSettlements, user?._id]);

  const displayedSettlements = (showAllGroupDebts && isAdmin) ? minimalSettlements : mySettlements;

  // Dynamic total group spending computed in real-time from transactions
  const totalSpent = useMemo(() => {
    if (transactions && transactions.length > 0) {
      return transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
    return currentTrip?.totalExpenses || 0;
  }, [transactions, currentTrip?.totalExpenses]);

  const expenseTransactions = useMemo(() => {
    return (transactions || []).filter((t) => t.type === 'expense');
  }, [transactions]);

  const avgSpendPerMember = useMemo(() => {
    return members.length > 0 ? Math.round((totalSpent / members.length) * 100) / 100 : 0;
  }, [totalSpent, members.length]);

  // Category-wise spending breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenseTransactions.forEach((t) => {
      const cat = t.category || 'General';
      map[cat] = (map[cat] || 0) + (t.amount || 0);
    });

    const list = Object.entries(map).map(([catName, amt]) => {
      const meta = getCategoryMeta(catName);
      const pct = totalSpent > 0 ? Math.min(Math.round((amt / totalSpent) * 100), 100) : 0;
      return {
        category: catName,
        amount: amt,
        percentage: pct,
        emoji: meta.emoji,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions, totalSpent]);

  // Per-companion total spending contribution
  const memberPaidBreakdown = useMemo(() => {
    const map = {};
    expenseTransactions.forEach((t) => {
      const pId = (t.payer?._id || t.payer)?.toString();
      if (pId) {
        map[pId] = (map[pId] || 0) + (t.amount || 0);
      }
    });

    return members.map((m) => {
      const u = m.user || m;
      const uId = (u._id || u)?.toString();
      const paid = map[uId] || 0;
      const pct = totalSpent > 0 ? Math.min(Math.round((paid / totalSpent) * 100), 100) : 0;
      const balance = Math.round((m.balance || 0) * 100) / 100;
      const isMe = uId === user?._id?.toString();
      return {
        user: u,
        paid,
        percentage: pct,
        balance,
        isMe,
      };
    }).sort((a, b) => b.paid - a.paid);
  }, [expenseTransactions, members, totalSpent, user?._id]);

  const budget = currentTrip?.budget || 0;
  const budgetPct = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : null;

  // Handle Quick Settlement Submission
  const handleConfirmSettle = async () => {
    if (!settleDebt) return;
    try {
      setIsSettling(true);
      const fromId = (settleDebt.fromUser?._id || settleDebt.fromUser)?.toString();
      const toId = (settleDebt.toUser?._id || settleDebt.toUser)?.toString();

      await logTransaction({
        tripId: id,
        amount: settleDebt.amount,
        description: `Settlement: ${settleDebt.fromUser?.name || 'Debtor'} → ${settleDebt.toUser?.name || 'Creditor'}`,
        category: 'Settlement',
        payer: fromId,
        type: 'settlement',
        splitType: 'individual',
        recipient: toId,
        sharedBy: [toId],
        splits: [{ user: toId, amount: settleDebt.amount }],
      });

      toast.success(`Settlement of ${currency}${settleDebt.amount.toLocaleString()} confirmed! 🤝`);
      setSettleDebt(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record settlement');
    } finally {
      setIsSettling(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await updateTrip(id, {
        name: editName.trim() || currentTrip.name,
        budget: Number(editBudget) >= 0 ? Number(editBudget) : currentTrip.budget,
        coverPhoto: editCoverPhoto || currentTrip.coverPhoto
      });
      toast.success('Trip settings updated!');
      setShowSettingsModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleCloseVault = async () => {
    try {
      setIsClosingVault(true);
      await closeTrip(id, isClosed);
      toast.success(isClosed ? 'Trip vault reopened!' : 'Trip vault finalized & archived! 🔒');
      setShowSettingsModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update vault status');
    } finally {
      setIsClosingVault(false);
    }
  };

  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <DashboardSkeleton />;
  }

  if (fetchError || !currentTrip) {
    return (
      <div className="p-8 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-heading">Trip Vault Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-6">{fetchError || 'Unable to load trip vault'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          Back to All Trips
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* CLOSED VAULT BANNER                                                       */}
      {/* ========================================================================= */}
      {isClosed && (
        <div className="p-4 bg-slate-900 text-white rounded-3xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span>🔒</span>
            <span>This trip vault is finalized and archived. No new expenses can be added.</span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleToggleCloseVault}
              disabled={isClosingVault}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Reopen
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP TRIP NAV & CONTROLS                                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>All Trips</span>
        </button>

        <div className="flex items-center gap-2">
          {/* User Profile Avatar Pill */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1.5 pr-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl shadow-2xs transition-all active:scale-95 text-left group"
            title="Profile & Settings"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] hidden sm:inline group-hover:text-indigo-600">
              {user?.name?.split(' ')[0] || 'Profile'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
            title="Sync Vault"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditName(currentTrip.name);
              setEditBudget(currentTrip.budget?.toString() || '');
              setEditCoverPhoto(currentTrip.coverPhoto || coverPhoto);
              setShowSettingsModal(true);
            }}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
            title="Trip Settings"
          >
            <SlidersHorizontal size={16} />
          </button>
          
          <button
            type="button"
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HD COVER PHOTO HERO BANNER & SUMMARY                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/90 shadow-xs space-y-5">
        
        {/* Full-Width HD Travel Cover Photo */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-900 overflow-hidden group">
          <img 
            src={coverPhoto} 
            alt={currentTrip.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-6 text-white">
            
            {/* Top Status Tags */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">
                {currentTrip.destination || 'Trip Vault'}
              </span>
              
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <label className="cursor-pointer px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-xs">
                    <Camera size={11} />
                    <span>Change Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <span className="text-xs text-slate-200 font-semibold bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                  Currency: {currency}
                </span>
              </div>
            </div>

            {/* Destination Title & Avatars */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm truncate">
                {currentTrip.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center -space-x-2">
                  {members.slice(0, 5).map((m, idx) => {
                    const u = m.user || m;
                    return (
                      <div
                        key={u._id || idx}
                        className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center overflow-hidden shadow-xs"
                        title={u.name}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-slate-200 drop-shadow-xs">
                  {members.length} companions
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Hero Bottom Body */}
        <div className="p-6 pt-0 space-y-5">
          
          {/* Primary Net Balance Pill */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Your Net Balance</p>
              <div className="mt-1 flex items-baseline gap-2">
                {netPosition > 0.01 ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                      +{currency}{netPosition.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      You are owed in total
                    </span>
                  </>
                ) : netPosition < -0.01 ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-black text-rose-600">
                      -{currency}{Math.abs(netPosition).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                      You owe in total
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">
                      {currency}0.00
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                      All settled up ✓
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {!isClosed && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/trip/${id}/add-money`)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>Add Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/trip/${id}/add-money?mode=settle`)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <HandCoins size={15} />
                    <span>Settle Up</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group Spend & Budget Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Total Group Spend: {currency}{totalSpent.toLocaleString()}</span>
              {budget > 0 && (
                <span className={budgetPct >= 90 ? 'text-rose-600' : 'text-slate-500'}>
                  Budget: {currency}{budget.toLocaleString()} ({budgetPct}%)
                </span>
              )}
            </div>
            {budget > 0 && (
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPct >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                ></div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MINIMAL SETTLEMENT STRIP ("WHO YOU OWE / WHO OWES YOU")                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {isAdmin && showAllGroupDebts ? 'All Group Settlements' : 'Your Settlements'}
            </h2>
            {isAdmin && minimalSettlements.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllGroupDebts(!showAllGroupDebts)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {showAllGroupDebts ? '• Show Only Mine' : '• Show All Group Debts'}
              </button>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {displayedSettlements.length === 0 ? 'Zero outstanding debts' : `${displayedSettlements.length} settlement(s)`}
          </span>
        </div>

        {displayedSettlements.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs font-medium bg-emerald-50/50 rounded-2xl border border-emerald-100">
            ✨ You are all squared up! No outstanding payments pending for you.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedSettlements.map((settle, idx) => {
              const fromName = settle.fromUser?.name || 'Someone';
              const toName = settle.toUser?.name || 'Someone';
              const isFromMe = (settle.fromUser?._id || settle.fromUser)?.toString() === user?._id?.toString();
              const isToMe = (settle.toUser?._id || settle.toUser)?.toString() === user?._id?.toString();
              const involvesMe = isFromMe || isToMe;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    involvesMe 
                      ? (isFromMe ? 'bg-rose-50/50 border-rose-200/80' : 'bg-emerald-50/50 border-emerald-200/80')
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold truncate ${isFromMe ? 'text-rose-900' : isToMe ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {isFromMe ? 'You owe' : fromName}
                    </span>
                    <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    <span className={`text-xs font-bold truncate ${isToMe ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {isToMe ? 'You' : toName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-black ${isFromMe ? 'text-rose-700' : isToMe ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {currency}{settle.amount.toLocaleString()}
                    </span>

                    {(involvesMe || isAdmin) && !isClosed && (
                      <button
                        type="button"
                        onClick={() => setSettleDebt(settle)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1 ${
                          isFromMe 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <span>{isFromMe ? 'Settle' : 'Record Paid'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GROUP SPENDING & ANALYTICS INSIGHTS CARD                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        
        {/* Header with Quick Export */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                Group Spending & Analytics
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {expenseTransactions.length} total expenses • Avg {currency}{avgSpendPerMember.toLocaleString()} / person
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <Download size={13} />
            <span>Export Statement</span>
          </button>
        </div>

        {/* 3 Metric Summary Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Total Group Spend
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {currency}{totalSpent.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Average / Companion
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 font-heading">
              {currency}{avgSpendPerMember.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Budget Status
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {budget > 0 ? `${budgetPct}% used` : 'No Limit'}
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Spending by Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span>{item.emoji}</span>
                      <span>{item.category}</span>
                    </span>
                    <span>{currency}{item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companion Spending Contributions */}
        {memberPaidBreakdown.length > 0 && (
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Companion Spending & Coverage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {memberPaidBreakdown.map((m) => (
                <div 
                  key={m.user._id || m.user} 
                  className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-slate-200">
                      {m.user.avatar ? (
                        <img src={m.user.avatar} alt={m.user.name} className="w-full h-full object-cover" />
                      ) : (
                        m.user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {m.user.name} {m.isMe ? '(You)' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Paid {currency}{m.paid.toLocaleString()} ({m.percentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                      m.balance > 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : m.balance < 0 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {m.balance > 0 
                        ? `+${currency}${m.balance.toLocaleString()}` 
                        : m.balance < 0 
                        ? `-${currency}${Math.abs(m.balance).toLocaleString()}` 
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* RECENT ACTIVITY LOGS                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Recent Expenses
          </h2>
          <button
            type="button"
            onClick={() => navigate(`/trip/${id}/history`)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>All Logs</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <Receipt size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No expenses recorded yet.</p>
            {!isClosed && (
              <button
                type="button"
                onClick={() => navigate(`/trip/${id}/add-money`)}
                className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add First Expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 6).map((tx) => {
              const meta = getCategoryMeta(tx.category || (tx.type === 'settlement' ? 'Settlement' : 'General'));
              const isSettlement = tx.type === 'settlement';
              const payerName = tx.payer?.name || 'Unknown';
              const isPayerMe = (tx.payer?._id || tx.payer)?.toString() === user?._id?.toString();

              return (
                <div
                  key={tx._id}
                  onClick={() => setSelectedTx(tx)}
                  className="py-3.5 px-2 hover:bg-slate-50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      {isSettlement ? '🤝' : meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {isSettlement 
                          ? `Settlement payment` 
                          : `${isPayerMe ? 'Paid by You' : `Paid by ${payerName}`} • ${new Date(tx.createdAt || 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {currency}{tx.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TRANSACTION DETAIL MODAL                                                  */}
      {/* ========================================================================= */}
      {selectedTx && (
        <TransactionDetailModal
          isOpen={!!selectedTx}
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={async (txId) => {
            await deleteTransaction(txId, id);
            setSelectedTx(null);
            toast.success('Expense removed');
          }}
          currency={currency}
          currentUser={user}
          isAdmin={isAdmin}
        />
      )}

      {/* ========================================================================= */}
      {/* SHARE / INVITE MODAL                                                      */}
      {/* ========================================================================= */}
      {showShareModal && (
        <ShareTripModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          trip={currentTrip}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK SETTLE CONFIRMATION MODAL                                           */}
      {/* ========================================================================= */}
      {settleDebt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <HandCoins size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {(settleDebt.fromUser?._id || settleDebt.fromUser)?.toString() === user?._id?.toString()
                ? 'Settle Outstanding Payment'
                : 'Record Payment Received'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {(settleDebt.toUser?._id || settleDebt.toUser)?.toString() === user?._id?.toString()
                ? `Mark ${currency}${settleDebt.amount.toLocaleString()} as received from ${settleDebt.fromUser?.name}.`
                : `Mark ${currency}${settleDebt.amount.toLocaleString()} as settled from ${settleDebt.fromUser?.name} to ${settleDebt.toUser?.name}.`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSettleDebt(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                disabled={isSettling}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isSettling 
                  ? 'Saving...' 
                  : (settleDebt.fromUser?._id || settleDebt.fromUser)?.toString() === user?._id?.toString()
                  ? 'Confirm Settle ✓'
                  : 'Confirm Paid ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SETTINGS & ARCHIVE MODAL                                                  */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 relative">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">Trip Settings</h3>
            <p className="text-xs text-slate-500 mb-5">Update destination name or manage vault status</p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Trip Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={!isAdmin}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                  Budget ({currency})
                </label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  min="0"
                  disabled={!isAdmin}
                  placeholder="Optional total budget"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                />
              </div>

              {isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Cover Photo Theme or Custom
                    </label>
                    <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      <Upload size={11} />
                      <span>Upload Custom</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSettingsPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photo Preview inside Settings */}
                  {editCoverPhoto && (
                    <div className="relative h-20 rounded-2xl overflow-hidden mb-2.5 border border-slate-200 shadow-2xs">
                      <img src={editCoverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-between p-2.5 text-white">
                        <span className="text-[10px] font-bold drop-shadow-xs">Active Cover Selection</span>
                        <label className="cursor-pointer px-2 py-1 bg-black/50 hover:bg-black/70 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all">
                          <Camera size={10} />
                          <span>Change File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSettingsPhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-1.5">
                    {COVER_PHOTOS.map((photo) => {
                      const isSelected = editCoverPhoto === photo.url;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setEditCoverPhoto(photo.url)}
                          className={`relative h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected 
                              ? 'border-indigo-600 shadow-xs ring-2 ring-indigo-500/20 scale-105' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Export helpers */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowExportModal(true);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Export PDF & CSV Statements</span>
                </button>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    type="button"
                    onClick={handleToggleCloseVault}
                    disabled={isClosingVault}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isClosed 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isClosingVault ? 'Updating...' : (isClosed ? 'Reopen Trip Vault' : 'Archive / Finalize Vault 🔒')}
                  </button>
                </div>
              )}

              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          trip={currentTrip}
          transactions={transactions}
          companionDebts={companionDebts}
          user={user}
        />
      )}

    </div>
  );
}