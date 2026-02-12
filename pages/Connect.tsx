
import React, { useState } from 'react';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, UserCheck, Sparkles, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PasswordRecovery } from '../components/PasswordRecovery';

interface ConnectProps {
  onLogin?: (user: User) => void;
}

export const Connect: React.FC<ConnectProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [allowAdminToggle, setAllowAdminToggle] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  React.useEffect(() => {
    mockApi.getPublicConfig().then(cfg => setAllowAdminToggle(!!cfg.allowAdminToggle)).catch(() => setAllowAdminToggle(false));
  }, []);

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      const res = await mockApi.seedData();
      alert(res);
    } catch (e) {
      console.error(e);
      alert('Failed to seed data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userId: string) => {
    setIsLoading(true);
    try {
      const user = await mockApi.login(userId);
      if (onLogin) {
        onLogin(user);
      }
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setIsLoading(true);
    setError(null);
    try {
        const user = await mockApi.verify2FALogin(mfaCode, tempToken);
        if (onLogin) onLogin(user);
        navigate('/dashboard');
    } catch (err) {
        console.error('MFA error', err);
        setError(err instanceof Error ? err.message : 'Invalid code');
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let user: User;
      if (isLogin) {
        user = await mockApi.loginWithEmail(email, password);
      } else {
        user = await mockApi.registerUser(name, email, password, isAdmin);
      }
      if (onLogin) onLogin(user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Auth error', err);
      if (err.code === 'MFA_REQUIRED') {
          setTempToken(err.token);
          setShowMfaInput(true);
          setIsLoading(false);
          return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  if (showMfaInput) {
      // Modal is rendered below, so we return null here to avoid full page replacement if we were doing that before
      // But actually we want to render the main page AND the modal on top.
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-140px)] gap-8 animate-fade-in relative">
      
      {/* MFA Modal */}
      {showMfaInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-scale-in">
              <div className="p-8 md:p-10">
                  <div className="mb-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Shield className="text-brand-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Your account is protected. Please enter the 6-digit code from your authenticator app to continue.
                    </p>
                  </div>
        
                  <form onSubmit={handleMfaSubmit} className="space-y-6">
                    {error && (
                      <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-start gap-2">
                        <span className="font-bold">Error:</span> {error}
                      </div>
                    )}
                    
                    <div>
                       <div className="relative group">
                           <input 
                                value={mfaCode} 
                                onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))} 
                                type="text" 
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all text-center tracking-[0.75em] font-mono text-2xl font-bold text-gray-800 placeholder-gray-300" 
                                placeholder="000000" 
                                maxLength={6}
                                required 
                                autoFocus
                           />
                       </div>
                    </div>
        
                    <button type="submit" disabled={isLoading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 text-lg">
                      {isLoading ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Verify & Connect <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => { setShowMfaInput(false); setTempToken(null); setMfaCode(''); setError(null); }}
                        className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors"
                    >
                        Cancel Login
                    </button>
                  </form>
              </div>
           </div>
        </div>
      )}

      {/* Visual Side */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-brand-600 to-teal-800 rounded-3xl relative overflow-hidden text-white p-12 flex-col justify-between shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
         
         <div>
            <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-lg">
               <Shield size={24} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">{t('connect.hero_title').split(',')[0]},<br/>{t('connect.hero_title').split(',')[1]}</h2>
            <p className="text-brand-100 text-lg max-w-sm">
               {t('connect.hero_desc')}
            </p>
         </div>

         <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <div className="bg-white/20 p-2 rounded-full"><Sparkles size={16} /></div>
               <div>
                  <div className="font-bold">{t('connect.trust_system')}</div>
                  <div className="text-xs text-brand-100">{t('connect.trust_desc')}</div>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <div className="bg-white/20 p-2 rounded-full"><UserCheck size={16} /></div>
               <div>
                  <div className="font-bold">{t('connect.hyper_local')}</div>
                  <div className="text-xs text-brand-100">{t('connect.local_desc')}</div>
               </div>
            </div>
         </div>
      </div>

      {/* Auth Form Side */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-soft border border-gray-100">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{isLogin ? t('connect.welcome_back') : t('connect.create_account')}</h1>
            <p className="text-gray-500 mt-2 text-sm">
              {isLogin ? t('connect.login_desc') : t('connect.signup_desc')}
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('connect.login_btn')}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('connect.signup_btn')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}
            {!isLogin && (
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">{t('connect.full_name')}</label>
                 <div className="relative group">
                   <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                   <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all" placeholder="Jane Doe" required />
                 </div>
               </div>
            )}
            {!isLogin && allowAdminToggle && (
              <div className="flex items-center gap-2">
                <input id="isAdmin" type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="isAdmin" className="text-sm text-gray-700 font-medium">Admin</label>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">{t('connect.email')}</label>
               <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                   <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all" placeholder="you@example.com" required />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">{t('connect.password')}</label>
               <div className="relative group">
                   <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                   <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all" placeholder="••••••••" required />
               </div>
               {isLogin && (
                 <button
                   type="button"
                   onClick={() => setShowPasswordRecovery(true)}
                   className="text-sm text-brand-600 hover:text-brand-700 mt-2 ml-1"
                 >
                   Forgot Password?
                 </button>
               )}
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:transform-none">
              {isLoading ? t('connect.processing') : (isLogin ? t('connect.sign_in') : t('connect.create_account'))}
              {!isLoading && <ArrowRight size={18} className="ml-2" />}
            </button>
          </form>
          
          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">{t('connect.demo_text')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <DemoButton label="Lender" role="Trust 98" color="text-green-600 bg-green-50 hover:bg-green-100" onClick={() => handleDemoLogin('user_lender')} />
              <DemoButton label="Borrower" role="New User" color="text-amber-600 bg-amber-50 hover:bg-amber-100" onClick={() => handleDemoLogin('user_borrower')} />
              <DemoButton label="Admin" role="Staff" color="text-purple-600 bg-purple-50 hover:bg-purple-100" onClick={() => handleDemoLogin('user_admin')} />
              <DemoButton label="Unverified" role="Demo" color="text-slate-600 bg-slate-50 hover:bg-slate-100" onClick={() => handleDemoLogin('user_unverified_demo')} />
            </div>
            <div className="mt-4 flex justify-center">
               <button 
                  type="button"
                  onClick={handleSeedData}
                  disabled={isLoading}
                  className="text-xs font-medium text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1"
               >
                  <Sparkles size={12} />
                  Load Seed Data
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {showPasswordRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <PasswordRecovery 
            onBackToLogin={() => setShowPasswordRecovery(false)}
            onRecoverySuccess={() => {
              setShowPasswordRecovery(false);
              setError('Password reset successful! Please login with your new password.');
            }}
          />
        </div>
      )}
    </div>
  );
};

const DemoButton = ({ label, role, color, onClick }: { label: string, role: string, color: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg text-center transition-colors border border-transparent hover:border-black/5 ${color}`}
  >
    <div className="font-bold text-sm text-gray-900">{label}</div>
    <div className="text-[10px] opacity-80">{role}</div>
  </button>
);
