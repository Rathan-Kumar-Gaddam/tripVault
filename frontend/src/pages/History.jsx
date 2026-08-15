import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowDownRight, 
  ArrowUpRight, 
  Receipt, 
  Users, 
  User, 
  UsersRound, 
  Search, 
  Calendar,
  Sparkles,
  HandCoins,
  Trash2,
  Tag,
  Download,
  Printer,
  FileSpreadsheet,
  MoreVertical,
  UserCheck,
  CreditCard,
  X,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import useTripStore, { computeBilateralDebts } from '../store/useTripStore';
import toast from 'react-hot-toast';
import { 
  exportTripToCSV, 
  exportPersonalExpenseToCSV,
  printTripReport, 
  printPersonalExpenseReport,
  computeUserShare 
} from '../utils/exportUtils';
import { HistorySkeleton } from '../components/SkeletonLoader';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { getCategoryMeta, PRESET_CATEGORIES, getCustomCategories } from '../utils/categoryUtils';

export default function History() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, deleteTransaction, isLoading } = useTripStore();
  
  const initialCategory = searchParams.get('category') || 'All';
  const [filterType, setFilterType] = useState('all'); // 'all' | 'my_share' | 'paid_by_me' | 'settlement'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Dynamically extract all available categories in this trip
  const dynamicCategories = useMemo(() => {
    const set = new Set();
    (transactions || []).forEach(t => {
      if (t.category && t.type !== 'settlement') set.add(t.category);
    });
    getCustomCategories(id).forEach(c => set.add(c.id || c.label));
    PRESET_CATEGORIES.forEach(c => set.add(c.id));
    return ['All', ...Array.from(set), 'Settlement'];
  }, [transactions, id]);

  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      setFetchError(null);
      fetchTripDetails(id).catch((err) => {
        setFetchError(err.response?.data?.message || err.message || 'Failed to load activity history');
      });
    }
  }, [id]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  if ((isLoading && !currentTrip) || (currentTrip && currentTrip._id !== id && !fetchError)) {
    return <HistorySkeleton />;
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

  const currency = currentTrip.currency || '₹';
  const myMembership = currentTrip.members?.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = myMembership?.role === 'admin';

  // Memoized P2P Debt Balances
  const { companionDebts } = useMemo(
    () => computeBilateralDebts(currentTrip.members, transactions, user?._id),
    [currentTrip.members, transactions, user?._id]
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  // Group CSV Export
  const handleExportGroupCSV = () => {
    try {
      exportTripToCSV(currentTrip, transactions, companionDebts, user);
      toast.success('Group Passbook CSV downloaded! 📊');
      setShowExportMenu(false);
    } catch (err) {
      toast.error('Failed to export CSV.');
    }
  };

  // Personal CSV Export
  const handleExportPersonalCSV = () => {
    try {
      exportPersonalExpenseToCSV(currentTrip, transactions, user);
      toast.success('Personal Expenses CSV downloaded! 👤');
      setShowExportMenu(false);
    } catch (err) {
      toast.error('Failed to export personal CSV.');
    }
  };

  // Group PDF
  const handlePrintGroupPDF = () => {
    try {
      printTripReport(currentTrip, transactions, companionDebts, user);
      setShowExportMenu(false);
    } catch (err) {
      toast.error('Failed to print group statement.');
    }
  };

  // Personal PDF
  const handlePrintPersonalPDF = () => {
    try {
      printPersonalExpenseReport(currentTrip, transactions, user);
      setShowExportMenu(false);
    } catch (err) {
      toast.error('Failed to print personal statement.');
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await deleteTransaction(txId, id);
      toast.success('Transaction removed & balances updated 🗑️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction.');
    }
  };

  // Memoized Filter & Search logic
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const currentUserIdStr = user?._id?.toString();

    return (transactions || []).filter((tx) => {
      const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
      const isPaidByMe = payerId === currentUserIdStr;
      const myShare = computeUserShare(tx, user?._id, currentTrip.members);

      let matchesType = true;
      if (filterType === 'my_share') matchesType = tx.type === 'expense' && myShare > 0;
      else if (filterType === 'paid_by_me') matchesType = isPaidByMe;
      else if (filterType === 'settlement') matchesType = tx.type === 'settlement';

      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Settlement') {
          matchesCategory = tx.type === 'settlement';
        } else {
          matchesCategory = tx.category === selectedCategory;
        }
      }

      const matchesSearch = !q || 
        tx.description?.toLowerCase().includes(q) ||
        tx.payer?.name?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q);

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, searchQuery, filterType, selectedCategory, user?._id, currentTrip.members]);

  // Memoized Totals
  const { totalSpent, totalMyConsumption, totalMyPaidUpfront } = useMemo(() => {
    let spent = 0;
    let myCons = 0;
    let myPaid = 0;
    const currentUserIdStr = user?._id?.toString();

    (transactions || []).forEach((t) => {
      if (t.type === 'expense') {
        const amt = t.amount || 0;
        spent += amt;
        myCons += computeUserShare(t, user?._id, currentTrip.members);

        const payerId = (t.payer?._id || t.payer || t.createdBy?._id || t.createdBy)?.toString();
        if (payerId === currentUserIdStr) {
          myPaid += amt;
        }
      }
    });

    return { totalSpent: spent, totalMyConsumption: myCons, totalMyPaidUpfront: myPaid };
  }, [transactions, user?._id, currentTrip.members]);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-28 sm:pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/trip/${id}`)} 
            className="p-3 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm active:scale-95 transition-all"
            title="Back to Vault Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Activity History
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold">
              {currentTrip.name} • {filteredTransactions.length} of {transactions.length} logs
            </p>
          </div>
        </div>

        {/* Export Dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-3 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-indigo-600 shadow-sm active:scale-95 transition-all"
            title="Export Reports"
          >
            <Download size={20} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-14 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Full Group Reports
              </div>
              <button
                onClick={handleExportGroupCSV}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2"
              >
                <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                <span>Group Passbook (Excel/CSV)</span>
              </button>
              <button
                onClick={handlePrintGroupPDF}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2"
              >
                <Printer size={15} className="text-indigo-600 shrink-0" />
                <span>Group Statement (PDF)</span>
              </button>

              <div className="my-1.5 border-t border-slate-100"></div>

              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Individual / Personal Tracking
              </div>
              <button
                onClick={handleExportPersonalCSV}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-xs font-bold text-indigo-900 flex items-center gap-2"
              >
                <UserCheck size={15} className="text-indigo-600 shrink-0" />
                <span>My Personal Expenses (CSV)</span>
              </button>
              <button
                onClick={handlePrintPersonalPDF}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-xs font-bold text-indigo-900 flex items-center gap-2"
              >
                <Printer size={15} className="text-purple-600 shrink-0" />
                <span>My Personal Statement (PDF)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Summary Stat Pills Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-[2rem] shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Trip Spend
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-600 font-heading">
            -{currency}{totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-[2rem] shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            My Consumed Share
          </p>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 font-heading">
            -{currency}{totalMyConsumption.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-[2rem] shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Paid by You Upfront
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 font-heading">
            {currency}{totalMyPaidUpfront.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-[2rem] shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Settlement Logs
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            {transactions.filter(t => t.type === 'settlement').length} {transactions.filter(t => t.type === 'settlement').length === 1 ? 'record' : 'records'}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, payer, or category..."
            className="w-full p-3.5 pl-11 pr-10 bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('my_share')}
            className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'my_share' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            👤 My Share
          </button>
          <button
            onClick={() => setFilterType('paid_by_me')}
            className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'paid_by_me' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💳 Paid by Me
          </button>
          <button
            onClick={() => setFilterType('settlement')}
            className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === 'settlement' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Settled
          </button>
        </div>

        {/* Category Horizontal Filter Chips with Emojis */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {dynamicCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = cat !== 'All' ? getCategoryMeta(cat, id) : null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 ring-2 ring-indigo-500/30'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {meta?.emoji && <span>{meta.emoji}</span>}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-[2rem] border border-slate-200/80 mt-6 shadow-sm">
          <Receipt className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="font-bold text-slate-800 text-sm mb-1">No Transactions Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'Try adjusting your search query or filters.' : 'Expenses and settlements logged by you and companions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isSettlement = tx.type === 'settlement';
            const payer = tx.payer || tx.createdBy;
            const isPaidByMe = (payer?._id || payer) === user?._id;
            const canDelete = isPaidByMe || isAdmin;
            const myIndividualShare = computeUserShare(tx, user?._id, currentTrip.members);

            // Recipient for settlement
            const recipient = tx.splits?.[0]?.user || tx.sharedBy?.[0];

            return (
              <div 
                key={tx._id} 
                onClick={() => setSelectedTx(tx)}
                className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-sm flex items-start gap-3.5 hover:border-indigo-300 cursor-pointer active:scale-95 transition-all group"
              >
                {/* Icon Indicator */}
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
                  isSettlement 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-500 border border-rose-100'
                }`}>
                  {isSettlement ? <HandCoins size={20} /> : <ArrowDownRight size={20} />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{tx.description}</h3>
                    <span className={`font-black text-sm whitespace-nowrap font-heading ${
                      isSettlement ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isSettlement ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{formatDate(tx.createdAt)}</span>
                    </span>
                    {tx.category && (() => {
                      const catMeta = getCategoryMeta(tx.category, id);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${catMeta.theme?.badge || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          <span>{catMeta.emoji}</span>
                          <span>{tx.category}</span>
                        </span>
                      );
                    })()}
                    {isExpense && myIndividualShare > 0 && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                        Your share: {currency}{myIndividualShare.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {/* Payer & Split Info */}
                  <div className="flex flex-col gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-2xl w-full">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-slate-900">
                          {isPaidByMe ? 'You paid total' : `${payer?.name || 'Companion'} paid total`}
                        </span>
                        {isSettlement && recipient && (
                          <span className="text-slate-500 truncate">
                            → {recipient._id === user?._id ? 'You' : recipient.name}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                        Details →
                      </span>
                    </div>

                    {/* Split Type Badge & Per-Person Breakdown */}
                    {isExpense && (() => {
                      const effectiveSplits = (tx.splits && tx.splits.length > 0)
                        ? tx.splits
                        : (tx.sharedBy && tx.sharedBy.length > 0)
                          ? tx.sharedBy.map(u => ({ user: u, amount: tx.amount / tx.sharedBy.length }))
                          : (currentTrip.members || []).map(m => ({ user: m.user, amount: tx.amount / (currentTrip.members?.length || 1) }));

                      const splitCount = effectiveSplits.length;
                      const isCommon = tx.splitType === 'all' || !tx.splitType;
                      const isCustom = tx.splitType === 'custom';
                      const isIndividual = tx.splitType === 'individual';
                      const perPersonEqual = tx.amount / Math.max(1, splitCount);

                      return (
                        <div className="mt-1 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between mb-1.5 text-[10px]">
                            <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              {isCommon && `👥 Split equally (${currency}${perPersonEqual.toFixed(2)} / each)`}
                              {isCustom && `✨ Custom split (${splitCount} members)`}
                              {isIndividual && `👤 1-on-1 split`}
                            </span>
                            <span className="font-semibold text-slate-400">
                              {splitCount} {splitCount === 1 ? 'person' : 'people'}
                            </span>
                          </div>

                          {/* Member Share Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {effectiveSplits.map((s, idx) => {
                              const sUser = s.user || s;
                              const sUserId = (sUser?._id || sUser)?.toString();
                              const isSelfShare = sUserId === user?._id?.toString();
                              const sName = isSelfShare ? 'You' : (sUser?.name || 'Member');
                              const sAmount = s.amount !== undefined ? s.amount : perPersonEqual;

                              return (
                                <div 
                                  key={sUserId || idx}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                    isSelfShare 
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
                                      : 'bg-white border-slate-200/80 text-slate-700'
                                  }`}
                                >
                                  <span className="truncate max-w-[85px]">{sName}:</span>
                                  <span className="font-extrabold font-heading text-rose-600">
                                    {currency}{Number(sAmount).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail Sheet Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={handleDeleteTransaction}
        currency={currency}
        currentUser={user}
        isAdmin={isAdmin}
      />
    </div>
  );
}