import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/pages/Home';
import UniversityLogin from '@/pages/UniversityLogin';
import VerifierLogin from '@/pages/VerifierLogin';
import IssuerDashboard from '@/pages/IssuerDashboard';
import VerifierDashboard from '@/pages/VerifierDashboard';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/university" element={<UniversityLogin />} />
          <Route path="/login/verifier" element={<VerifierLogin />} />
          <Route
            path="/dashboard/issuer"
            element={
              <ProtectedRoute requiredRole="issuer">
                <IssuerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/verifier"
            element={
              <ProtectedRoute requiredRole="verifier">
                <VerifierDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
