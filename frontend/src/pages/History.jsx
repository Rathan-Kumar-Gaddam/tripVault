import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tag
} from 'lucide-react';
import useTripStore from '../store/useTripStore';
import toast from 'react-hot-toast';

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, deleteTransaction, isLoading } = useTripStore();
  
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'settlement' | 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id);
    }
  }, [id]);

  if (isLoading || !currentTrip) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full text-slate-400 gap-3 min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="font-semibold text-xs animate-pulse">Loading transaction history...</p>
      </div>
    );
  }

  const currency = currentTrip.currency || '₹';
  const myMembership = currentTrip.members?.find(m => (m.user?._id || m.user) === user?._id);
  const isAdmin = myMembership?.role === 'admin';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const handleDelete = async (txId, e) => {
    e.stopPropagation();
    if (deletingId) return;

    if (!window.confirm('Delete this transaction and recalculate balances?')) {
      return;
    }

    try {
      setDeletingId(txId);
      await deleteTransaction(txId, id);
      toast.success('Transaction removed & balances updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Search logic
  const filteredTransactions = transactions.filter((tx) => {
    const payerId = (tx.payer?._id || tx.payer || tx.createdBy?._id || tx.createdBy)?.toString();
    const isMine = payerId === user?._id?.toString();

    let matchesType = true;
    if (filterType === 'expense') matchesType = tx.type === 'expense';
    else if (filterType === 'settlement') matchesType = tx.type === 'settlement';
    else if (filterType === 'mine') matchesType = isMine;

    const matchesSearch = !searchQuery.trim() || 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.payer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSettlements = transactions
    .filter(t => t.type === 'settlement')
    .reduce((sum, t) => sum + t.amount, 0);

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
          <h1 className="text-xl font-bold text-slate-900 font-heading">Trip Activity Log</h1>
          <p className="text-xs text-slate-500 font-medium">{currentTrip.name}</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Expenses</p>
          <p className="text-lg font-black text-rose-600 font-heading">
            -{currency}{totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Settlements Paid</p>
          <p className="text-lg font-black text-emerald-600 font-heading">
            {currency}{totalSettlements.toFixed(2)}
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
            className="w-full p-3.5 pl-11 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-2xl">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('settlement')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'settlement' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Settled
          </button>
          <button
            onClick={() => setFilterType('mine')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Paid by Me
          </button>
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

            // Recipient for settlement
            const recipient = tx.splits?.[0]?.user || tx.sharedBy?.[0];

            return (
              <div 
                key={tx._id} 
                className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-sm flex items-start gap-3.5 hover:border-slate-200 transition-all"
              >
                {/* Icon Indicator */}
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                  isSettlement 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-500 border border-rose-100'
                }`}>
                  {isSettlement ? <HandCoins size={20} /> : <ArrowDownRight size={20} />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{tx.description}</h3>
                    <span className={`font-black text-sm whitespace-nowrap font-heading ${
                      isSettlement ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isSettlement ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{formatDate(tx.createdAt)}</span>
                    </span>
                    {tx.category && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {tx.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Payer & Split Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-2xl w-full">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-900">
                        {isPaidByMe ? 'You paid' : `${payer?.name || 'Companion'} paid`}
                      </span>
                      {isSettlement && recipient && (
                        <span className="text-slate-500 truncate">
                          → {recipient._id === user?._id ? 'You' : recipient.name}
                        </span>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={(e) => handleDelete(tx._id, e)}
                        disabled={deletingId === tx._id}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}