import { Home, History, PlusCircle, Users, ArrowLeft } from 'lucide-react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function BottomNav() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip } = useTripStore();
  
  const myData = currentTrip?.members.find(m => m.user._id === user?._id);
  const isAdmin = myData?.role === 'admin';

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center rounded-t-2xl z-50">
      
      {/* 1. Exit Button */}
      <button onClick={() => navigate('/')} className="flex flex-col items-center text-gray-400 hover:text-gray-900">
        <ArrowLeft size={24} /><span className="text-[10px] mt-1">Exit</span>
      </button>

      {/* 2. Dashboard Tab */}
      <NavLink to={`/trip/${id}`} end className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
        <Home size={24} /><span className="text-[10px] mt-1">Dash</span>
      </NavLink>

      {/* 3. NEW: History Tab */}
      <NavLink to={`/trip/${id}/history`} className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
        <History size={24} /><span className="text-[10px] mt-1">History</span>
      </NavLink>

      {/* 4. ADMIN ONLY: Log Money Button */}
      {isAdmin && (
        <NavLink to={`/trip/${id}/add-money`} className="flex flex-col items-center text-indigo-600">
          <div className="bg-indigo-600 text-white p-3 rounded-full -mt-8 shadow-lg shadow-indigo-200 border-4 border-white">
            <PlusCircle size={28} />
          </div>
        </NavLink>
      )}

      {/* 5. ADMIN ONLY: Members Tab */}
      {isAdmin && (
        <NavLink to={`/trip/${id}/add-member`} className={({isActive}) => `flex flex-col items-center ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
          <Users size={24} /><span className="text-[10px] mt-1">Members</span>
        </NavLink>
      )}
      
    </nav>
  );
}