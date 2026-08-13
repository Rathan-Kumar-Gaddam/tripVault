import { Home, History, Plus, Users, ArrowLeft } from 'lucide-react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function BottomNav() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip } = useTripStore();
  
  const myData = currentTrip?.members.find(m => m.user._id === user?._id);
  const isAdmin = myData?.role === 'admin';

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
      <nav className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-6 py-3 flex justify-between items-center rounded-3xl">
        
        <button onClick={() => navigate('/')} className="flex flex-col items-center text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={22} /><span className="text-[10px] mt-1 font-medium">Exit</span>
        </button>

        <NavLink to={`/trip/${id}`} end className={({isActive}) => `flex flex-col items-center transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}>
          <Home size={22} /><span className="text-[10px] mt-1 font-medium">Dash</span>
        </NavLink>

        {/* Floating Action Button (Admin) */}
        {isAdmin && (
          <NavLink to={`/trip/${id}/add-money`} className="flex flex-col items-center">
            <div className="bg-gray-900 text-white p-3.5 rounded-2xl shadow-lg shadow-gray-900/30 transform -translate-y-6 border-[3px] border-gray-50 active:scale-95 transition-all">
              <Plus size={26} strokeWidth={3} />
            </div>
          </NavLink>
        )}

        <NavLink to={`/trip/${id}/history`} className={({isActive}) => `flex flex-col items-center transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}>
          <History size={22} /><span className="text-[10px] mt-1 font-medium">History</span>
        </NavLink>

        {isAdmin && (
          <NavLink to={`/trip/${id}/add-member`} className={({isActive}) => `flex flex-col items-center transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}>
            <Users size={22} /><span className="text-[10px] mt-1 font-medium">Members</span>
          </NavLink>
        )}
        
      </nav>
    </div>
  );
}