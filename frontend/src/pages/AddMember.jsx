import { useNavigate, useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function AddMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMember } = useTripStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addMember(id, {
      name: fd.get('name'),
      email: fd.get('email'),
      tempPassword: fd.get('password'),
    });
    navigate(`/trip/${id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Add Member</h2>
      <p className="text-gray-500 text-sm mb-6">Create an account for your friend. They can log in later with these details to view their balances.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input name="name" type="text" placeholder="Friend's Name" required className="w-full p-4 rounded-xl border border-gray-200 bg-white" />
        <input name="email" type="email" placeholder="Email Address" required className="w-full p-4 rounded-xl border border-gray-200 bg-white" />
        <input name="password" type="text" placeholder="Assign a Temporary Password" required className="w-full p-4 rounded-xl border border-gray-200 bg-white" />

        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg">
          Add to Trip
        </button>
      </form>
    </div>
  );
}