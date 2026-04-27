import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const { login, signup, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      const success = await login({ email: formData.email, password: formData.password });
      if (success) navigate('/');
    } else {
      const success = await signup(formData);
      if (success) {
        const loginSuccess = await login({ email: formData.email, password: formData.password });
        if (loginSuccess) navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="w-full max-w-[1000px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        <div className="md:w-1/2 bg-black text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9E00FF]/30 via-black to-black opacity-60 z-0"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">SINGULAR.</h1>
            <p className="text-gray-400 font-bold tracking-widest text-[11px] uppercase">Mastercrafted Systems</p>
          </div>
          
          <div className="relative z-10 mt-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-5xl font-black mb-6 leading-tight">
                  {isLogin ? "Welcome back to the future." : "Start building your legacy."}
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                  {isLogin 
                    ? "Access your saved configurations, track your orders, and explore new builds." 
                    : "Create an account to save custom PC builds and check out faster."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
          <div className="max-w-md mx-auto w-full">
            <div className="flex gap-8 mb-12 border-b border-gray-100">
              <button 
                onClick={() => setIsLogin(true)}
                className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${isLogin ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Sign In
                {isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#9E00FF] rounded-t-full" />}
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${!isLogin ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Create Account
                {!isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#9E00FF] rounded-t-full" />}
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-4 overflow-hidden"
                >
                  <div className="space-y-2 flex-1">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full bg-[#F8F9FA] border border-gray-100 rounded-xl pl-12 pr-4 py-4 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#9E00FF] focus:ring-1 focus:ring-[#9E00FF] transition-all"
                        placeholder="First Name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full bg-[#F8F9FA] border border-gray-100 rounded-xl pl-12 pr-4 py-4 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#9E00FF] focus:ring-1 focus:ring-[#9E00FF] transition-all"
                        placeholder="Last Name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8F9FA] border border-gray-100 rounded-xl pl-12 pr-4 py-4 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#9E00FF] focus:ring-1 focus:ring-[#9E00FF] transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8F9FA] border border-gray-100 rounded-xl pl-12 pr-4 py-4 text-[#1A1A1A] font-medium focus:outline-none focus:border-[#9E00FF] focus:ring-1 focus:ring-[#9E00FF] transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#9E00FF] text-white py-5 rounded-xl font-black text-lg hover:bg-[#8A00E6] transition-all flex items-center justify-center gap-3 mt-8 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
