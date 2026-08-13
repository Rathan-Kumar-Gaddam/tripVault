import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function AddTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, logTransaction } = useTripStore();
  
  const [type, setType] = useState('expense');
  const [splitMode, setSplitMode] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    let sharedBy = splitMode === 'all' 
      ? currentTrip.members.map(m => m.user._id) 
      : [selectedUser];

    await logTransaction({
      tripId: id,
      type,
      amount: Number(fd.get('amount')),
      description: fd.get('description'),
      sharedBy
    });
    
    navigate(`/trip/${id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Log Money</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${type === 'expense' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>Expense</button>
          <button type="button" onClick={() => setType('contribution')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${type === 'contribution' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Contribution</button>
        </div>

        <input name="amount" type="number" step="0.01" min="1" placeholder={`Amount (${currentTrip?.currency})`} required className="w-full p-4 text-lg font-medium rounded-xl border border-gray-200 bg-white shadow-sm" />
        <input name="description" type="text" placeholder="What was it for?" required className="w-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm" />

        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
          <p className="font-bold text-sm mb-3 text-gray-700">Who is affected by this?</p>
          <select value={splitMode} onChange={(e) => setSplitMode(e.target.value)} className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 mb-3 outline-none">
            <option value="all">Everyone (Split Equally)</option>
            <option value="individual">One Specific Person</option>
          </select>

          {splitMode === 'individual' && (
            <select required value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 outline-none">
              <option value="">Select Member...</option>
              {currentTrip?.members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          )}
        </div>

        <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-2 shadow-lg">
          Record {type === 'expense' ? 'Expense' : 'Contribution'}
        </button>
      </form>
    </div>
  );
}