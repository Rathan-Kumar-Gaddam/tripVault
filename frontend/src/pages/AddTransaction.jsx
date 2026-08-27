import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useTripStore, { getPayerDebts } from '../store/useTripStore';
import { 
  ArrowLeft, 
  Check, 
  ArrowRight, 
  HandCoins, 
  Receipt,
  Camera,
  Trash2,
  Users,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { PRESET_CATEGORIES, predictCategoryObject } from '../utils/aiCategoryPredictor';

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

export default function AddTransaction() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, logTransaction } = useTripStore();

  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'settle' ? 'settlement' : 'expense';
  const queryFrom = searchParams.get('from') || '';
  const initialRecipient = searchParams.get('with') || '';
  const initialAmount = searchParams.get('amount') || '';
  
  const [mode, setMode] = useState(initialMode); // 'expense' | 'settlement'
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isManuallySet, setIsManuallySet] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [receipt, setReceipt] = useState('');
  
  // Expense Payer state (defaults to logged-in user)
  const [payerId, setPayerId] = useState(() => user?._id || '');
  
  // Custom selected members for split (null = default to everyone)
  const [customSelectedIds, setCustomSelectedIds] = useState(null);
  
  // Settlement state
  const [settlePayer, setSettlePayer] = useState(() => queryFrom || user?._id || '');
  const [settleRecipient, setSettleRecipient] = useState(initialRecipient);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id).catch((err) => {
        if (isMounted) {
          setFetchError(err.response?.data?.message || err.message || 'Failed to load trip details');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id, currentTrip, fetchTripDetails]);

  const members = useMemo(() => currentTrip?.members || [], [currentTrip?.members]);
  const currency = currentTrip?.currency || '₹';

  const allMemberIds = useMemo(() => {
    return members.map((m) => (m.user?._id || m.user)?.toString()).filter(Boolean);
  }, [members]);

  const selectedUserIds = customSelectedIds !== null ? customSelectedIds : allMemberIds;

  const myData = members.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = (currentTrip?.createdBy?._id || currentTrip?.createdBy)?.toString() === user?._id?.toString() || myData?.role === 'admin';
  const [showAdminPayerSelect, setShowAdminPayerSelect] = useState(false);

  // Compute debts owed specifically by settlePayer
  const payerDebts = useMemo(() => {
    return getPayerDebts(settlePayer, members, transactions);
  }, [settlePayer, members, transactions]);

  const isPayerMe = settlePayer?.toString() === user?._id?.toString();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'settlement') {
      const debts = getPayerDebts(settlePayer, members, transactions);
      if (debts.length > 0) {
        const first = debts[0];
        setSettleRecipient((first.user?._id || first.user)?.toString());
        setAmount(first.amount.toString());
      } else {
        setSettleRecipient('');
        setAmount('');
      }
    }
  };

  // Handle Debtor / Payer switch in settlement mode (Admin only)
  const handleSelectSettlePayer = (debtorId) => {
    setSettlePayer(debtorId);
    const newDebts = getPayerDebts(debtorId, members, transactions);
    if (newDebts.length > 0) {
      const first = newDebts[0];
      setSettleRecipient((first.user?._id || first.user)?.toString());
      setAmount(first.amount.toString());
    } else {
      setSettleRecipient('');
      setAmount('');
    }
  };

  // Handle Creditor selection with automatic pre-filled amount
  const handleSelectCreditor = (creditor) => {
    const credId = (creditor.user?._id || creditor.user)?.toString();
    setSettleRecipient(credId);
    setAmount(creditor.amount.toString());
    toast.success(`Pre-filled ${currency}${creditor.amount.toLocaleString()} owed to ${creditor.user.name || 'creditor'}`);
  };

  // Real-time AI Category Auto-Tagger on description typing
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    if (val.trim().length >= 2) {
      const match = predictCategoryObject(val);
      if (match) {
        setCategory(match.categoryId);
        setDetectedCategory(match);
      } else {
        if (!isManuallySet) {
          setCategory('General');
        }
        setDetectedCategory(null);
      }
    } else {
      if (!isManuallySet) {
        setCategory('General');
      }
      setDetectedCategory(null);
    }
  };

  const handleManualCategorySelect = (catId) => {
    setCategory(catId);
    setIsManuallySet(true);
    setDetectedCategory(null);
  };

  const handleToggleMember = (memberId) => {
    const currentList = selectedUserIds;
    if (currentList.includes(memberId)) {
      if (currentList.length === 1) {
        toast('Expense must be split with at least 1 person.', { icon: 'ℹ️' });
        return;
      }
      setCustomSelectedIds(currentList.filter((idStr) => idStr !== memberId));
    } else {
      setCustomSelectedIds([...currentList, memberId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === allMemberIds.length) {
      // Keep only current user
      setCustomSelectedIds([user?._id?.toString()]);
    } else {
      setCustomSelectedIds(allMemberIds);
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceipt(reader.result);
      toast.success('Receipt attached! 📸');
    };
    reader.readAsDataURL(file);
  };

  const numAmount = parseFloat(amount) || 0;
  const splitCount = selectedUserIds.length || 1;
  const perPersonShare = numAmount > 0 ? (numAmount / splitCount).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === 'expense') {
        if (!description.trim()) {
          toast.error('Please enter an expense description.');
          return;
        }

        const isAllMembers = selectedUserIds.length === members.length;
        const sharePerPerson = Math.round((numAmount / splitCount) * 100) / 100;
        const splits = selectedUserIds.map((uId) => ({
          user: uId,
          amount: sharePerPerson,
        }));

        await logTransaction({
          tripId: id,
          amount: numAmount,
          description: description.trim(),
          category: category || 'General',
          payer: payerId || user?._id,
          type: 'expense',
          splitType: isAllMembers ? 'all' : 'custom',
          sharedBy: selectedUserIds,
          splits,
          receipt: receipt || undefined,
        });

        toast.success(`Expense of ${currency}${numAmount.toLocaleString()} added! 🎉`);
        navigate(`/trip/${id}`);
      } else {
        // Settlement mode
        if (!settlePayer || !settleRecipient) {
          toast.error('Please select both debtor and recipient.');
          return;
        }
        if (settlePayer === settleRecipient) {
          toast.error('Payer and recipient cannot be the same person.');
          return;
        }

        const fromMember = members.find((m) => (m.user?._id || m.user)?.toString() === settlePayer);
        const toMember = members.find((m) => (m.user?._id || m.user)?.toString() === settleRecipient);
        const fromName = fromMember?.user?.name || 'Someone';
        const toName = toMember?.user?.name || 'Someone';

        await logTransaction({
          tripId: id,
          amount: numAmount,
          description: description.trim() || `Settlement: ${fromName} → ${toName}`,
          category: 'Settlement',
          payer: settlePayer,
          type: 'settlement',
          splitType: 'individual',
          recipient: settleRecipient,
          sharedBy: [settleRecipient],
          splits: [{ user: settleRecipient, amount: numAmount }],
          receipt: receipt || undefined,
        });

        toast.success(`Settlement of ${currency}${numAmount.toLocaleString()} recorded! 🎉`);
        navigate(`/trip/${id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
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

  const currentPayerMember = members.find((m) => (m.user?._id || m.user)?.toString() === settlePayer);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => navigate(`/trip/${id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Cancel</span>
        </button>

        <span className="text-xs font-bold text-slate-400">
          {currentTrip.name}
        </span>
      </div>

      {/* Mode Switcher: Expense vs Settlement */}
      <div className="flex p-1.5 bg-slate-100/90 rounded-2xl">
        <button
          type="button"
          onClick={() => handleModeChange('expense')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === 'expense'
              ? 'bg-white shadow-xs text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt size={14} />
          <span>Add Expense</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('settlement')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === 'settlement'
              ? 'bg-white shadow-xs text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HandCoins size={14} />
          <span>Record Settlement</span>
        </button>
      </div>

      {/* Main Card Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        
        {/* Amount Input Hero */}
        <div className="text-center space-y-3 pt-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {mode === 'expense' ? 'Expense Amount' : 'Settlement Amount'}
          </label>
          <div className="flex items-center justify-center gap-1.5 text-slate-900">
            <span className="text-2xl sm:text-3xl font-black text-slate-400">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              step="any"
              min="0.01"
              required
              autoFocus
              className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 placeholder:text-slate-200 outline-none w-52 text-center bg-transparent"
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95"
              >
                +{currency}{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Description / Note */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {mode === 'expense' ? 'What was this for? *' : 'Settlement Note (Optional)'}
            </label>
            {mode === 'expense' && (
              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                <Sparkles size={11} />
                <span>Auto-categorizes as you type</span>
              </span>
            )}
          </div>

          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            placeholder={mode === 'expense' ? "e.g. Seafood Dinner, Uber to airport, Taj Hotel, Scuba diving" : "e.g. GooglePay transfer, Cash settlement"}
            required={mode === 'expense'}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all"
          />

          {/* Live Auto-Tagged Category Banner */}
          {detectedCategory && mode === 'expense' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-50 border border-indigo-200/90 rounded-2xl text-xs text-indigo-900 animate-in fade-in slide-in-from-top-1">
              <Sparkles size={14} className="text-indigo-600 shrink-0 animate-pulse" />
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[11px] font-medium text-slate-600">Auto-tagged as</span>
                <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-black shadow-2xs inline-flex items-center gap-1">
                  <span>{detectedCategory.emoji}</span>
                  <span>{detectedCategory.label}</span>
                </span>
                <span className="text-[10px] text-indigo-400 font-medium italic">
                  (matched "{detectedCategory.matchedKeyword}")
                </span>
              </div>
            </div>
          )}
        </div>

        {/* EXPENSE SPECIFIC: Category Chips */}
        {mode === 'expense' && (
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleManualCategorySelect(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {isSelected && <Check size={12} strokeWidth={3} className="ml-0.5 text-indigo-300" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPENSE SPECIFIC: WHO PAID (AVATAR SELECTOR)                              */}
        {/* ========================================================================= */}
        {mode === 'expense' && (
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
              Paid By
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {members.map((m) => {
                const u = m.user || m;
                const isSelected = payerId === u._id?.toString() || (!payerId && u._id === user?._id);
                const isMe = u._id === user?._id;

                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => setPayerId(u._id?.toString())}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">
                        {u.name} {isMe ? '(You)' : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3.5} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPENSE SPECIFIC: SPLIT WITH COMPANION AVATARS & LIVE SHARE BADGES        */}
        {/* ========================================================================= */}
        {mode === 'expense' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Split with ({splitCount} people • {currency}{perPersonShare} each)
                </label>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {selectedUserIds.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {members.map((m) => {
                const u = m.user || m;
                const isSelected = selectedUserIds.includes(u._id?.toString());
                const isMe = u._id === user?._id;

                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => handleToggleMember(u._id?.toString())}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all text-left ${
                      isSelected 
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Circle */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border ${
                        isSelected 
                          ? 'border-indigo-300 bg-indigo-600 text-white' 
                          : 'border-slate-200 bg-slate-200 text-slate-500'
                      }`}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                          {u.name} {isMe ? '(You)' : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isSelected ? 'Sharing bill' : 'Excluded'}
                        </p>
                      </div>
                    </div>

                    {/* Calculated Share Pill */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-2xs">
                          {currency}{perPersonShare}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-400 text-[10px] font-bold">
                          —
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SETTLEMENT SPECIFIC: ISOLATED TO WHO THIS MEMBER OWES                     */}
        {/* ========================================================================= */}
        {mode === 'settlement' && (
          <div className="space-y-5">
            
            {/* Optional Admin Switcher to record on behalf of others */}
            {isAdmin && (
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-bold text-slate-400">
                  {isPayerMe ? 'Recording payment from You' : `Recording payment from ${currentPayerMember?.user?.name || 'Companion'}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdminPayerSelect(!showAdminPayerSelect)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {showAdminPayerSelect ? 'Hide Payer Selector' : 'Switch Payer (Admin)'}
                </button>
              </div>
            )}

            {/* Admin Payer Selector Dropdown (Only visible if Admin expanded it) */}
            {isAdmin && showAdminPayerSelect && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Select Who Sent Money:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {members.map((m) => {
                    const u = m.user || m;
                    const uId = (u._id || u)?.toString();
                    const isSelected = settlePayer === uId;
                    const isMe = uId === user?._id?.toString();
                    const bal = Math.round((m.balance || 0) * 100) / 100;
                    const owesMoney = bal < -0.01;

                    return (
                      <button
                        key={uId}
                        type="button"
                        onClick={() => handleSelectSettlePayer(uId)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          isSelected 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 overflow-hidden shrink-0">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                        </div>
                        <span className="text-xs font-bold truncate">{u.name} {isMe ? '(You)' : ''}</span>
                        {owesMoney && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 ml-auto"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Who is owed money - Isolated strictly to who this payer owes */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                {isPayerMe ? 'Who you owe money to:' : `Who ${currentPayerMember?.user?.name || 'this member'} owes money to:`}
              </label>

              {payerDebts.length === 0 ? (
                <div className="p-6 bg-emerald-50/80 border border-emerald-200/90 rounded-3xl text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-sm font-bold text-emerald-900">
                    {isPayerMe ? 'You are all settled up! 🎉' : `${currentPayerMember?.user?.name || 'This companion'} has zero debts! 🎉`}
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {isPayerMe 
                      ? "You don't owe any money to anyone in this trip vault."
                      : "Everyone is already settled up with this member in this vault."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {payerDebts.map((creditor) => {
                    const credId = (creditor.user?._id || creditor.user)?.toString();
                    const isSelected = settleRecipient === credId;
                    const isCredMe = credId === user?._id?.toString();

                    return (
                      <button
                        key={credId}
                        type="button"
                        onClick={() => handleSelectCreditor(creditor)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all text-left ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20 scale-[1.01]' 
                            : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                          }`}>
                            {creditor.user.avatar ? (
                              <img src={creditor.user.avatar} alt={creditor.user.name} className="w-full h-full object-cover" />
                            ) : (
                              creditor.user.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">
                              {creditor.user.name} {isCredMe ? '(You)' : ''}
                            </p>
                            <p className={`text-[10px] font-medium ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                              {isPayerMe ? `You owe ${creditor.user.name?.split(' ')[0]}` : `Owed to ${creditor.user.name?.split(' ')[0]}`}
                            </p>
                          </div>
                        </div>

                        {/* Pre-fill Owed Amount Pill */}
                        <div className="shrink-0 text-right">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs inline-block ${
                            isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                          }`}>
                            {currency}{creditor.amount.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Optional Receipt Attachment */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors">
            <Camera size={16} />
            <span>{receipt ? 'Change Receipt Photo' : 'Attach Receipt / Payment Proof'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </label>

          {receipt && (
            <button
              type="button"
              onClick={() => setReceipt('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || numAmount <= 0 || (mode === 'settlement' && (!settleRecipient || payerDebts.length === 0))}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : (
            <>
              <span>{mode === 'expense' ? 'Save Expense' : 'Confirm Settlement'}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

    </div>
  );
}