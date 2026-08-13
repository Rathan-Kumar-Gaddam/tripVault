import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { LogOut, Plus, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast'; // 1. Import toast

export default function TripsList() {
  const { user, trips, fetchTrips, createTrip, deleteTrip, logout } = useTripStore();
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);

  useEffect(() => { fetchTrips(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await createTrip({
        name: fd.get('name'),
        destination: fd.get('destination'),
        currency: fd.get('currency') || '₹'
      });
      setShowForm(false);
      // 2. Toast for creation
      toast.success('Trip created successfully! 🎉');
    } catch (error) {
      toast.error('Failed to create trip.');
    }
  };

  const handleDeleteClick = (e, tripId) => {
    e.stopPropagation();
    setTripToDelete(tripId); 
  };

  const confirmDelete = async () => {
    if (tripToDelete) {
      try {
        await deleteTrip(tripToDelete);
        setTripToDelete(null); 
        // 3. Toast for deletion
        toast.success('Trip deleted successfully 🗑️');
      } catch (error) {
        toast.error('Failed to delete trip.');
      }
    }
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-gray-500 text-sm">Hello, {user?.name}</p>
        </div>
        <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition">
          <LogOut size={20} />
        </button>
      </header>

      {/* Create Form */}
      {showForm ? (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-3">
          <input name="name" placeholder="Trip Name (e.g. Goa 2026)" required className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500" />
          <input name="destination" placeholder="Destination" className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500" />
          <input name="currency" placeholder="Currency Symbol (default ₹)" className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500" />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium active:scale-95 transition-transform">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl font-medium active:scale-95 transition-transform">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full bg-indigo-50 text-indigo-600 border border-indigo-100 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold mb-6 hover:bg-indigo-100 transition-colors active:scale-95">
          <Plus size={20} /> Create New Trip
        </button>
      )}

      {/* Trips List */}
      <div className="flex flex-col gap-4 relative z-0">
        {trips.map(trip => {
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
              
              {isAdmin && (
                <button 
                  onClick={(e) => handleDeleteClick(e, trip._id)}
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

      {/* CUSTOM CONFIRMATION MODAL */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Trip?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              This action cannot be undone. All transaction history, member balances, and trip data will be permanently erased.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform"
              >
                Yes, Delete
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}