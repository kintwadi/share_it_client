import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ChevronLeft, Shield, CheckCircle } from 'lucide-react';
import { mockApi } from '../services/mockApi';

interface PasswordRecoveryProps {
  onBackToLogin: () => void;
  onRecoverySuccess?: () => void;
}

export const PasswordRecovery: React.FC<PasswordRecoveryProps> = ({ onBackToLogin, onRecoverySuccess }) => {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await mockApi.requestPasswordReset(email);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mockApi.verifyResetCode(email, code);
      if (result.valid && result.token) {
        setResetToken(result.token);
        setStep('password');
      } else {
        setError('Invalid verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (!resetToken) {
      setError('Reset token is missing');
      setIsLoading(false);
      return;
    }
    
    try {
      await mockApi.resetPassword(resetToken, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onRecoverySuccess?.();
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Mail className="text-brand-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
        <p className="text-gray-500 text-sm">
          Enter your email address and we'll send you a 4-digit code to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Send Recovery Code <ArrowRight size={20} />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors flex items-center justify-center gap-2"
      >
        <ChevronLeft size={16} /> Back to Login
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleCodeSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Shield className="text-brand-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h1>
        <p className="text-gray-500 text-sm">
          We sent a 4-digit code to <span className="font-medium text-gray-700">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all text-center tracking-[0.75em] font-mono text-2xl font-bold text-gray-800 placeholder-gray-300"
            placeholder="0000"
            maxLength={4}
            required
            autoFocus
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Verify Code <ArrowRight size={20} />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setStep('email')}
        className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors flex items-center justify-center gap-2"
      >
        <ChevronLeft size={16} /> Use different email
      </button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="text-brand-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
        <p className="text-gray-500 text-sm">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
            placeholder="New password"
            required
            minLength={6}
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
            placeholder="Confirm new password"
            required
            minLength={6}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Reset Password <ArrowRight size={20} />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setStep('code')}
        className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors flex items-center justify-center gap-2"
      >
        <ChevronLeft size={16} /> Back to code verification
      </button>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <CheckCircle className="text-green-600" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
      <p className="text-gray-500 text-sm">
        Your password has been successfully reset. Redirecting to login...
      </p>
      <div className="w-8 h-8 border-3 border-brand-600/30 border-t-brand-600 rounded-full animate-spin mx-auto" />
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100">
        {success ? renderSuccess() : (
          <>
            {step === 'email' && renderEmailStep()}
            {step === 'code' && renderCodeStep()}
            {step === 'password' && renderPasswordStep()}
          </>
        )}
      </div>
    </div>
  );
};