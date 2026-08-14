import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  ArrowLeft, 
  Check, 
  Circle, 
  Utensils, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingBag, 
  Coffee, 
  Sparkles,
  Users,
  Calculator,
  UserCheck,
  DollarSign,
  ArrowRight,
  HandCoins,
  ReceiptText,
  HelpCircle,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'Food & Dining', label: 'Food & Dining', icon: Utensils, emoji: '🍽️' },
  { id: 'Transport & Fuel', label: 'Transport & Fuel', icon: Car, emoji: '🚕' },
  { id: 'Stay & Hotels', label: 'Stay & Hotels', icon: Hotel, emoji: '🏨' },
  { id: 'Activities & Fun', label: 'Activities & Fun', icon: Ticket, emoji: '🎟️' },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, emoji: '🛍️' },
  { id: 'Snacks & Drinks', label: 'Snacks & Drinks', icon: Coffee, emoji: '☕' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

export default function AddTransaction() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, currentTrip, fetchTripDetails, logTransaction, createFundRequest } = useTripStore();

  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'settle' ? 'settlement' : (queryMode === 'ask' ? 'ask' : 'expense');
  const initialRecipient = searchParams.get('with') || '';
  const initialAmount = searchParams.get('amount') || '';
  
  const [tab, setTab] = useState(initialMode); // 'expense' | 'ask' | 'settlement'
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  
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

  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id);
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
      await logTransaction({
        tripId: id,
        type: 'expense',
        amount: numericAmount,
        description: trimmedDesc,
        category,
        payer: payerId,
        splitType: splitMode,
        sharedBy: finalSharedBy,
        splits: finalSplits,
      });
      toast.success('Expense added & split among companions! 💸');
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log expense.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-28">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(`/trip/${id}`)} 
          className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 font-heading">
            {tab === 'expense' ? 'Log Expense' : tab === 'ask' ? 'Ask Companion' : 'Settle Up'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">{currentTrip?.name}</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Mode Switcher: Expense vs Ask Funds vs Settlement */}
      <div className="flex p-1 bg-slate-200/70 rounded-2xl mb-5 gap-1">
        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('expense')} 
          className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            tab === 'expense' 
              ? 'bg-white shadow-sm text-slate-900' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ReceiptText size={13} />
          <span>Expense</span>
        </button>

        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('ask')} 
          className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            tab === 'ask' 
              ? 'bg-amber-500 shadow-md shadow-amber-500/20 text-white' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HelpCircle size={13} />
          <span>Ask Funds</span>
        </button>

        <button 
          type="button" 
          disabled={isSubmitting}
          onClick={() => setTab('settlement')} 
          className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            tab === 'settlement' 
              ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <HandCoins size={13} />
          <span>Settle</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* ===================== EXPENSE MODE ===================== */}
        {tab === 'expense' && (
          <>
            {/* Who Paid Selector */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-200/80 shadow-sm">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all shrink-0 active:scale-95 ${
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
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Total Expense Amount
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
                  className="text-4xl sm:text-5xl font-black text-slate-900 text-center outline-none w-52 bg-transparent tracking-tight font-heading placeholder:text-slate-300" 
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

            {/* Categories Grid */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id); if (!description) setDescription(cat.label); }}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20' 
                          : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-[10px] truncate w-full text-center">{cat.label}</span>
                    </button>
                  );
                })}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Seafood Dinner, Beach Scooters, Resort Stay" 
                required 
                disabled={isSubmitting}
                className="w-full p-4 font-medium text-sm rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm" 
              />
            </div>

            {/* Split Method Box */}
            <div className="bg-white p-5 border border-slate-200/80 rounded-[2rem] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  <span>Split Options</span>
                </p>
                {numericAmount > 0 && !isCustomExact && (
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Calculator size={12} />
                    <span>{currency}{perPersonShare.toFixed(2)} / person</span>
                  </span>
                )}
              </div>
              
              <select 
                value={splitMode} 
                disabled={isSubmitting}
                onChange={(e) => { 
                  setSplitMode(e.target.value); 
                  setSelectedUser(''); 
                  setSelectedUsers([]); 
                  setIsCustomExact(false);
                }} 
                className="w-full p-3.5 font-bold text-xs rounded-xl bg-slate-50 border border-slate-200 mb-3 outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-70 cursor-pointer"
              >
                <option value="all">Everyone in Trip (Split Equally)</option>
                <option value="individual">Specific Companion (Paid For 1 Person)</option>
                <option value="custom">Custom Selection (Pick Friends)</option>
              </select>

              {/* Individual Split Companion Picker */}
              {splitMode === 'individual' && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Who You Paid For:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {members.map(m => {
                      const mUser = m.user || m;
                      const uid = mUser?._id || mUser;
                      const isSelected = selectedUser === uid;
                      const isSelf = uid === user?._id;

                      return (
                        <div 
                          key={uid}
                          onClick={() => setSelectedUser(uid)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
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
                <div className="flex flex-col gap-3 mt-2">
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
                                className="w-full p-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right"
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
          </>
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

            {/* Category Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id); if (!description) setDescription(cat.label); }}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm ring-2 ring-amber-500/20' 
                          : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-[10px] truncate w-full text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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
                  <select 
                    value={settlePayer}
                    onChange={(e) => setSettlePayer(e.target.value)}
                    className="w-full p-3.5 font-bold text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Sender...</option>
                    {members.map((m) => {
                      const mUser = m.user || m;
                      const uid = mUser?._id || mUser;
                      return (
                        <option key={uid} value={uid}>
                          {mUser?.name} {uid === user?._id ? '(You)' : ''}
                        </option>
                      );
                    })}
                  </select>
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
                  <select 
                    value={settleRecipient}
                    onChange={(e) => setSettleRecipient(e.target.value)}
                    className="w-full p-3.5 font-bold text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Receiver...</option>
                    {members.map((m) => {
                      const mUser = m.user || m;
                      const uid = mUser?._id || mUser;
                      return (
                        <option key={uid} value={uid}>
                          {mUser?.name} {uid === user?._id ? '(You)' : ''}
                        </option>
                      );
                    })}
                  </select>
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
                className="w-full p-4 font-medium text-sm rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70 shadow-sm" 
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || numericAmount <= 0}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 ${
            tab === 'settlement' 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' 
              : tab === 'ask'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
          }`}
        >
          {isSubmitting ? (
            'Processing...'
          ) : tab === 'settlement' ? (
            <>
              <HandCoins size={16} />
              <span>Send Settlement for Approval ({currency}{numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})</span>
            </>
          ) : tab === 'ask' ? (
            <>
              <Send size={16} />
              <span>Send Fund Request ({currency}{numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})</span>
            </>
          ) : (
            `Confirm & Log Expense (${currency}${numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'})`
          )}
        </button>
      </form>
    </div>
  );
}