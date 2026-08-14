import { Home, History, Plus, Users, ArrowLeft } from 'lucide-react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function BottomNav() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip } = useTripStore();
  
  const myData = currentTrip?.members?.find(m => m.user?._id === user?._id);
  const isAdmin = myData?.role === 'admin';

  return (
    <div className="fixed bottom-5 left-0 right-0 max-w-md mx-auto px-5 z-40 pointer-events-none">
      <nav className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.35)] px-4 py-2.5 flex justify-between items-center rounded-[2rem] text-white">
        
        {/* Exit to My Trips */}
        <button 
          onClick={() => navigate('/')} 
          className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-slate-400 hover:text-white active:scale-90 transition-all"
          title="All Trips"
        >
          <ArrowLeft size={20} />
          <span className="text-[10px] mt-0.5 font-bold tracking-wider uppercase opacity-80">Exit</span>
        </button>

        {/* Dashboard */}
        <NavLink 
          to={`/trip/${id}`} 
          end 
          className={({isActive}) => `flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
            isActive ? 'text-indigo-400 bg-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5 font-bold tracking-wider uppercase">Vault</span>
        </NavLink>

        {/* Center Action Button (Admin - Log Expense/Money) */}
        {isAdmin ? (
          <NavLink to={`/trip/${id}/add-money`} className="relative -top-5">
            <div className="bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-[3px] border-slate-900 active:scale-90 transition-transform">
              <Plus size={26} strokeWidth={3} />
            </div>
          </NavLink>
        ) : (
          <div className="w-2"></div>
        )}

        {/* History */}
        <NavLink 
          to={`/trip/${id}/history`} 
          className={({isActive}) => `flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
            isActive ? 'text-indigo-400 bg-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History size={20} />
          <span className="text-[10px] mt-0.5 font-bold tracking-wider uppercase">Logs</span>
        </NavLink>

        {/* Members */}
        <NavLink 
          to={`/trip/${id}/add-member`} 
          className={({isActive}) => `flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
            isActive ? 'text-indigo-400 bg-indigo-500/20 shadow-inner' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] mt-0.5 font-bold tracking-wider uppercase">Group</span>
        </NavLink>
        
      </nav>
    </div>
  );
}