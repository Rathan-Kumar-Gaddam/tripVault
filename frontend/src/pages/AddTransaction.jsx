import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  ArrowLeft, 
  Check, 
  Circle, 
  Sparkles, 
  Users, 
  Calculator, 
  UserCheck, 
  DollarSign, 
  ArrowRight, 
  HandCoins, 
  ReceiptText, 
  HelpCircle, 
  Send,
  Camera,
  Trash2,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import CustomSelect from '../components/CustomSelect';
import CategoryPicker from '../components/CategoryPicker';
import { predictCategoryFromDescription } from '../utils/aiCategoryPredictor';
import { getCategoryMeta } from '../utils/categoryUtils';

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

export default function AddTransaction() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, currentTrip, fetchTripDetails, logTransaction, createFundRequest, isLoading } = useTripStore();

  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'settle' ? 'settlement' : (queryMode === 'ask' ? 'ask' : 'expense');
  const initialRecipient = searchParams.get('with') || '';
  const initialAmount = searchParams.get('amount') || '';
  
  const [tab, setTab] = useState(initialMode); // 'expense' | 'ask' | 'settlement'
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isCustomCategoryOpen, setIsCustomCategoryOpen] = useState(false);
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  const [receipt, setReceipt] = useState('');
  
  // Payer state (defaults to logged-in user)
  const [payerId, setPayerId] = useState('');
  
  // Expense split states
  const [splitMode, setSplitMode] = useState('all'); // 'all' | 'individual' | 'custom'
  const [selectedUser, setSelectedUser] = useState(initialRecipient); 
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [isCustomExact, setIsCustomExact] = useState(false);
  const [customAmounts, setCustomAmounts] = useState({}); // { [userId]: amount }
  
  // Ask Funds state
  const [askTargetUser, setAskTargetUser] = useState(initialRecipient);

  // Settlement states
  const [settlePayer, setSettlePayer] = useState('');
  const [settleRecipient, setSettleRecipient] = useState(initialRecipient);
  const [settleNote, setSettleNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      setFetchError(null);
      fetchTripDetails(id).catch((err) => {
        setFetchError(err.response?.data?.message || err.message || 'Failed to load trip details');
      });
    }
  }, [id]);

  useEffect(() => {
    if (user?._id && !payerId) {
      setPayerId(user._id);
    }
    if (user?._id && !settlePayer) {
      setSettlePayer(user._id);
    }
  }, [user]);

  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <DashboardSkeleton />;
  }

  if (fetchError || !currentTrip) {
    return (
      <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{fetchError || 'Trip Not Found'}</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl"
        >
          ← Back to Trips
        </button>
      </div>
    );
  }

  const currency = currentTrip?.currency || '₹';
  const members = currentTrip?.members || [];

  const handleQuickAdd = (val) => {
    const current = Number(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleToggleUser = (userId) => {
    if (isSubmitting) return;
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(uid => uid !== userId) : [...prev, userId]
    );
  };

  const handleCustomAmountChange = (userId, val) => {
    setCustomAmounts(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  // Calculations for live breakdown
  const numericAmount = Number(amount) || 0;
  
  let activeSplitUsers = [];
  if (splitMode === 'all') {
    activeSplitUsers = members.map(m => m.user?._id || m.user);
  } else if (splitMode === 'self') {
    activeSplitUsers = payerId ? [payerId] : [user?._id];
  } else if (splitMode === 'individual') {
    activeSplitUsers = selectedUser ? [selectedUser] : [];
  } else if (splitMode === 'custom') {
    activeSplitUsers = selectedUsers;
  }

  const activeSplitCount = activeSplitUsers.length || 1;
  const perPersonShare = numericAmount > 0 ? (numericAmount / activeSplitCount) : 0;

  // Custom exact sum check
  const customSum = Object.entries(customAmounts)
    .filter(([uId]) => activeSplitUsers.includes(uId))
    .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);
  const customDifference = Math.round((numericAmount - customSum) * 100) / 100;

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    setDescription(text);
    if (!hasManuallySelectedCategory && text.trim()) {
      const pred = predictCategoryFromDescription(text);
      if (pred?.categoryId) {
        setCategory(pred.categoryId);
      }
    }
  };

  const handleSelectCategory = (catId) => {
    setCategory(catId);
    setHasManuallySelectedCategory(true);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setReceipt(compressedBase64);
        toast.success('Bill receipt photo attached! 📸');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    // ASK FUNDS MODE
    if (tab === 'ask') {
      if (!askTargetUser) {
        toast.error('Please select which companion to ask.');
        return;
      }
      const note = description.trim() || category;
      if (!note) {
        toast.error('Please enter what this request is for.');
        return;
      }

      try {
        setIsSubmitting(true);
        await createFundRequest({
          tripId: id,
          requestType: 'fund_request',
          targetUser: askTargetUser,
          amount: numericAmount,
          description: note,
          category,
        });
        toast.success('Fund request sent to companion! 📩');
        navigate(`/trip/${id}`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send fund request.');
        setIsSubmitting(false);
      }
      return;
    }

    // SETTLEMENT MODE
    if (tab === 'settlement') {
      if (!settleRecipient) {
        toast.error('Please select who received the payment.');
        return;
      }
      if (settlePayer === settleRecipient) {
        toast.error('Payer and recipient cannot be the same person.');
        return;
      }

      const desc = settleNote.trim() || `Settlement Payment`;
      const recipientMember = members.find(m => (m.user?._id || m.user)?.toString() === settleRecipient.toString());
      const recipientName = recipientMember?.user?.name || 'Companion';

      try {
        setIsSubmitting(true);
        await createFundRequest({
          tripId: id,
          requestType: 'settlement',
          targetUser: settleRecipient,
          amount: numericAmount,
          description: desc,
          category: 'Settlement',
        });
        toast.success(`Settlement payment sent to ${recipientName} for approval! 📩`);
        navigate(`/trip/${id}`);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to send settlement request.');
        setIsSubmitting(false);
      }
      return;
    }

    // EXPENSE MODE
    const trimmedDesc = description.trim() || category;
    if (!trimmedDesc) {
      toast.error('Please enter a description.');
      return;
    }

    if (!payerId) {
      toast.error('Please choose who paid for this expense.');
      return;
    }

    let finalSplits = [];
    let finalSharedBy = [];

    if (splitMode === 'all') {
      finalSharedBy = members.map(m => m.user?._id || m.user);
      finalSplits = finalSharedBy.map(uId => ({
        user: uId,
        amount: Math.round((numericAmount / finalSharedBy.length) * 100) / 100
      }));
    } else if (splitMode === 'self') {
      finalSharedBy = [payerId];
      finalSplits = [{ user: payerId, amount: numericAmount }];
    } else if (splitMode === 'individual') {
      if (!selectedUser) {
        toast.error('Please select a companion for this expense.');
        return;
      }
      finalSharedBy = [selectedUser];
      finalSplits = [{ user: selectedUser, amount: numericAmount }];
    } else if (splitMode === 'custom') {
      if (selectedUsers.length === 0) {
        toast.error('Please select at least one companion.');
        return;
      }
      finalSharedBy = selectedUsers;

      if (isCustomExact) {
        if (Math.abs(customDifference) > 0.05) {
          toast.error(`Custom splits sum (${currency}${customSum}) must equal total amount (${currency}${numericAmount}). Difference: ${currency}${customDifference}`);
          return;
        }
        finalSplits = selectedUsers.map(uId => ({
          user: uId,
          amount: Number(customAmounts[uId]) || 0
        }));
      } else {
        const splitVal = Math.round((numericAmount / selectedUsers.length) * 100) / 100;
        finalSplits = selectedUsers.map(uId => ({
          user: uId,
          amount: splitVal
        }));
      }
    }

    try {
      setIsSubmitting(true);
      const finalCat = category || predictCategoryFromDescription(trimmedDesc)?.categoryId || 'General';
      await logTransaction({
        tripId: id,
        type: 'expense',
        amount: numericAmount,
        description: trimmedDesc,
        category: finalCat,
        payer: payerId,
        splitType: splitMode,
        sharedBy: finalSharedBy,
        splits: finalSplits,
        receipt: receipt || '',
      });
      toast.success(splitMode === 'self' ? 'Personal expense logged! 👤' : 'Group expense logged & synced! 💸');
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log expense.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-24 sm:pb-20">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <button 
          onClick={() => navigate(`/trip/${id}`)} 
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            {tab === 'expense' ? 'Log Expense' : tab === 'ask' ? 'Ask Companion' : 'Settle Up'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">{currentTrip?.name}</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Mode Switcher: Expense vs Ask Funds vs Settlement */}
      <div className="flex p-1.5 bg-slate-200/70 rounded-2xl mb-6 gap-1.5 max-w-xl mx-auto w-full">
        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('expense')} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            tab === 'expense' 
              ? 'bg-white shadow-sm text-slate-900' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ReceiptText size={15} />
          <span>Expense</span>
        </button>

        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('ask')} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            tab === 'ask' 
              ? 'bg-amber-500 shadow-md shadow-amber-500/20 text-white' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HelpCircle size={15} />
          <span>Ask Funds</span>
        </button>

        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('settlement')} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            tab === 'settlement' 
              ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HandCoins size={15} />
          <span>Settle</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* ===================== EXPENSE MODE (Responsive 2-Column Grid on Desktop) ===================== */}
        {tab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Details, Amount, Payer & Category */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              
              {/* Who Paid Selector */}
              <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 px-1">
                  Who Paid for this?
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {members.map((m) => {
                    const mUser = m.user || m;
                    const isSelected = (mUser?._id || mUser) === payerId;
                    const isSelf = (mUser?._id || mUser) === user?._id;

                    return (
                      <button
                        key={mUser?._id || mUser}
                        type="button"
                        onClick={() => setPayerId(mUser?._id || mUser)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all shrink-0 active:scale-95 ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {mUser?.avatar ? (
                            <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                          ) : (
                            mUser?.name?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap">
                          {mUser?.name} {isSelf ? '(You)' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hero Amount Input Card */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Total Expense Amount
                </label>

                <div className="relative flex items-center justify-center w-full my-2">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    required 
                    disabled={isSubmitting}
                    className="text-4xl sm:text-5xl font-black text-slate-900 text-center outline-none w-56 bg-transparent tracking-tight font-heading placeholder:text-slate-300" 
                  />
                </div>

                {/* Quick amount increment chips */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickAdd(q)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all"
                    >
                      +{currency}{q}
                    </button>
                  ))}
                  {numericAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-400 active:scale-95 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block px-1">
                  Notes & Description
                </label>
                <input 
                  name="description" 
                  type="text" 
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="e.g. Seafood Dinner, Beach Scooters, Resort Stay" 
                  required 
                  disabled={isSubmitting}
                  className="w-full p-4 font-semibold text-slate-900 text-sm rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm" 
                />
              </div>

              {/* Interactive Category Override Chip */}
              {(() => {
                const catMeta = getCategoryMeta(category, id);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl p-1.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0">{catMeta.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">{catMeta.label}</span>
                            {!hasManuallySelectedCategory ? (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                ✨ Auto-Tag
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Category</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategoryOpen(!isCustomCategoryOpen)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 transition-all shrink-0 flex items-center gap-1 active:scale-95"
                      >
                        <span>{isCustomCategoryOpen ? 'Close' : 'Change'}</span>
                        {isCustomCategoryOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>

                    {isCustomCategoryOpen && (
                      <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl animate-fadeIn">
                        <CategoryPicker
                          selectedCategory={category}
                          onSelectCategory={(c) => { handleSelectCategory(c); setIsCustomCategoryOpen(false); }}
                          tripId={id}
                          onAutoFillDescription={(note) => { if (!description) setDescription(note); }}
                          currentDescription={description}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Receipt / Bill Photo Attachment */}
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Camera size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {receipt ? 'Bill Receipt Attached 📸' : 'Attach Bill Photo'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {receipt ? 'Bill attached for companion transparency' : 'Optional receipt snapshot'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="receipt-file-input" 
                    className="hidden" 
                    onChange={handleReceiptUpload} 
                  />
                  {receipt ? (
                    <div className="flex items-center gap-1.5">
                      <img src={receipt} alt="Receipt preview" className="w-9 h-9 rounded-xl object-cover border border-indigo-200 shadow-xs" />
                      <button 
                        type="button" 
                        onClick={() => setReceipt('')} 
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" 
                        title="Remove receipt"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="receipt-file-input" 
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold text-slate-700 rounded-xl cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>+ Add Photo</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Split Options Box & Submit */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <div className="bg-white p-6 border border-slate-200/80 rounded-[2.5rem] shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={16} className="text-indigo-600" />
                    <span>Split Options</span>
                  </p>
                  {numericAmount > 0 && !isCustomExact && (
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl flex items-center gap-1">
                      <Calculator size={13} />
                      <span>{splitMode === 'self' ? `${currency}${numericAmount.toFixed(2)} (100% you)` : `${currency}${perPersonShare.toFixed(2)} / person`}</span>
                    </span>
                  )}
                </div>

                {/* Quick Split Mode Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSplitMode('all'); setSelectedUser(''); setSelectedUsers([]); setIsCustomExact(false); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                      splitMode === 'all' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span>👥 Group</span>
                    <span className={`text-[9px] font-medium ${splitMode === 'all' ? 'text-indigo-200' : 'text-slate-400'}`}>Split All</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSplitMode('self'); setSelectedUser(''); setSelectedUsers([]); setIsCustomExact(false); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                      splitMode === 'self' 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span>👤 Only Me</span>
                    <span className={`text-[9px] font-medium ${splitMode === 'self' ? 'text-purple-200' : 'text-slate-400'}`}>No Split</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSplitMode('individual'); setSelectedUser(''); setSelectedUsers([]); setIsCustomExact(false); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                      splitMode === 'individual' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎯 1-on-1</span>
                    <span className={`text-[9px] font-medium ${splitMode === 'individual' ? 'text-indigo-200' : 'text-slate-400'}`}>1 Companion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSplitMode('custom'); setSelectedUser(''); setSelectedUsers([]); setIsCustomExact(false); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                      splitMode === 'custom' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎛️ Custom</span>
                    <span className={`text-[9px] font-medium ${splitMode === 'custom' ? 'text-indigo-200' : 'text-slate-400'}`}>Pick Friends</span>
                  </button>
                </div>
                
                <CustomSelect
                  value={splitMode}
                  disabled={isSubmitting}
                  onChange={(val) => {
                    setSplitMode(val);
                    setSelectedUser('');
                    setSelectedUsers([]);
                    setIsCustomExact(false);
                  }}
                  options={[
                    { value: 'all', label: 'Everyone in Trip', sublabel: 'Split equally across all members', icon: '👥' },
                    { value: 'self', label: 'Only for Myself', sublabel: 'Personal expense - No split', icon: '👤' },
                    { value: 'individual', label: 'Specific Companion', sublabel: '1-on-1 expense paid for 1 friend', icon: '🎯' },
                    { value: 'custom', label: 'Custom Selection', sublabel: 'Pick specific friends or custom amounts', icon: '🎛️' },
                  ]}
                />

                {/* Self / Personal Expense Explanation */}
                {splitMode === 'self' && (
                  <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3.5 animate-in fade-in duration-150">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-purple-600/20 mt-0.5">
                      👤
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-purple-950">Personal Expense (No Split)</h5>
                      <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                        {numericAmount > 0 ? (
                          <>100% of this <strong>{currency}{numericAmount.toFixed(2)}</strong> is for you. None of your companions will owe money or be billed.</>
                        ) : (
                          <>Logs this expense as a personal purchase. Companions will not be charged or owe any money.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Individual Split Companion Picker */}
                {splitMode === 'individual' && (
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Who You Paid For:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {members.map(m => {
                        const mUser = m.user || m;
                        const uid = mUser?._id || mUser;
                        const isSelected = selectedUser === uid;
                        const isSelf = uid === user?._id;

                        return (
                          <div 
                            key={uid}
                            onClick={() => setSelectedUser(uid)}
                            className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                              isSelected ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                                {mUser?.avatar ? (
                                  <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                                ) : (
                                  mUser?.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className={`font-bold text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {mUser.name} {isSelf ? '(You)' : ''}
                              </span>
                            </div>
                            {isSelected ? (
                              <div className="bg-indigo-600 text-white rounded-full p-1"><Check size={12} strokeWidth={4}/></div>
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Split UI */}
                {splitMode === 'custom' && (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500">Pick Included Companions:</span>
                      <button
                        type="button"
                        onClick={() => setIsCustomExact(!isCustomExact)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        {isCustomExact ? 'Switch to Equal Split' : 'Enter Exact Amounts'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {members.map(m => {
                        const mUser = m.user || m;
                        const uid = mUser?._id || mUser;
                        const isSelected = selectedUsers.includes(uid);

                        return (
                          <div 
                            key={uid} 
                            className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                              isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div 
                              onClick={() => handleToggleUser(uid)}
                              className="flex items-center gap-2.5 cursor-pointer flex-1"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                                {mUser?.avatar ? (
                                  <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                                ) : (
                                  mUser?.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className={`font-bold text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {mUser.name}
                              </span>
                            </div>

                            {isSelected && isCustomExact ? (
                              <div className="flex items-center gap-1 w-28">
                                <span className="text-xs font-bold text-slate-400">{currency}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={customAmounts[uid] || ''}
                                  onChange={(e) => handleCustomAmountChange(uid, e.target.value)}
                                  className="w-full p-2 text-xs font-bold text-slate-900 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                />
                              </div>
                            ) : (
                              <div 
                                onClick={() => handleToggleUser(uid)}
                                className="cursor-pointer p-1"
                              >
                                {isSelected ? (
                                  <div className="bg-indigo-600 text-white rounded-full p-1"><Check size={12} strokeWidth={4}/></div>
                                ) : (
                                  <Circle size={18} className="text-slate-300" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isCustomExact && numericAmount > 0 && (
                      <div className={`p-3 rounded-2xl text-xs font-bold flex justify-between items-center ${
                        Math.abs(customDifference) <= 0.05 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span>Allocated: {currency}{customSum.toFixed(2)} of {currency}{numericAmount.toFixed(2)}</span>
                        <span>{Math.abs(customDifference) <= 0.05 ? '✅ Balanced' : `Remaining: ${currency}${customDifference.toFixed(2)}`}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button for Expense */}
              <button 
                type="submit" 
                disabled={isSubmitting || numericAmount <= 0}
                className="w-full py-4 rounded-2xl font-bold text-sm sm:text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
              >
                {isSubmitting ? (
                  'Logging Expense...'
                ) : (
                  `Confirm & Log Expense (${currency}${numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================== ASK FUNDS MODE ===================== */}
        {tab === 'ask' && (
          <>
            {/* Target Companion Selector */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Ask Companion to Fund / Cover
                  </h3>
                  <p className="text-[11px] text-slate-400">Select which trip companion to ask for money</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                  Ask Whom? (Giver / Payer)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {members.map(m => {
                    const mUser = m.user || m;
                    const uid = (mUser?._id || mUser)?.toString();
                    if (uid === user?._id?.toString()) return null; // Cannot ask self

                    const isSelected = askTargetUser === uid;

                    return (
                      <div 
                        key={uid}
                        onClick={() => setAskTargetUser(uid)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                          isSelected ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                            {mUser?.avatar ? (
                              <img src={mUser.avatar} alt={mUser.name} className="w-full h-full object-cover" />
                            ) : (
                              mUser?.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className={`font-bold text-xs ${isSelected ? 'text-amber-950' : 'text-slate-700'}`}>
                            {mUser.name}
                          </span>
                        </div>
                        {isSelected ? (
                          <div className="bg-amber-600 text-white rounded-full p-1"><Check size={12} strokeWidth={4}/></div>
                        ) : (
                          <Circle size={18} className="text-slate-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Amount Input Card */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Amount to Ask
              </label>

              <div className="relative flex items-center justify-center w-full my-2">
                <span className="text-3xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  required 
                  disabled={isSubmitting}
                  className="text-4xl sm:text-5xl font-black text-amber-600 text-center outline-none w-52 bg-transparent tracking-tight font-heading placeholder:text-slate-300" 
                />
              </div>

              {/* Quick amount increment chips */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickAdd(q)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all"
                  >
                    +{currency}{q}
                  </button>
                ))}
                {numericAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-400 active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Custom-Themed Category Selector */}
            <CategoryPicker
              selectedCategory={category}
              onSelectCategory={setCategory}
              tripId={id}
              onAutoFillDescription={(note) => { if (!description) setDescription(note); }}
              currentDescription={description}
            />

            {/* Note / Description Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block px-1">
                Reason / Note
              </label>
              <input 
                name="description" 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Scuba diving ticket / lunch cash" 
                required 
                disabled={isSubmitting}
                className="w-full p-4 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm" 
              />
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 font-medium">
              💡 <strong>How it works:</strong> A pending request will be sent to your companion. Once they click <strong>Accept & Pay</strong> on their dashboard, the payment will be recorded, their money will be deducted, and your debt passbook will update automatically!
            </div>
          </>
        )}

        {/* ===================== SETTLEMENT MODE ===================== */}
        {tab === 'settlement' && (
          <>
            {/* Payer & Recipient Selection */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HandCoins size={15} className="text-emerald-600" />
                <span>Settlement Payment</span>
              </h3>

              {/* Who Paid Who Flow */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Who is Paying? (Sender)
                  </label>
                  <CustomSelect
                    value={settlePayer}
                    onChange={(val) => setSettlePayer(val)}
                    placeholder="Select Sender..."
                    options={members.map((m) => {
                      const mUser = m.user || m;
                      const uid = (mUser?._id || mUser)?.toString();
                      const isMe = uid === user?._id?.toString();
                      return {
                        value: uid,
                        label: isMe ? `${mUser?.name} (You)` : mUser?.name || 'Companion',
                        avatar: mUser?.avatar,
                        initials: mUser?.name?.charAt(0).toUpperCase() || '?',
                        sublabel: m.role === 'admin' ? 'Organizer' : 'Member',
                      };
                    })}
                  />
                </div>

                <div className="flex justify-center -my-1">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <ArrowRight size={14} className="rotate-90" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Who is Receiving? (Receiver to approve)
                  </label>
                  <CustomSelect
                    value={settleRecipient}
                    onChange={(val) => setSettleRecipient(val)}
                    placeholder="Select Receiver..."
                    options={members.map((m) => {
                      const mUser = m.user || m;
                      const uid = (mUser?._id || mUser)?.toString();
                      const isMe = uid === user?._id?.toString();
                      return {
                        value: uid,
                        label: isMe ? `${mUser?.name} (You)` : mUser?.name || 'Companion',
                        avatar: mUser?.avatar,
                        initials: mUser?.name?.charAt(0).toUpperCase() || '?',
                        sublabel: m.role === 'admin' ? 'Organizer' : 'Member',
                      };
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Settle Amount Card */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Settlement Amount
              </label>

              <div className="relative flex items-center justify-center w-full my-2">
                <span className="text-3xl font-bold text-slate-400 mr-2 font-heading">{currency}</span>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  required 
                  disabled={isSubmitting}
                  className="text-4xl sm:text-5xl font-black text-emerald-600 text-center outline-none w-52 bg-transparent tracking-tight font-heading placeholder:text-slate-300" 
                />
              </div>

              {/* Quick amount increment chips */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickAdd(q)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all"
                  >
                    +{currency}{q}
                  </button>
                ))}
                {numericAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-400 active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Payment Note */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block px-1">
                Settlement Note (Optional)
              </label>
              <input 
                name="settleNote" 
                type="text" 
                value={settleNote}
                onChange={(e) => setSettleNote(e.target.value)}
                placeholder="e.g. Paid via GooglePay / Cash / UPI" 
                disabled={isSubmitting}
                className="w-full p-4 font-semibold text-slate-900 text-sm rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm" 
              />
            </div>
          </>
        )}

        {/* Submit Button for Ask & Settlement Modes */}
        {tab !== 'expense' && (
          <div className="max-w-xl mx-auto w-full">
            <button 
              type="submit" 
              disabled={isSubmitting || numericAmount <= 0}
              className={`w-full py-4 rounded-2xl font-bold text-sm sm:text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 ${
                tab === 'settlement' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' 
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
              }`}
            >
              {isSubmitting ? (
                'Processing...'
              ) : tab === 'settlement' ? (
                <>
                  <HandCoins size={18} />
                  <span>Send Settlement for Approval ({currency}{numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Fund Request ({currency}{numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}