import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const { login, signup, loading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const success = await login({ email: formData.email, password: formData.password });
      if (success) onClose();
    } else {
      const success = await signup(formData);
      if (success) setIsLogin(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="bg-black p-8 text-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-black mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Access your custom builds and orders.' : 'Join our community of hardware enthusiasts.'}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="text"
                      required
                      placeholder="john_doe"
                      className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-[#9E00FF] outline-none transition-all font-medium"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-[#9E00FF] outline-none transition-all font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-[#9E00FF] outline-none transition-all font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

              <button 
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Login' : 'Sign Up')}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#9E00FF] font-bold hover:underline"
                >
                  {isLogin ? 'Create one' : 'Login here'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
