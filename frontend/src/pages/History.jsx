import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Receipt, 
  Search, 
  Download,
  Calendar
} from 'lucide-react';
import useTripStore, { computeBilateralDebts } from '../store/useTripStore';
import { computeUserShare } from '../utils/exportUtils';
import { HistorySkeleton } from '../components/SkeletonLoader';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ExportModal from '../components/ExportModal';
import { getCategoryMeta } from '../utils/categoryUtils';

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, deleteTransaction } = useTripStore();
  
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'settlement' | 'my_share'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id).catch((err) => {
        if (isMounted) {
          setFetchError(err.response?.data?.message || err.message || 'Failed to load activity history');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id, currentTrip, fetchTripDetails]);

  const currency = currentTrip?.currency || '₹';
  const members = useMemo(() => currentTrip?.members || [], [currentTrip?.members]);
  const myMembership = members.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString());
  const isAdmin = myMembership?.role === 'admin';

  const { companionDebts } = useMemo(
    () => computeBilateralDebts(members, transactions, user?._id),
    [members, transactions, user?._id]
  );

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const currentUserIdStr = user?._id?.toString();

    return (transactions || []).filter((tx) => {
      const payerId = (tx.payer?._id || tx.payer)?.toString();
      const myShare = computeUserShare(tx, user?._id, members);

      let matchesType = true;
      if (filterType === 'expense') matchesType = tx.type === 'expense';
      else if (filterType === 'settlement') matchesType = tx.type === 'settlement';
      else if (filterType === 'my_share') matchesType = (tx.type === 'expense' && myShare > 0) || payerId === currentUserIdStr;

      let matchesSearch = true;
      if (q) {
        matchesSearch =
          tx.description?.toLowerCase().includes(q) ||
          tx.category?.toLowerCase().includes(q) ||
          tx.payer?.name?.toLowerCase().includes(q);
      }

      return matchesType && matchesSearch;
    });
  }, [transactions, searchQuery, filterType, user?._id, members]);

  // Group transactions by formatted date string
  const groupedTransactions = useMemo(() => {
    const groups = {};

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.createdAt || 0);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  if ((!currentTrip || currentTrip._id !== id) && !fetchError) {
    return <HistorySkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 pb-24 sm:pb-20 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => navigate(`/trip/${id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
        >
          <Download size={14} />
          <span>Export Statements</span>
        </button>
      </div>

      {/* Page Title & Search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Passbook & Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete transaction timeline for {currentTrip?.name}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'expense', label: 'Expenses' },
              { id: 'settlement', label: 'Settlements' },
              { id: 'my_share', label: 'My Share' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  filterType === tab.id
                    ? 'bg-white shadow-2xs text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Transaction Timeline */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <Receipt size={32} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No transactions found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateLabel, txList]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Calendar size={13} className="text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {dateLabel}
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {txList.map((tx) => {
                  const meta = getCategoryMeta(tx.category || (tx.type === 'settlement' ? 'Settlement' : 'General'));
                  const isSettlement = tx.type === 'settlement';
                  const payerName = tx.payer?.name || 'Unknown';
                  const isPayerMe = (tx.payer?._id || tx.payer)?.toString() === user?._id?.toString();
                  const myShare = computeUserShare(tx, user?._id, members);

                  return (
                    <div
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="p-4 hover:bg-slate-50/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                          {isSettlement ? '🤝' : meta.emoji}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {tx.description}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {isSettlement 
                              ? `Settlement recorded`
                              : `${isPayerMe ? 'You paid' : `Paid by ${payerName}`} • ${meta.label}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          {currency}{tx.amount?.toLocaleString()}
                        </p>
                        {!isSettlement && myShare > 0 && (
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Your share: {currency}{myShare.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <TransactionDetailModal
          isOpen={!!selectedTx}
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={async (txId) => {
            await deleteTransaction(txId, id);
            setSelectedTx(null);
          }}
          currency={currency}
          currentUser={user}
          isAdmin={isAdmin}
        />
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