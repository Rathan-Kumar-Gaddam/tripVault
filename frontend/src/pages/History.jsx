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
  Filter, 
  Calendar,
  Sparkles 
} from 'lucide-react';
import useTripStore from '../store/useTripStore';

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, transactions, fetchTripDetails, isLoading } = useTripStore();
  
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'contribution'
  const [searchQuery, setSearchQuery] = useState('');

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  // Filter & Search logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = !searchQuery.trim() || 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPooled = transactions
    .filter(t => t.type === 'contribution')
    .reduce((sum, t) => sum + t.amount, 0);

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
          <h1 className="text-xl font-bold text-slate-900 font-heading">Vault Timeline</h1>
          <p className="text-xs text-slate-500 font-medium">{currentTrip.name}</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Outflow</p>
          <p className="text-lg font-black text-slate-900 font-heading">
            {currentTrip.currency}{totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Inflow</p>
          <p className="text-lg font-black text-emerald-600 font-heading">
            {currentTrip.currency}{totalPooled.toFixed(2)}
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
            placeholder="Search by title or person..."
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
            onClick={() => setFilterType('contribution')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'contribution' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Inflow
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-[2rem] border border-slate-200/80 mt-6 shadow-sm">
          <Receipt className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="font-bold text-slate-800 text-sm mb-1">No Transactions Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'Try adjusting your search query or filters.' : 'Transactions logged by your organizer will show up here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const sharedCount = tx.sharedBy?.length || 0;
            const totalMembers = currentTrip.members?.length || 0;

            // SMART LABEL LOGIC
            let splitLabel = '';
            let SplitIcon = Users;

            if (sharedCount === totalMembers) {
              splitLabel = 'Split Equally (All)';
              SplitIcon = Users;
            } else if (sharedCount === 1) {
              splitLabel = `For ${tx.sharedBy[0]?.name?.split(' ')[0] || 'Member'}`;
              SplitIcon = User;
            } else {
              const names = tx.sharedBy?.map(u => u?.name?.split(' ')[0]).filter(Boolean).join(', ');
              splitLabel = `Custom: ${names}`;
              SplitIcon = UsersRound;
            }

            return (
              <div 
                key={tx._id} 
                className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-sm flex items-start gap-3.5 hover:border-slate-200 transition-all"
              >
                {/* Icon Indicator */}
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                  isExpense ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {isExpense ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{tx.description}</h3>
                    <span className={`font-black text-sm whitespace-nowrap font-heading ${
                      isExpense ? 'text-slate-900' : 'text-emerald-600'
                    }`}>
                      {isExpense ? '-' : '+'}{currentTrip.currency}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                    <Calendar size={12} />
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl w-full">
                    <span className="flex items-center gap-1 truncate">
                      <SplitIcon size={12} className="shrink-0 text-indigo-500" />
                      <span className="truncate">{splitLabel}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate font-semibold text-slate-700">
                      By {tx.createdBy?.name?.split(' ')[0] || 'Admin'}
                    </span>
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