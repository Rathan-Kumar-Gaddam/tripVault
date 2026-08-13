import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTripStore from '../store/useTripStore';

export default function Dashboard() {
  const { id } = useParams();
  const { user, currentTrip, fetchTripDetails, isLoading } = useTripStore();

  useEffect(() => {
    fetchTripDetails(id);
  }, [fetchTripDetails, id]);

  if (isLoading || !currentTrip) return <div className="p-10 text-center animate-pulse">Unlocking vault...</div>;

  const myData = currentTrip.members.find(m => m.user._id === user._id);
  const isAdmin = myData?.role === 'admin';
  const myBalance = myData?.balance || 0;

  return (
    <div className="p-5">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{currentTrip.name}</h1>
        <p className="text-gray-500 text-sm">
          Vault Total: {currentTrip.currency}{(currentTrip.totalVault || 0).toFixed(2)}
        </p>
      </div>

      {/* Main Passbook Card */}
      <div className={`p-6 rounded-3xl shadow-lg text-white mb-8 ${myBalance >= 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-rose-500 to-orange-500'
        }`}>
        <p className="text-white/80 text-sm font-medium">My Net Position</p>
        <h2 className="text-5xl font-extrabold tracking-tighter mt-1">
          {currentTrip.currency}{Math.abs(myBalance).toFixed(2)}
        </h2>
        <div className="mt-4 bg-white/20 inline-block px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          {myBalance >= 0 ? "🎉 Group owes you" : "💸 You owe the group"}
        </div>
      </div>

      {/* Admin View: Manage Everyone */}
      {isAdmin ? (
        <section>
          <h3 className="font-semibold text-gray-800 mb-3 ml-1">Group Ledger</h3>
          <div className="flex flex-col gap-3">
            {currentTrip.members.map(member => (
              <div key={member.user._id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                <div>
                  <p className="font-medium text-gray-900">{member.user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                </div>
                <div className={`font-bold text-lg ${member.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {member.balance > 0 ? '+' : ''}{currentTrip.currency}{member.balance.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-blue-50 border border-blue-100 p-5 rounded-2xl text-center">
          <p className="text-sm text-blue-800">
            You are in <strong>Read-Only</strong> mode. Give cash to your trip Admin and they will log it here.
          </p>
        </section>
      )}
    </div>
  );
}
