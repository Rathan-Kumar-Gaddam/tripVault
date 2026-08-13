import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { Check, Circle } from 'lucide-react';

export default function AddTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, logTransaction } = useTripStore();
  
  const [type, setType] = useState('expense');
  const [splitMode, setSplitMode] = useState('all'); 
  const [selectedUser, setSelectedUser] = useState(''); 
  const [selectedUsers, setSelectedUsers] = useState([]); 

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    let sharedBy = [];
    if (splitMode === 'all') sharedBy = currentTrip.members.map(m => m.user._id);
    else if (splitMode === 'individual') sharedBy = [selectedUser];
    else if (splitMode === 'custom') sharedBy = selectedUsers;

    if (sharedBy.length === 0) return alert("Please select at least one member.");

    await logTransaction({
      tripId: id, type, amount: Number(fd.get('amount')), description: fd.get('description'), sharedBy
    });
    navigate(`/trip/${id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Log Money</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* iOS Style Segmented Control */}
        <div className="flex p-1 bg-gray-100/80 rounded-2xl">
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'expense' ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Expense</button>
          <button type="button" onClick={() => setType('contribution')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'contribution' ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.08)] text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Contribution</button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">{currentTrip?.currency}</span>
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required className="w-full py-4 pl-12 pr-4 text-2xl font-bold rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-300" />
          </div>
          <input name="description" type="text" placeholder="What was it for?" required className="w-full p-4 font-medium rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-400" />
        </div>

        {/* Split Selection Box */}
        <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="font-bold text-sm mb-3 text-gray-900 tracking-tight">Who is involved?</p>
          
          <select 
            value={splitMode} 
            onChange={(e) => { setSplitMode(e.target.value); setSelectedUser(''); setSelectedUsers([]); }} 
            className="w-full p-4 font-medium rounded-xl bg-gray-50 border border-gray-100 mb-4 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
          >
            <option value="all">Everyone (Split Equally)</option>
            <option value="individual">One Specific Person</option>
            <option value="custom">Custom (Select Multiple)</option>
          </select>

          {/* Individual UI */}
          {splitMode === 'individual' && (
            <select required value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-4 font-medium rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 outline-none">
              <option value="">Select Member...</option>
              {currentTrip?.members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          )}

          {/* Custom Select UI */}
          {splitMode === 'custom' && (
            <div className="flex flex-col gap-2">
              {currentTrip?.members.map(m => {
                const isSelected = selectedUsers.includes(m.user._id);
                return (
                  <div 
                    key={m.user._id} 
                    onClick={() => handleToggleUser(m.user._id)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-600'}`}>{m.user.name}</span>
                    {isSelected ? <div className="bg-indigo-600 text-white rounded-full p-1"><Check size={14} strokeWidth={4}/></div> : <Circle size={22} className="text-gray-300" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg mt-2 shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-transform">
          Log {type === 'expense' ? 'Expense' : 'Contribution'}
        </button>
      </form>
    </div>
  );
}