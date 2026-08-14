import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useTripStore from './store/useTripStore';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import TripsList from './pages/TripList';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import AddMember from './pages/AddMember';
import History from './pages/History';
import Profile from './pages/Profile';
import JoinTrip from './pages/JoinTrip';

const ProtectedRoute = ({ children }) => {
  const user = useTripStore((state) => state.user);
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  const user = useTripStore((state) => state.user);

  return (
    <BrowserRouter>
      {/* Outer Viewport Canvas with Ambient Glow */}
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 relative overflow-x-hidden">
        {/* Background Aurora Orbs on Large Screens */}
        <div className="hidden sm:block absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-ambient"></div>
        <div className="hidden sm:block absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '4s' }}></div>

        {/* Responsive App Frame: Full bleed on mobile, expansive container on tablet/desktop */}
        <div className="w-full max-w-5xl xl:max-w-6xl min-h-screen flex flex-col bg-slate-50 text-slate-900 shadow-2xl sm:border-x sm:border-slate-200/80 relative">
          
          {/* Scrollable Content Area */}
          <main className="flex-1 w-full pb-28 sm:pb-24">
            <Routes>
              <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
              <Route path="/join/:id" element={<JoinTrip />} />
              <Route path="/trip/:id/join" element={<JoinTrip />} />
              
              <Route path="/" element={<ProtectedRoute><TripsList /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/trip/:id" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/trip/:id/add-money" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
              <Route path="/trip/:id/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
              <Route path="/trip/:id/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            </Routes>
          </main>

          {/* Render Bottom Nav only inside a trip */}
          <Routes>
            <Route path="/trip/:id/*" element={<BottomNav />} />
          </Routes>
        </div>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            zIndex: 9999,
            borderRadius: '16px',
            background: '#0f172a',
            color: '#fff',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
