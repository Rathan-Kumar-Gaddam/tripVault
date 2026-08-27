import { LayoutDashboard, History, Plus, Users, ArrowLeft } from 'lucide-react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-0 sm:right-0 max-w-sm mx-auto z-40 pointer-events-none">
      <nav className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-xl px-3 py-2 flex justify-between items-center rounded-3xl text-white">
        
        {/* Exit to My Trips */}
        <button 
          type="button"
          onClick={() => navigate('/')} 
          className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl text-slate-400 hover:text-white active:scale-95 transition-all"
          title="All Trips"
        >
          <ArrowLeft size={18} />
          <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Trips</span>
        </button>

        {/* Dashboard */}
        <NavLink 
          to={`/trip/${id}`} 
          end 
          className={({isActive}) => `flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
            isActive ? 'text-white bg-white/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Vault</span>
        </NavLink>

        {/* Center Primary Action: Add Expense */}
        <NavLink to={`/trip/${id}/add-money`} className="relative -top-4 active:scale-90 transition-transform">
          <div className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/35 border-[3px] border-slate-900 transition-colors">
            <Plus size={24} strokeWidth={2.5} />
          </div>
        </NavLink>

        {/* History / Logs */}
        <NavLink 
          to={`/trip/${id}/history`} 
          className={({isActive}) => `flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
            isActive ? 'text-white bg-white/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History size={18} />
          <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Logs</span>
        </NavLink>

        {/* Members */}
        <NavLink 
          to={`/trip/${id}/add-member`} 
          className={({isActive}) => `flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
            isActive ? 'text-white bg-white/15' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">Group</span>
        </NavLink>
        
      </nav>
    </div>
  );
}