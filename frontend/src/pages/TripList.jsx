import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
// Import Trash2 from lucide-react
import { LogOut, Plus, Trash2 } from 'lucide-react';

export default function TripsList() {
  // Add deleteTrip to the destructured store
  const { user, trips, fetchTrips, createTrip, deleteTrip, logout } = useTripStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchTrips(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await createTrip({
      name: fd.get('name'),
      destination: fd.get('destination'),
      currency: fd.get('currency') || '₹'
    });
    setShowForm(false);
  };

  // Add the deletion handler
  const handleDelete = async (e, tripId) => {
    e.stopPropagation(); // Prevents the click from opening the trip
    
    // Simple browser confirmation alert
    if (window.confirm('Are you sure you want to delete this trip? All transactions will be lost forever.')) {
      await deleteTrip(tripId);
    }
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-gray-500 text-sm">Hello, {user?.name}</p>
        </div>
        <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-600"><LogOut size={20} /></button>
      </header>

      {showForm ? (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-3">
          <input name="name" placeholder="Trip Name (e.g. Goa 2026)" required className="p-3 bg-gray-50 rounded-xl" />
          <input name="destination" placeholder="Destination" className="p-3 bg-gray-50 rounded-xl" />
          <input name="currency" placeholder="Currency Symbol (default ₹)" className="p-3 bg-gray-50 rounded-xl" />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-medium">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-100 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold mb-6 hover:bg-indigo-100 transition-colors">
          <Plus size={20} /> Create New Trip
        </button>
      )}

      <div className="flex flex-col gap-4">
        {trips.map(trip => {
          // Check if the current user is the admin of this trip
          const isAdmin = trip.members.find(m => m.user._id === user?._id)?.role === 'admin';

          return (
            <div 
              key={trip._id} 
              onClick={() => navigate(`/trip/${trip._id}`)} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-900">{trip.name}</h3>
                <p className="text-gray-500 text-sm">{trip.destination} • {trip.members.length} members</p>
              </div>
              
              {/* Only show the delete button if the user is the Admin */}
              {isAdmin && (
                <button 
                  onClick={(e) => handleDelete(e, trip._id)}
                  className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Trip"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )
        })}
        {trips.length === 0 && !showForm && <p className="text-center text-gray-500 mt-10">No trips yet. Create one!</p>}
      </div>
    </div>
  );
}