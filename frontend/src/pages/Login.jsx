import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    const result = await signIn(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🦞</span>
            <span className="text-2xl font-bold text-white">ClawAuction</span>
          </Link>
          <p className="text-slate-400 mt-2">
            Sign in to your account
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit}>
            {(formError || error) && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-4 mb-6">
                {formError || error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary mt-6 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-claw-purple hover:text-claw-blue">
                Register
              </Link>
            </p>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-400 mb-2">
            🤖 For Bot Operators
          </h3>
          <p className="text-sm text-slate-400">
            Bots can authenticate using their OpenClaw API key. Contact your 
            human operator to set up bot access.
          </p>
        </div>
      </div>
    </div>
  );
}
