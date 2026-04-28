import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard'; // Changed from @/ to relative path
import { toast } from '../components/Toast'; // Changed from @/ to relative path
import { login as apiLogin } from '../utils/api'; // Changed from @/ to relative path
import { useAuth } from '../contexts/AuthContext'; // Changed from @/ to relative path

export default function UniversityLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Safer type handling
  const from = (() => {
    const state = location.state as any;
    if (state?.from?.pathname) {
      return state.from.pathname;
    }
    return '/dashboard/issuer';
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      if (toast && toast.error) {
        toast.error('Please fill in all fields');
      }
      return;
    }

    setLoading(true);
    try {
      if (apiLogin) {
        await apiLogin({ email, password });
      }
      if (login) {
        login(email, 'issuer');
      }
      if (toast && toast.success) {
        toast.success('Login successful');
      }
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Login failed';
      if (toast && toast.error) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center animate-fade-in">
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative p-8 glass-card glow-primary">
              <GraduationCap className="w-32 h-32 text-primary" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-foreground text-center">
            University Portal
          </h2>
          <p className="mt-2 text-muted-foreground text-center max-w-xs">
            Issue tamper-proof certificates and manage your institution's credentials
          </p>
        </div>

        {/* Right: Login Form */}
        <GlassCard className="animate-slide-up">
          <div className="lg:hidden flex justify-center mb-6">
            <div className="p-4 rounded-xl bg-primary/10">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center lg:text-left mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-center lg:text-left mb-8">
            Sign in to your university account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input-glass pl-10"
                  aria-label="Email address"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-glass pl-10 pr-10"
                  aria-label="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Demo credentials: <code className="text-primary">you@example.com</code> / <code className="text-primary">password123</code>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}