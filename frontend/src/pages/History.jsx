import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Receipt, Users, User } from 'lucide-react';
import useTripStore from '../store/useTripStore';

export default function History() {
  const { id } = useParams();
  const { currentTrip, transactions, fetchTripDetails, isLoading } = useTripStore();

  // Ensure data is loaded if they refresh directly on this page
  useEffect(() => {
    if (!currentTrip || currentTrip._id !== id) {
      fetchTripDetails(id);
    }
  }, [id]);

  if (isLoading || !currentTrip) {
    return <div className="p-10 text-center animate-pulse text-gray-500">Loading history...</div>;
  }

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  return (
    <div className="p-5">
      <div className="mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-md pb-4 pt-2 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Vault History</h1>
        <p className="text-gray-500 text-sm">All transactions for {currentTrip.name}</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-200 mt-10">
          <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No transactions logged yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {transactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isCommon = tx.sharedBy.length > 1;

            return (
              <div key={tx._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                
                {/* Icon Indicator */}
                <div className={`mt-1 p-3 rounded-full ${isExpense ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {isExpense ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>

                {/* Transaction Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{tx.description}</h3>
                    <span className={`font-bold whitespace-nowrap ml-2 ${isExpense ? 'text-gray-900' : 'text-emerald-600'}`}>
                      {isExpense ? '-' : '+'}{currentTrip.currency}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2">{formatDate(tx.createdAt)}</p>
                  
                  <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 bg-gray-50 inline-flex px-2 py-1 rounded-md">
                    <span className="flex items-center gap-1">
                      {isCommon ? <Users size={12} /> : <User size={12} />}
                      {isCommon ? 'Common Split' : `For ${tx.sharedBy[0]?.name}`}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>Logged by {tx.createdBy?.name}</span>
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