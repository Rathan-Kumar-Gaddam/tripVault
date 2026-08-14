import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { 
  WalletCards, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Users, 
  History, 
  Sparkles,
  ShieldCheck,
  Receipt
} from 'lucide-react';

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, currentTrip, transactions, fetchTripDetails, isLoading } = useTripStore();

  useEffect(() => {
    fetchTripDetails(id);
  }, [id]);

  if (isLoading || !currentTrip) return (
    <div className="p-10 flex flex-col items-center justify-center h-full text-slate-400 gap-3 min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="font-semibold text-xs animate-pulse">Unlocking trip vault...</p>
    </div>
  );

  const myData = currentTrip.members?.find(m => m.user?._id === user?._id);
  const isAdmin = myData?.role === 'admin';
  const myBalance = myData?.balance || 0;

  // Calculate vault statistics
  const totalExpenses = transactions
    ?.filter(t => t.type === 'expense')
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalContributions = transactions
    ?.filter(t => t.type === 'contribution')
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="p-6 pb-28">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate font-heading">
              {currentTrip.name}
            </h1>
            {isAdmin && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            Vault Balance: <strong className="text-slate-900 font-bold">{currentTrip.currency}{(currentTrip.totalVault || 0).toFixed(2)}</strong>
          </p>
        </div>

        <button 
          onClick={() => navigate('/profile')} 
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform border-2 border-white shrink-0"
          title="My Profile"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
          )}
        </button>
      </header>

      {/* Premium Metallic Passbook Card */}
      <div className={`relative overflow-hidden p-6 rounded-[2.5rem] shadow-2xl text-white mb-6 transition-all ${
        myBalance > 0.01 
          ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-600/25' 
          : myBalance < -0.01
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-slate-950/25'
            : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 shadow-indigo-600/25'
      }`}>
        <WalletCards className="absolute -right-8 -top-8 w-44 h-44 opacity-10 rotate-12 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 bg-white/20 flex items-center justify-center text-[10px] font-extrabold shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-white/80 font-bold tracking-wider text-[11px] uppercase">My Net Position</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold border border-white/20 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-300" />
            <span>Live Passbook</span>
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm font-heading">
          {currentTrip.currency}{Math.abs(myBalance).toFixed(2)}
        </h2>
        
        <div className="mt-5 bg-white/15 border border-white/20 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold backdrop-blur-md">
          {myBalance > 0.01 ? (
            <span className="flex items-center gap-1">🎉 The group owes you</span>
          ) : myBalance < -0.01 ? (
            <span className="flex items-center gap-1">💸 You owe the group</span>
          ) : (
            <span className="flex items-center gap-1">✨ All settled up</span>
          )}
        </div>
      </div>

      {/* Quick Action Pills Grid (Admin and Member shortcuts) */}
      <div className="grid grid-cols-3 gap-2.5 mb-7">
        {isAdmin && (
          <button
            onClick={() => navigate(`/trip/${id}/add-money`)}
            className="bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Log Money</span>
          </button>
        )}

        <button
          onClick={() => navigate(`/trip/${id}/add-member`)}
          className={`bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 group ${!isAdmin ? 'col-span-1.5' : ''}`}
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Users size={18} />
          </div>
          <span className="text-[11px] font-bold text-slate-800">Companions</span>
        </button>

        <button
          onClick={() => navigate(`/trip/${id}/history`)}
          className={`bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 group ${!isAdmin ? 'col-span-1.5' : ''}`}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <History size={18} />
          </div>
          <span className="text-[11px] font-bold text-slate-800">Timeline</span>
        </button>
      </div>

      {/* Vault Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <div className="flex items-center gap-1.5 text-rose-500 mb-1">
            <ArrowDownRight size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
          </div>
          <p className="text-lg font-black text-slate-900 font-heading">
            {currentTrip.currency}{totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
            <ArrowUpRight size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pooled</span>
          </div>
          <p className="text-lg font-black text-slate-900 font-heading">
            {currentTrip.currency}{totalContributions.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Group Ledger / Companions Balance */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm text-slate-900 tracking-wider uppercase font-heading flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <span>Group Ledger ({currentTrip.members?.length || 0})</span>
          </h3>
          <button 
            onClick={() => navigate(`/trip/${id}/add-member`)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Manage
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {currentTrip.members?.map((member) => {
            const isMemberAdmin = member.role === 'admin';
            const isSelf = member.user?._id === user?._id;
            const balance = member.balance || 0;

            return (
              <div 
                key={member.user?._id || member._id} 
                className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100/80 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white border-2 border-white shadow-sm flex items-center justify-center text-lg font-bold overflow-hidden shrink-0">
                    {member.user?.avatar ? (
                      <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                    ) : (
                      member.user?.name ? member.user.name.charAt(0).toUpperCase() : <User size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {member.user?.name} {isSelf ? '(You)' : ''}
                      </p>
                      {isMemberAdmin && (
                        <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                      {member.user?.phone ? `📱 ${member.user.phone}` : (member.user?.email || 'No contact')}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-black text-sm tracking-tight font-heading ${
                    balance > 0.01 ? 'text-emerald-600' : (balance < -0.01 ? 'text-slate-900' : 'text-slate-400')
                  }`}>
                    {balance > 0.01 ? '+' : ''}{currentTrip.currency}{balance.toFixed(2)}
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {balance > 0.01 ? 'Owed' : (balance < -0.01 ? 'Owes' : 'Settled')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!isAdmin && (
        <section className="bg-slate-100/70 border border-slate-200/80 p-4 rounded-3xl text-center mt-6">
          <p className="text-xs font-semibold text-slate-500">
            🔒 You are viewing this trip in <strong>Read-Only</strong> mode. Your trip organizer logs shared expenses and vault funds.
          </p>
        </section>
      )}
    </div>
  );
}