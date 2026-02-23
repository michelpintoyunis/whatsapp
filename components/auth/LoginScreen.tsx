'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    let errorMsg = null;
    const cleanEmail = email.trim();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) errorMsg = error.message;
    } else {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: username.trim(),
          }
        }
      });
      if (error) errorMsg = error.message;
      else toast.success('Account created successfully!');
    }

    if (errorMsg) {
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#f0f2f5] dark:bg-[#111b21] items-center text-wa-text-primary">
      {/* WhatsApp style green header bar */}
      <div className="w-full h-[222px] bg-wa-primary absolute top-0 left-0 -z-10 hidden sm:block"></div>
      
      <div className="w-full max-w-[1000px] flex items-center gap-4 mt-8 mb-8 px-6 sm:px-0">
        <svg viewBox="0 0 39 39" width="39" height="39" className="fill-wa-primary sm:fill-white">
          <path d="M10.7 32.8l.6.3c2.5 1.5 5.3 2.2 8.1 2.2 8.8 0 16-7.2 16-16 0-4.2-1.7-8.3-4.7-11.3s-7-4.7-11.3-4.7c-8.8 0-16 7.2-15.9 16.1 0 3 .8 5.9 2.3 8.4l.4.6-1.6 5.9 6.1-1.5z"></path>
        </svg>
        <span className="uppercase font-semibold text-[14px] text-wa-text-primary sm:text-white tracking-wide">
          WhatsApp Web Clone
        </span>
      </div>

      <div className="bg-wa-bg-panel w-full sm:w-[90%] md:max-w-[1000px] sm:min-h-[500px] sm:rounded-md shadow-lg sm:p-14 p-6 flex flex-col md:flex-row gap-12 sm:gap-16">
        
        {/* Instructions Side (QR code placeholder) */}
        <div className="flex-1 flex flex-col gap-6 order-2 md:order-1 items-center md:items-start text-center md:text-left">
           <h2 className="text-[28px] font-light text-[#41525d] dark:text-[#E9EDEF]">
             Use WhatsApp Clone on your computer
           </h2>
           <ol className="text-[18px] text-[#3b4a54] dark:text-[#8696a0] flex flex-col gap-4 list-decimal pl-5">
             <li>Register a new account or sign in with an existing one.</li>
             <li>Search for contacts in the system using the &quot;New Chat&quot; button.</li>
             <li>Send End-to-End encrypted messages seamlessly.</li>
             <li>Enjoy realtime typing presence and delivery status.</li>
           </ol>
           
           <div className="mt-8 text-[14px] text-wa-primary font-medium hover:underline cursor-pointer">
              Need help to get started?
           </div>
        </div>

        {/* Auth Form Side */}
        <div className="w-full md:w-[350px] shrink-0 border border-wa-border p-6 rounded-lg bg-wa-bg-main shadow-inner order-1 md:order-2">
          <h3 className="text-xl mb-6 font-medium text-center">
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-[14px]">
            {!isLogin && (
              <div className="flex flex-col gap-1">
                <label className="text-wa-text-secondary">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-wa-bg-panel border border-wa-border p-3 rounded outline-none focus:border-wa-primary transition-colors"
                  placeholder="JohnDoe"
                />
              </div>
            )}
            
            <div className="flex flex-col gap-1">
              <label className="text-wa-text-secondary">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-wa-bg-panel border border-wa-border p-3 rounded outline-none focus:border-wa-primary transition-colors"
                placeholder="email@example.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-wa-text-secondary">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-wa-bg-panel border border-wa-border p-3 rounded outline-none focus:border-wa-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 bg-wa-primary text-white font-medium p-3 rounded hover:bg-[#018e6f] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-wa-text-secondary text-[14px]">
            {isLogin ? "Don't have an account? " : "Already registered? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-wa-primary font-medium hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
