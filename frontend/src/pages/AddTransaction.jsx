import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { CheckSquare, Square } from 'lucide-react'; // Nice icons for our checkboxes

export default function AddTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTrip, logTransaction } = useTripStore();
  
  const [type, setType] = useState('expense');
  const [splitMode, setSplitMode] = useState('all'); // 'all', 'individual', or 'custom'
  
  const [selectedUser, setSelectedUser] = useState(''); // Used for 'individual'
  const [selectedUsers, setSelectedUsers] = useState([]); // Used for 'custom'

  // Toggle a user in the custom multi-select list
  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) // Remove if already selected
        : [...prev, userId] // Add if not selected
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    // Determine the sharedBy array based on the selected mode
    let sharedBy = [];
    if (splitMode === 'all') {
      sharedBy = currentTrip.members.map(m => m.user._id);
    } else if (splitMode === 'individual') {
      if (!selectedUser) return alert("Please select a member.");
      sharedBy = [selectedUser];
    } else if (splitMode === 'custom') {
      if (selectedUsers.length === 0) return alert("Please select at least one member.");
      sharedBy = selectedUsers;
    }

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
        
        {/* Type Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${type === 'expense' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>Expense</button>
          <button type="button" onClick={() => setType('contribution')} className={`flex-1 py-3 rounded-lg font-bold text-sm ${type === 'contribution' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Contribution</button>
        </div>

        {/* Inputs */}
        <input name="amount" type="number" step="0.01" min="0.01" placeholder={`Amount (${currentTrip?.currency})`} required className="w-full p-4 text-lg font-medium rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        <input name="description" type="text" placeholder="What was it for?" required className="w-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />

        {/* Split Selection Area */}
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
          <p className="font-bold text-sm mb-3 text-gray-700">Who is affected by this?</p>
          
          <select 
            value={splitMode} 
            onChange={(e) => {
              setSplitMode(e.target.value);
              // Reset selections when changing modes
              setSelectedUser('');
              setSelectedUsers([]); 
            }} 
            className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 mb-3 outline-none focus:border-indigo-500"
          >
            <option value="all">Everyone (Split Equally)</option>
            <option value="individual">One Specific Person</option>
            <option value="custom">Custom (Select Multiple)</option>
          </select>

          {/* Individual Select UI */}
          {splitMode === 'individual' && (
            <select required value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 outline-none">
              <option value="">Select Member...</option>
              {currentTrip?.members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          )}

          {/* Custom Multi-Select UI */}
          {splitMode === 'custom' && (
            <div className="flex flex-col gap-2 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Select Members</p>
              
              {currentTrip?.members.map(m => {
                const isSelected = selectedUsers.includes(m.user._id);
                return (
                  <div 
                    key={m.user._id} 
                    onClick={() => handleToggleUser(m.user._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-gray-100 text-gray-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="text-indigo-600" size={20} />
                    ) : (
                      <Square className="text-gray-300" size={20} />
                    )}
                    <span className="font-medium text-sm">{m.user.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-2 shadow-lg active:scale-95 transition-transform">
          Record {type === 'expense' ? 'Expense' : 'Contribution'}
        </button>
      </form>
    </div>
  );
}