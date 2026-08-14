import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { UserPlus, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMember } = useTripStore();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fd = new FormData(e.target);
    const name = fd.get('name')?.toString().trim();
    const cleanPhone = phone.trim();

    if (!name) {
      toast.error('Please enter friend\'s name.');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addMember(id, {
        name,
        phone: cleanPhone,
      });
      toast.success(`${name} added to trip! 👥`);
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
          <UserPlus size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Add Member</h2>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Add your travel companion with their name and 10-digit phone number. They can log in immediately with their phone number to view trip vaults and balances.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            name="name" 
            type="text" 
            placeholder="Friend's Full Name" 
            required 
            disabled={isSubmitting}
            className="w-full p-4 pl-12 rounded-xl border border-gray-200 bg-white font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-100 disabled:opacity-70" 
          />
        </div>

        <div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              name="phone" 
              type="tel" 
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              placeholder="10-digit Phone Number (e.g. 9845201587)" 
              required 
              disabled={isSubmitting}
              className="w-full p-4 pl-12 rounded-xl border border-gray-200 bg-white font-medium tracking-wide focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-100 disabled:opacity-70" 
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 px-1 text-xs font-medium">
            <span className="text-gray-400">Must be exactly 10 digits</span>
            <span className={phone.length === 10 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
              {phone.length}/10 digits
            </span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          {isSubmitting ? 'Adding Member...' : 'Add to Trip'}
        </button>
      </form>
    </div>
  );
}