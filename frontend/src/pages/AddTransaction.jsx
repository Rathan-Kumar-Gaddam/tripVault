import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Calculator
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
  const navigate = useNavigate();
  const { currentTrip, logTransaction } = useTripStore();
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [splitMode, setSplitMode] = useState('all'); 
  const [selectedUser, setSelectedUser] = useState(''); 
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = (val) => {
    const current = Number(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleToggleUser = (userId) => {
    if (isSubmitting) return;
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Calculate live split share
  const numericAmount = Number(amount) || 0;
  let activeSplitCount = currentTrip?.members?.length || 1;
  if (splitMode === 'individual') activeSplitCount = 1;
  else if (splitMode === 'custom') activeSplitCount = selectedUsers.length || 1;

  const perPersonShare = numericAmount > 0 ? (numericAmount / activeSplitCount) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!numericAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    const trimmedDesc = description.trim() || category;
    if (!trimmedDesc) {
      toast.error('Please enter a description or pick a category.');
      return;
    }
    
    let sharedBy = [];
    if (splitMode === 'all') {
      sharedBy = currentTrip?.members.map(m => m.user._id) || [];
    } else if (splitMode === 'individual') {
      if (!selectedUser) {
        toast.error('Please select a member.');
        return;
      }
      sharedBy = [selectedUser];
    } else if (splitMode === 'custom') {
      if (selectedUsers.length === 0) {
        toast.error('Please select at least one member.');
        return;
      }
      sharedBy = selectedUsers;
    }

    if (sharedBy.length === 0) {
      toast.error('Please select at least one member.');
      return;
    }

    try {
      setIsSubmitting(true);
      await logTransaction({
        tripId: id, 
        type, 
        amount: numericAmount, 
        description: trimmedDesc, 
        sharedBy
      });
      toast.success(`${type === 'expense' ? 'Expense' : 'Contribution'} logged! 🎉`);
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log transaction.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-28">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(`/trip/${id}`)} 
          className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Log Money</h1>
          <p className="text-xs text-slate-500 font-medium">{currentTrip?.name}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Toggle Mode: Expense vs Contribution */}
        <div className="flex p-1.5 bg-slate-200/70 rounded-2xl">
          <button 
            type="button" 
            disabled={isSubmitting}
            onClick={() => setType('expense')} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              type === 'expense' 
                ? 'bg-white shadow-sm text-slate-900' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💸 Expense (Spend)
          </button>
          <button 
            type="button" 
            disabled={isSubmitting}
            onClick={() => setType('contribution')} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              type === 'contribution' 
                ? 'bg-emerald-600 shadow-md shadow-emerald-600/20 text-white' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💰 Vault Inflow
          </button>
        </div>

        {/* Hero Amount Input Card */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col items-center">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {type === 'expense' ? 'Expense Amount' : 'Contribution Amount'}
          </label>

          <div className="relative flex items-center justify-center w-full my-2">
            <span className="text-3xl font-bold text-slate-400 mr-2 font-heading">{currentTrip?.currency || '₹'}</span>
            <input 
              name="amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" 
              required 
              disabled={isSubmitting}
              className="text-4xl sm:text-5xl font-black text-slate-900 text-center outline-none w-48 bg-transparent tracking-tight font-heading placeholder:text-slate-300" 
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
                +{currentTrip?.currency || '₹'}{q}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Chips */}
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

        {/* Split Breakdown Calculator Card */}
        <div className="bg-white p-5 border border-slate-200/80 rounded-[2rem] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              <span>Split Between</span>
            </p>
            {numericAmount > 0 && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Calculator size={12} />
                <span>{currentTrip?.currency || '₹'}{perPersonShare.toFixed(2)} / person</span>
              </span>
            )}
          </div>
          
          <select 
            value={splitMode} 
            disabled={isSubmitting}
            onChange={(e) => { setSplitMode(e.target.value); setSelectedUser(''); setSelectedUsers([]); }} 
            className="w-full p-3.5 font-bold text-xs rounded-xl bg-slate-50 border border-slate-200 mb-3 outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-70 cursor-pointer"
          >
            <option value="all">Everyone in Trip (Split Equally)</option>
            <option value="individual">Single Specific Companion</option>
            <option value="custom">Custom Selection (Select Multiple)</option>
          </select>

          {/* Individual UI */}
          {splitMode === 'individual' && (
            <select 
              required 
              disabled={isSubmitting}
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)} 
              className="w-full p-3.5 font-bold text-xs rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 outline-none disabled:opacity-70"
            >
              <option value="">Choose Companion...</option>
              {currentTrip?.members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          )}

          {/* Custom Select UI */}
          {splitMode === 'custom' && (
            <div className="flex flex-col gap-2 mt-2">
              {currentTrip?.members.map(m => {
                const isSelected = selectedUsers.includes(m.user._id);
                return (
                  <div 
                    key={m.user._id} 
                    onClick={() => handleToggleUser(m.user._id)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                    } ${isSubmitting ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                        {m.user?.avatar ? (
                          <img src={m.user.avatar} alt={m.user.name} className="w-full h-full object-cover" />
                        ) : (
                          m.user?.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`font-bold text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{m.user.name}</span>
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
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || numericAmount <= 0}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            'Recording Transaction...'
          ) : (
            `Confirm & Log ${type === 'expense' ? 'Expense' : 'Contribution'}`
          )}
        </button>
      </form>
    </div>
  );
}