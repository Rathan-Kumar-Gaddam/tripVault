import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useTripStore from './store/useTripStore';
import BottomNav from './components/BottomNav';
import { TripListSkeleton } from './components/SkeletonLoader';

// Lazy-loaded page components for instant initial bundle loading
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const TripsList = lazy(() => import('./pages/TripList'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const AddMember = lazy(() => import('./pages/AddMember'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const JoinTrip = lazy(() => import('./pages/JoinTrip'));

const ProtectedRoute = ({ children }) => {
  const user = useTripStore((state) => state.user);
  return user ? children : <Navigate to="/welcome" />;
};

function App() {
  const user = useTripStore((state) => state.user);

  return (
    <BrowserRouter>
      {/* Outer Viewport Canvas with Soft Ambient Glow */}
      <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-0 relative overflow-x-hidden">
        {/* Background Soft Orbs on Large Screens */}
        <div className="hidden sm:block absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none animate-ambient"></div>
        <div className="hidden sm:block absolute -bottom-40 -right-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '4s' }}></div>

        {/* Responsive App Frame: Full bleed on mobile, expansive container on tablet/desktop */}
        <div className="w-full max-w-5xl xl:max-w-6xl min-h-screen flex flex-col bg-slate-50 text-slate-900 shadow-xl sm:border-x sm:border-slate-200/80 relative">
          
          {/* Scrollable Content Area with Suspense Lazy Loading */}
          <main className="flex-1 w-full">
            <Suspense fallback={<TripListSkeleton />}>
              <Routes>
                <Route path="/welcome" element={<Landing />} />
                <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/join/:id" element={<JoinTrip />} />
                <Route path="/trip/:id/join" element={<JoinTrip />} />
                
                <Route path="/" element={user ? <ProtectedRoute><TripsList /></ProtectedRoute> : <Landing />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/trip/:id" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/trip/:id/add-money" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
                <Route path="/trip/:id/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
                <Route path="/trip/:id/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </main>

          {/* Render Bottom Nav only inside a trip */}
          <Routes>
            <Route path="/trip/:id/*" element={<BottomNav />} />
          </Routes>
        </div>
      </div>
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            zIndex: 9999,
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.96)',
            color: '#0f172a',
            fontWeight: '700',
            fontSize: '13px',
            padding: '12px 18px',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
