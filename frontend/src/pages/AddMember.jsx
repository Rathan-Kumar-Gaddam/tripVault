import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import toast from 'react-hot-toast';

export default function AddMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMember } = useTripStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fd = new FormData(e.target);
    const name = fd.get('name')?.toString().trim();
    const email = fd.get('email')?.toString().trim();
    const tempPassword = fd.get('password')?.toString();

    if (!name || !email || !tempPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addMember(id, {
        name,
        email,
        tempPassword,
      });
      toast.success('Member added successfully! 👥');
      navigate(`/trip/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Add Member</h2>
      <p className="text-gray-500 text-sm mb-6">Create an account for your friend. They can log in later with these details to view their balances.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          name="name" 
          type="text" 
          placeholder="Friend's Name" 
          required 
          disabled={isSubmitting}
          className="w-full p-4 rounded-xl border border-gray-200 bg-white disabled:bg-gray-100 disabled:opacity-70" 
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email Address" 
          required 
          disabled={isSubmitting}
          className="w-full p-4 rounded-xl border border-gray-200 bg-white disabled:bg-gray-100 disabled:opacity-70" 
        />
        <input 
          name="password" 
          type="text" 
          placeholder="Assign a Temporary Password" 
          required 
          disabled={isSubmitting}
          className="w-full p-4 rounded-xl border border-gray-200 bg-white disabled:bg-gray-100 disabled:opacity-70" 
        />

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          {isSubmitting ? 'Adding Member...' : 'Add to Trip'}
        </button>
      </form>
    </div>
  );
}