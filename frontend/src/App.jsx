import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useTripStore from './store/useTripStore';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import TripsList from './pages/TripList';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import AddMember from './pages/AddMember';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
  const user = useTripStore((state) => state.user);
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  const user = useTripStore((state) => state.user);

  return (
    <BrowserRouter>
      {/* Mobile Shell Constraint */}
      <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-50 text-gray-900 shadow-2xl relative overflow-hidden">
        
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            
            <Route path="/" element={<ProtectedRoute><TripsList /></ProtectedRoute>} />
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
    </BrowserRouter>
  );
}

export default App;