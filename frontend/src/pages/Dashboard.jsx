import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import { WalletCards } from 'lucide-react';

export default function Dashboard() {
  const { id } = useParams();
  const { user, currentTrip, fetchTripDetails, isLoading } = useTripStore();

  useEffect(() => {
    fetchTripDetails(id);
  }, [id]);

  if (isLoading || !currentTrip) return (
    <div className="p-10 flex flex-col items-center justify-center h-full text-gray-400 gap-3">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="font-medium animate-pulse">Unlocking vault...</p>
    </div>
  );

  const myData = currentTrip.members.find(m => m.user._id === user._id);
  const isAdmin = myData?.role === 'admin';
  const myBalance = myData?.balance || 0;

  return (
    <div className="p-6">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{currentTrip.name}</h1>
          <p className="text-gray-500 font-medium mt-1">Vault Total: {currentTrip.currency}{(currentTrip.totalVault || 0).toFixed(2)}</p>
        </div>
      </header>

      {/* Premium Passbook Card */}
      <div className={`relative overflow-hidden p-7 rounded-[2rem] shadow-xl text-white mb-10 transition-all ${
        myBalance >= 0 
          ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-emerald-500/20' 
          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-gray-900/20'
      }`}>
        <WalletCards className="absolute -right-6 -top-6 w-40 h-40 opacity-[0.07] rotate-12" />
        
        <p className="text-white/80 font-medium tracking-wide text-sm uppercase">My Net Position</p>
        <h2 className="text-5xl font-extrabold tracking-tighter mt-2 drop-shadow-sm">
          {currentTrip.currency}{Math.abs(myBalance).toFixed(2)}
        </h2>
        
        <div className="mt-6 bg-white/20 border border-white/20 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-md">
          {myBalance >= 0 ? "🎉 The group owes you" : "💸 You owe the group"}
        </div>
      </div>

      {/* Admin View: Manage Everyone */}
      {isAdmin ? (
        <section>
          <h3 className="font-bold text-lg text-gray-900 mb-4 tracking-tight">Group Ledger</h3>
          <div className="flex flex-col gap-3">
            {currentTrip.members.map(member => (
              <div key={member.user._id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
                    {member.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{member.user.name}</p>
                    <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">{member.role}</p>
                  </div>
                </div>
                <div className={`font-black tracking-tight text-lg ${member.balance < 0 ? 'text-gray-900' : 'text-emerald-500'}`}>
                  {member.balance > 0 ? '+' : ''}{currentTrip.currency}{member.balance.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-gray-50 border border-gray-100 p-6 rounded-3xl text-center">
          <p className="text-sm font-medium text-gray-500">
            You are in <strong>Read-Only</strong> mode. Give cash to your trip Admin to log transactions.
          </p>
        </section>
      )}
    </div>
  );
}