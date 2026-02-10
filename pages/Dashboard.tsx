import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, UserRole, Listing, AvailabilityStatus, ListingType, BorrowHistoryItem, Review, UserStatus, VerificationStatus, Report } from '../types';
import { Plus, Wand2, Loader2, Package, Users, ShieldAlert, Search, Clock, MapPin, Calendar, Shield, Trash2, Edit2, Eye, EyeOff, X, Upload, Image as ImageIcon, BadgeCheck, ChevronRight, BellRing, Check, X as XIcon, MessageSquare, Zap, Ban, RefreshCcw, Mail, Phone, FileCheck, DollarSign, Gift, History, Star, AlertTriangle, CheckCircle2, Lock, Settings, Flag } from 'lucide-react';
import { generateDescription } from '../services/geminiService';
import { mockApi, uploadApi } from '../services/mockApi';
import { useLanguage } from '../contexts/LanguageContext';

import { PaymentSettings } from '../components/PaymentSettings';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

// --- Helper Components ---

const StatCard = ({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
    <div className="p-3 bg-gray-50 rounded-lg">
      {icon}
    </div>
  </div>
);

const RecommendationCard: React.FC<{ title: string, distance: string, icon: string, onClick: () => void }> = ({ title, distance, icon, onClick }) => (
  <div onClick={onClick} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group">
    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xl group-hover:bg-indigo-100 transition-colors">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-gray-900 truncate text-sm">{title}</h4>
      <div className="flex items-center text-xs text-gray-500 mt-0.5">
        <MapPin size={10} className="mr-1" />
        {distance}
      </div>
    </div>
    <div className="text-gray-300 group-hover:text-brand-600">
      <ChevronRight size={16} />
    </div>
  </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmText?: string, cancelText?: string, isDanger?: boolean }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors text-sm shadow-md ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const VerificationRequestModal = ({ currentUser, onClose, onSave }: { currentUser: User, onClose: () => void, onSave: (data: { address: string, phone: string }) => void }) => {
    const [address, setAddress] = useState(currentUser.address || '');
    const [phone, setPhone] = useState(currentUser.phone || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onSave({ address, phone });
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{t('dash.verify_identity')}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
                    <p>To become a verified member, please confirm your contact details. An admin will review your request.</p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Full Address</label>
                        <input 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white font-medium transition-all"
                            placeholder="123 Main St..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Phone Number</label>
                        <input 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm text-gray-600 bg-white transition-all"
                            placeholder="+1..."
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 my-6 pt-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-brand-600" />
                        Two-Factor Authentication (2FA)
                    </h4>
                    
                    {twoFactorError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {twoFactorError}
                        </div>
                    )}

                    {!twoFactorEnabled && !isSettingUp2FA && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-sm text-gray-600 mb-4">
                                Protect your account with an extra layer of security using Google Authenticator, Authy, or similar apps.
                            </p>
                            <button 
                                onClick={handleEnable2FA}
                                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg text-sm hover:bg-brand-700 transition-colors"
                            >
                                Enable 2FA
                            </button>
                        </div>
                    )}

                    {isSettingUp2FA && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                             <p className="text-sm text-gray-600 mb-4 font-medium">1. Scan this QR code with your authenticator app:</p>
                             {qrCode && <img src={qrCode} alt="2FA QR Code" className="mx-auto mb-4 border-4 border-white rounded-lg shadow-sm" />}
                             
                             <p className="text-sm text-gray-600 mb-2 font-medium">2. Enter the 6-digit code:</p>
                             <div className="flex gap-2">
                                <input 
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="000000"
                                />
                                <button 
                                    onClick={handleVerify2FA}
                                    disabled={verificationCode.length !== 6}
                                    className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify & Enable
                                </button>
                             </div>
                             <button onClick={() => { setIsSettingUp2FA(false); setQrCode(null); }} className="text-xs text-gray-400 hover:text-gray-600 mt-2 underline">Cancel Setup</button>
                        </div>
                    )}

                    {twoFactorEnabled && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                    <Check size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-green-800 text-sm">2FA is Enabled</p>
                                    <p className="text-xs text-green-600">Your account is secure.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleDisable2FA}
                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Disable
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t('dash.cancel')}</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!address || !phone || isSubmitting}
                        className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileEditModal = ({ currentUser, onClose, onSave, initialTab = 'general' }: { currentUser: User, onClose: () => void, onSave: (data: Partial<User>) => void, initialTab?: 'general' | 'security' | 'payment' }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment'>(initialTab);
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!currentUser.twoFactorEnabled);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const { t } = useLanguage();

  const handleEnable2FA = async () => {
    setTwoFactorError(null);
    try {
      const { qrCode } = await mockApi.setup2FA();
      setQrCode(qrCode);
      setIsSettingUp2FA(true);
    } catch (e) {
      setTwoFactorError('Failed to start 2FA setup');
    }
  };

  const handleVerify2FA = async () => {
    setTwoFactorError(null);
    try {
      await mockApi.verify2FA(verificationCode);
      setTwoFactorEnabled(true);
      setIsSettingUp2FA(false);
      setQrCode(null);
      setVerificationCode('');
      setSecuritySuccess('Two-factor authentication enabled successfully');
    } catch (e) {
      setTwoFactorError('Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await mockApi.disable2FA();
      setTwoFactorEnabled(false);
      setSecuritySuccess('Two-factor authentication disabled');
    } catch (e) {
      setTwoFactorError('Failed to disable 2FA');
    }
  };

  const handleSecuritySave = async () => {
    setSecurityError(null);
    setSecuritySuccess(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setSecurityError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await mockApi.changePassword(oldPassword, newPassword);
      setSecuritySuccess('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setSecurityError('Failed to change password. Check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const compressImage = async (file: File, maxSizeMB: number = 8, maxDim: number = 1200): Promise<File> => {
    if (file.size <= maxSizeMB * 1024 * 1024) return file;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const out = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
            resolve(out);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      img.src = url;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
       <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">{t('dash.edit_profile')}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
          </div>
          
          <div className="flex border-b border-gray-200 mb-6">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'general' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'security' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Security
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'payment' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Payment
            </button>
          </div>

          {activeTab === 'general' ? (
          <div className="space-y-5 animate-fade-in">
             <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer">
                   <img src={avatarUrl || `https://picsum.photos/seed/${currentUser.id}/120/120`} onError={(e)=>{ (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentUser.id}/120/120`; }} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-sm group-hover:border-brand-100 transition-colors" />
                   <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="text-white" size={24} />
                   </div>
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadError(null);
                      setUploading(true);
                      const fileToUpload = await compressImage(f);
                      const previewUrl = URL.createObjectURL(fileToUpload);
                      setAvatarUrl(previewUrl);
                      try {
                        const updated = await uploadApi.uploadUserAvatar(fileToUpload);
                        setAvatarUrl(updated.avatarUrl);
                        onSave({ avatarUrl: updated.avatarUrl });
                      } catch (err) {
                        const msg = err instanceof Error ? err.message : 'Failed to upload photo. Please try again.';
                        setUploadError(msg);
                      } finally {
                        setUploading(false);
                        URL.revokeObjectURL(previewUrl);
                      }
                   }} />
                   <button className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full border-2 border-white hover:bg-brand-600 transition-colors shadow-sm" disabled={uploading}>
                      <Edit2 size={12} />
                   </button>
                </div>
             </div>

             {uploading && (
               <div className="text-xs text-gray-500 mb-2 flex items-center"><Loader2 size={14} className="animate-spin mr-2"/> Uploading photo…</div>
             )}
             {uploadError && (
               <div className="text-xs text-red-600 mb-2">{uploadError}</div>
             )}

             <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Display Name</label>
                <input 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white transition-all font-medium"
                   placeholder="Enter your name"
                />
             </div>
             
             {/* Read-only email field for info */}
             <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Email</label>
                <input 
                   value={currentUser.email}
                   disabled
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Avatar URL (Optional)</label>
                <input 
                   value={avatarUrl}
                   onChange={(e) => setAvatarUrl(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm text-gray-600 bg-white transition-all"
                   placeholder="https://..."
                />
             </div>

             <div className="grid grid-cols-1 gap-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Phone</label>
                 <input
                   value={phone}
                   onChange={(e)=> setPhone(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm text-gray-600 bg-white transition-all"
                   placeholder="+1..."
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Address</label>
                 <input
                   value={address}
                   onChange={(e)=> setAddress(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm text-gray-600 bg-white transition-all"
                   placeholder="123 Main St..."
                 />
               </div>
             </div>

            <div className="flex gap-3 mt-8">
                <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t('dash.cancel')}</button>
                <button onClick={() => onSave({ name, avatarUrl, phone, address })} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg">{t('dash.save_changes')}</button>
            </div>
          </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-5 animate-fade-in">
                {securityError && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {securityError}
                    </div>
                )}
                {securitySuccess && (
                    <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
                        <Check size={16} />
                        {securitySuccess}
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-brand-600" />
                        Two-Factor Authentication
                    </h4>
                    
                    {currentUser.twoFactorEnabled ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <span className="font-bold text-green-900">2FA is Enabled</span>
                            </div>
                            <p className="text-sm text-green-800 mb-4">Your account is secured with two-factor authentication.</p>
                            <button 
                                onClick={async () => {
                                    if (confirm('Are you sure you want to disable 2FA?')) {
                                        try {
                                            await mockApi.disable2FA();
                                            onSave({ ...currentUser, twoFactorEnabled: false });
                                            setSecuritySuccess('2FA disabled successfully');
                                        } catch (e) {
                                            setSecurityError('Failed to disable 2FA');
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-white border border-green-200 text-green-700 hover:bg-green-100 rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                                Disable 2FA
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            {!qrCode ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldAlert className="text-gray-500" size={20} />
                                        <span className="font-bold text-gray-700">2FA is Disabled</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">Protect your account by enabling two-factor authentication using an authenticator app.</p>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const data = await mockApi.setup2FA();
                                                setQrCode(data.qrCode);
                                                setSecret(data.secret);
                                                setSecurityError(null);
                                            } catch (e) {
                                                setSecurityError('Failed to start 2FA setup');
                                            }
                                        }}
                                        className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-bold text-sm transition-colors shadow-sm"
                                    >
                                        Enable 2FA
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-800 font-medium">1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                                    <div className="flex justify-center bg-white p-2 rounded-lg border border-gray-200 w-fit mx-auto">
                                        <img src={qrCode} className="w-48 h-48" />
                                    </div>
                                    <div className="text-center text-xs text-gray-500">
                                        Secret: <span className="font-mono bg-gray-200 px-1 rounded">{secret}</span>
                                    </div>
                                    
                                    <p className="text-sm text-gray-800 font-medium mt-4">2. Enter the 6-digit code from the app</p>
                                    <div className="flex gap-2">
                                        <input 
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="000000"
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-center tracking-widest"
                                            maxLength={6}
                                        />
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    await mockApi.verify2FA(verificationCode);
                                                    onSave({ ...currentUser, twoFactorEnabled: true });
                                                    setSecuritySuccess('2FA enabled successfully');
                                                    setQrCode(null);
                                                    setSecret(null);
                                                    setVerificationCode('');
                                                } catch (e) {
                                                    setSecurityError('Invalid verification code');
                                                }
                                            }}
                                            className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => { setQrCode(null); setSecret(null); setVerificationCode(''); }}
                                        className="text-xs text-gray-500 hover:text-gray-700 underline mx-auto block mt-2"
                                    >
                                        Cancel Setup
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Current Password</label>
                    <input 
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white transition-all font-medium"
                        placeholder="Enter current password"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">New Password</label>
                    <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white transition-all font-medium"
                        placeholder="Min 6 characters"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Confirm New Password</label>
                    <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white transition-all font-medium"
                        placeholder="Re-enter new password"
                    />
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t('dash.cancel')}</button>
                    <button 
                        onClick={handleSecuritySave} 
                        disabled={isChangingPassword}
                        className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isChangingPassword ? <Loader2 className="animate-spin mx-auto" /> : 'Update Password'}
                    </button>
                </div>
            </div>
          ) : (
            <div className="animate-fade-in pt-4">
               <PaymentSettings />
            </div>
          )}
       </div>
    </div>
  );
};

const AdminUserDetailModal = ({ user, onClose, onToggleStatus, onDelete, onApproveVerification, onRevokeVerification }: { user: User, onClose: () => void, onToggleStatus: () => void, onDelete: () => void, onApproveVerification: () => void, onRevokeVerification: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
             <div className="flex items-center gap-4">
                <img src={user.avatarUrl} className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover" />
                <div>
                   <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                     {user.name}
                     {user.verificationStatus === VerificationStatus.VERIFIED && <BadgeCheck className="text-blue-500" size={20} />}
                   </h3>
                   <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600 uppercase tracking-wide">{user.role}</span>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto">
             
             {/* Verification Request Block */}
             {user.verificationStatus === VerificationStatus.PENDING && (
                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <FileCheck className="text-blue-600" size={20} />
                        <h4 className="font-bold text-blue-900">Verification Request</h4>
                    </div>
                    <p className="text-sm text-blue-800 mb-4">This user has requested identity verification using the details below.</p>
                    <button 
                        onClick={onApproveVerification}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-md"
                    >
                        Approve Verification
                    </button>
                 </div>
             )}

             {/* Verified User Block */}
             {user.verificationStatus === VerificationStatus.VERIFIED && (
                 <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <BadgeCheck className="text-green-600" size={20} />
                        <h4 className="font-bold text-green-900">Identity Verified</h4>
                    </div>
                    <p className="text-sm text-green-800 mb-4">This user is a verified member of the community.</p>
                    <button 
                        onClick={onRevokeVerification}
                        className="w-full py-2 bg-white border border-green-200 text-green-700 hover:bg-green-100 rounded-lg font-bold text-sm transition-colors shadow-sm"
                    >
                        Revoke Verification
                    </button>
                 </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="text-xs text-gray-500 uppercase font-bold mb-1">Trust Score</div>
                   <div className="text-3xl font-bold text-indigo-600">{user.trustScore}%</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="text-xs text-gray-500 uppercase font-bold mb-1">Vouches</div>
                   <div className="text-3xl font-bold text-emerald-600">{user.vouchCount}</div>
                </div>
             </div>

             {/* Sensitive Contact Information Block */}
             <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-4">
                <h4 className="flex items-center text-xs font-bold text-amber-800 uppercase tracking-wide">
                   <Lock size={12} className="mr-1.5" /> Private Contact Info
                </h4>
                <div className="grid grid-cols-1 gap-4">
                   <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg border border-amber-100 text-amber-600 shadow-sm">
                         <Mail size={16} />
                      </div>
                      <div className="min-w-0">
                         <div className="text-[10px] text-amber-600/70 font-bold uppercase tracking-wide">Email Address</div>
                         <div className="text-sm font-medium text-gray-900 truncate select-all">{user.email}</div>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg border border-amber-100 text-amber-600 shadow-sm">
                         <Phone size={16} />
                      </div>
                      <div className="min-w-0">
                         <div className="text-[10px] text-amber-600/70 font-bold uppercase tracking-wide">Phone Number</div>
                         <div className="text-sm font-medium text-gray-900 select-all">{user.phone}</div>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg border border-amber-100 text-amber-600 shadow-sm">
                         <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                         <div className="text-[10px] text-amber-600/70 font-bold uppercase tracking-wide">Home Address</div>
                         <div className="text-sm font-medium text-gray-900 select-all leading-snug">{user.address}</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500 font-medium">User ID</span>
                   <span className="text-sm font-mono text-gray-900">{user.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500 font-medium">Joined Date</span>
                   <span className="text-sm font-medium text-gray-900">{new Date(user.joinedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                   <span className="text-sm text-gray-500 font-medium">Status</span>
                   <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                   </span>
                </div>
                <div className="flex justify-between">
                   <span className="text-sm text-gray-500 font-medium">Location</span>
                   <span className="text-sm font-medium text-gray-900">{user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}</span>
                </div>
             </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
             <button 
                onClick={onToggleStatus}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors border shadow-sm ${
                   user.status === UserStatus.ACTIVE 
                   ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                   : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                }`}
             >
                {user.status === UserStatus.ACTIVE ? 'Block User' : 'Activate User'}
             </button>
             <button 
                onClick={onDelete}
                className="flex-1 py-3 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors shadow-sm"
             >
                Delete Account
             </button>
          </div>
       </div>
    </div>
  );
};

const AdminListingDetailModal = ({ listing, reports = [], onClose, onToggleBlock, onDelete, onDismissAll, onDismissReport }: { listing: Listing, reports?: Report[], onClose: () => void, onToggleBlock: () => void, onDelete: () => void, onDismissAll?: () => void, onDismissReport?: (id: string) => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="relative h-56 bg-gray-100 shrink-0">
             <img src={listing.imageUrl} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
             <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors border border-white/20">
                <X size={20} />
             </button>
             <div className="absolute bottom-6 left-6 text-white right-6">
                <h3 className="font-bold text-2xl leading-tight mb-1">{listing.title}</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                   <span className="px-2 py-0.5 bg-white/20 rounded-md backdrop-blur-sm border border-white/20">{listing.category}</span>
                   <span>•</span>
                   <span>{listing.type}</span>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
             {reports && reports.length > 0 && (
                <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-red-900 text-sm flex items-center gap-2">
                            <Flag className="text-red-500" size={16} />
                            {reports.length} Active Report{reports.length > 1 ? 's' : ''}
                        </h4>
                        {onDismissAll && (
                            <button 
                                onClick={onDismissAll}
                                className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline"
                            >
                                Dismiss All
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        {reports.map((report, idx) => (
                            <div key={idx} className="p-4 bg-red-50 border border-red-100 rounded-xl relative group">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-900 text-sm mb-1">{report.reason}</h4>
                                        <p className="text-red-700 text-sm">{report.details}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-red-600/80">
                                            <span>Reported by {report.reporter?.name || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {onDismissReport && (
                                        <button
                                            onClick={() => onDismissReport(report.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 text-red-500 rounded-lg"
                                            title="Dismiss this report"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <div className="space-y-4">
                <div>
                   <h4 className="font-bold text-gray-900 text-sm mb-2 uppercase tracking-wide opacity-70">Description</h4>
                   <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-400 font-bold uppercase mb-1">Status</div>
                      <div className={`text-sm font-bold ${
                         listing.status === AvailabilityStatus.AVAILABLE ? 'text-emerald-600' :
                         listing.status === AvailabilityStatus.BLOCKED ? 'text-red-600' : 'text-amber-600'
                      }`}>{listing.status}</div>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-xs text-gray-400 font-bold uppercase mb-1">Price / Day</div>
                      <div className="text-sm font-bold text-gray-900">${listing.hourlyRate}</div>
                   </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      <img src={listing.owner?.avatarUrl || `https://ui-avatars.com/api/?name=${listing.ownerId}`} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <div className="text-xs text-gray-400 font-bold uppercase">Owner</div>
                      <div className="font-bold text-gray-900 text-sm">{listing.owner?.name || listing.ownerId}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 shrink-0">
             <div className="flex gap-3">
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="flex-1 py-3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors shadow-sm"
                 >
                    Cancel
                 </button>
                 {onDismissAll && reports && reports.length > 0 && (
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDismissAll(); }}
                        className="flex-1 py-3 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        Dismiss Reports
                    </button>
                 )}
             </div>
             <div className="flex gap-3">
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleBlock(); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors border flex items-center justify-center gap-2 shadow-sm ${
                       listing.status !== AvailabilityStatus.BLOCKED
                       ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                       : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                 >
                    {listing.status !== AvailabilityStatus.BLOCKED ? <><Ban size={16}/> Block Listing</> : <><CheckCircle2 size={16}/> Unblock</>}
                 </button>
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors shadow-sm"
                 >
                    Delete Listing
                 </button>
             </div>
          </div>
       </div>
    </div>
  );
};

// ... ReviewModal & ItemForm omitted for brevity, but same pattern applies ...
const ReviewModal = ({ item, currentUser, onClose, onComplete }: { item: Listing, currentUser: User, onClose: () => void, onComplete: (data: {rating: number, comment: string} | null) => void }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
         <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-6 overflow-hidden shadow-sm border border-gray-100">
            <img src={item.imageUrl} className="w-full h-full object-cover" />
         </div>
         <h3 className="font-bold text-gray-900 text-xl mb-1">Return Item</h3>
         <p className="text-sm text-gray-500 mb-8">How was your experience with <br/><span className="font-semibold text-gray-900">{item.title}</span>?</p>

         <div className="flex justify-center gap-3 mb-8">
            {[1,2,3,4,5].map(star => (
               <button key={star} onClick={() => setRating(star)} className="text-amber-400 hover:scale-110 transition-transform focus:outline-none">
                  <Star size={36} className={star <= rating ? 'fill-current' : 'text-gray-200'} />
               </button>
            ))}
         </div>

         <textarea 
           value={comment}
           onChange={e => setComment(e.target.value)}
           className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-none"
           placeholder="Write a thank you note..."
           rows={3}
         />

         <div className="flex gap-3">
            <button 
              onClick={() => onComplete(null)} 
              className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={() => onComplete({rating, comment})} 
              className="flex-1 py-3 bg-brand-600 text-white font-bold text-sm rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5"
            >
              Submit
            </button>
         </div>
      </div>
    </div>
  );
};

const ItemForm = ({ initialData, onClose, onSave }: { initialData?: Listing, onClose: () => void, onSave: (data: Partial<Listing>) => Promise<void> | void }) => {
  const { t, formatPrice, currency } = useLanguage();
  const [formData, setFormData] = useState<Partial<Listing>>(initialData || {
    title: '',
    category: 'Tools',
    type: ListingType.GOODS,
    description: '',
    hourlyRate: 0,
    imageUrl: '',
    gallery: [],
    autoApprove: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!formData.title || !formData.category) return;
    setIsGenerating(true);
    const desc = await generateDescription(formData.title, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === 'cover') {
        const file = files[0] as File;
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, imageUrl: localUrl }));
        try {
          const url = await uploadApi.uploadListingImage(file);
          setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch {}
    } else {
        for (const file of Array.from(files)) {
          const localUrl = URL.createObjectURL(file);
          setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), localUrl] }));
          try {
            const url = await uploadApi.uploadListingImage(file);
            setFormData(prev => {
              const g = [...(prev.gallery || [])];
              const idx = g.lastIndexOf(localUrl);
              if (idx !== -1) g[idx] = url;
              return { ...prev, gallery: g };
            });
          } catch {}
        }
    }
  };

  const removeGalleryImage = (index: number) => {
      setFormData(prev => ({
          ...prev,
          gallery: (prev.gallery || []).filter((_, i) => i !== index)
      }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
       <div className="bg-white/90 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white sticky top-0 z-10">
             <div>
               <h3 className="font-bold text-gray-900 text-lg">{initialData ? 'Edit Listing' : 'Add New Listing'}</h3>
               <p className="text-xs text-gray-500">Fill in the details to list your item.</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-8 bg-white/60">
            {saveError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {saveError}
              </div>
            )}
             
             {/* Section 1: Basic Info */}
             <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                   <Package size={16} className="mr-2 text-brand-600"/> 
                   Basic Information
                </h4>
                
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Title</label>
                      <input 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white font-medium transition-all"
                        placeholder="e.g. Cordless Drill"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Category</label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white cursor-pointer focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        >
                          {['Tools', 'Gardening', 'Kitchen', 'Outdoors', 'Music', 'Misc'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Listing Type</label>
                        <div className="flex bg-gray-200 p-1 rounded-xl">
                          <button 
                            onClick={() => setFormData({...formData, type: ListingType.GOODS})}
                            className={`flex-1 flex items-center justify-center text-xs font-bold py-2.5 rounded-lg transition-all ${formData.type === ListingType.GOODS ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Package size={14} className="mr-1.5" />
                            Item
                          </button>
                          <button 
                             onClick={() => setFormData({...formData, type: ListingType.SKILL})}
                             className={`flex-1 flex items-center justify-center text-xs font-bold py-2.5 rounded-lg transition-all ${formData.type === ListingType.SKILL ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Wand2 size={14} className="mr-1.5" />
                            Skill
                          </button>
                        </div>
                     </div>
                   </div>
                </div>
             </section>

             {/* Section 2: Photos */}
             <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                   <ImageIcon size={16} className="mr-2 text-brand-600"/> 
                   Photos
                </h4>

                <div className="space-y-4">
                   {/* Cover Image */}
                   <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Cover Image</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Preview / Upload Area */}
                        <div className="relative w-full sm:w-32 h-32 bg-white rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-brand-400 group flex-shrink-0 cursor-pointer shadow-sm transition-colors">
                           {formData.imageUrl ? (
                             <>
                               <img src={formData.imageUrl} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">Change</div>
                             </>
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Upload size={24} />
                                <span className="text-[10px] mt-1 font-medium">Upload</span>
                             </div>
                           )}
                           <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => handleFileUpload(e, 'cover')}
                           />
                        </div>

                        {/* URL Input Fallback */}
                        <div className="flex-1 w-full space-y-2">
                           <input 
                             value={formData.imageUrl}
                             onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                             className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                             placeholder="Or paste image URL..."
                           />
                           <p className="text-xs text-gray-500 leading-relaxed">
                             Upload a clear photo of your item. This will be the main image displayed in search results.
                           </p>
                        </div>
                      </div>
                   </div>

                   {/* Gallery */}
                   <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wide">Gallery ({(formData.gallery?.length || 0)})</label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                          {formData.gallery?.map((img, idx) => (
                             <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-white border border-gray-200 shadow-sm">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => removeGalleryImage(idx)}
                                  className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                                >
                                  <X size={10} />
                                </button>
                             </div>
                          ))}
                          <div className="relative aspect-square bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-brand-50 hover:text-brand-500 transition-colors">
                              <Plus size={20} />
                              <span className="text-[10px] font-bold mt-1">Add</span>
                              <input 
                                 type="file" 
                                 accept="image/*"
                                 multiple
                                 className="absolute inset-0 opacity-0 cursor-pointer"
                                 onChange={(e) => handleFileUpload(e, 'gallery')}
                              />
                          </div>
                      </div>
                   </div>
                </div>
             </section>

             {/* Section 3: Details */}
             <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                   <Settings size={16} className="mr-2 text-brand-600"/> 
                   Details & Settings
                </h4>

                <div>
                    <div className="flex justify-between items-end mb-2">
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Description</label>
                       <button 
                         onClick={handleGenerate}
                         disabled={isGenerating || !formData.title}
                         className="text-[10px] flex items-center gap-1 text-brand-600 font-bold bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                       >
                         <Wand2 size={12} />
                         {isGenerating ? 'Generating...' : 'Auto-Generate'}
                       </button>
                    </div>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none bg-white text-sm transition-all"
                      placeholder="Describe the condition, features, and pickup instructions..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Hourly Rate ({currency})</label>
                      <div className="relative">
                         <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                           type="number"
                           value={formData.hourlyRate}
                           onChange={e => {
                             const val = Number(e.target.value);
                             setFormData({...formData, hourlyRate: isNaN(val) ? 0 : val});
                           }}
                           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                           placeholder="0 for free"
                         />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Set to 0 to list as <span className="text-pink-600 font-bold">Free</span>.</p>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Approval Settings</label>
                        <div 
                          onClick={() => setFormData({...formData, autoApprove: !formData.autoApprove})}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.autoApprove ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${formData.autoApprove ? 'bg-amber-200 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                 <Zap size={16} fill={formData.autoApprove ? "currentColor" : "none"} />
                              </div>
                              <div>
                                <div className={`text-xs font-bold uppercase ${formData.autoApprove ? 'text-amber-800' : 'text-gray-700'}`}>Instant Book</div>
                                <div className="text-[10px] text-gray-500 leading-tight">Auto-approve requests</div>
                              </div>
                           </div>
                           <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${formData.autoApprove ? 'bg-amber-500' : 'bg-gray-300'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.autoApprove ? 'translate-x-5' : ''}`}></div>
                           </div>
                        </div>
                    </div>
                 </div>
             </section>
          </div>
          
          <div className="p-5 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0 z-10">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t('dash.cancel')}</button>
            <button 
              onClick={async () => {
                setSaveError(null);
                if (!formData.title || !formData.category || !formData.type) {
                  setSaveError('Please fill in the Title and Category.');
                  return;
                }
                if (!formData.imageUrl || formData.imageUrl.trim() === '') {
                  setSaveError('Please add a cover image.');
                  return;
                }
                setIsSaving(true);
                try {
                  await onSave(formData);
                } catch (err) {
                  console.error('Save listing failed', err);
                  setSaveError(err instanceof Error ? err.message : 'Failed to save listing');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className={`flex-1 py-3 ${isSaving ? 'bg-gray-400' : 'bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-700'} text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center`}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : 'Save Listing'}
            </button>
          </div>
       </div>
    </div>
  );
};

// --- Main Dashboard Component ---

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const { t, formatPrice } = useLanguage();

  // Check URL params for modal triggers
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'profile') {
      setIsProfileEditorOpen(true);
    } else if (action === 'security') {
      setIsSecurityModalOpen(true);
    }
  }, [searchParams]);

  const closeModals = () => {
    setIsProfileEditorOpen(false);
    setIsSecurityModalOpen(false);
    setSearchParams({}); // Clear query params
  };

  if (!user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">
             {user.role === UserRole.ADMIN ? t('dash.admin_overview') : t('dash.my_dashboard')}
           </h1>
           <p className="text-gray-500">
             {user.role === UserRole.ADMIN ? t('dash.admin_subtitle') : t('dash.member_subtitle')}
           </p>
        </div>
      </div>

      {/* Modals triggered by state (which is synced with URL) */}
      {(isProfileEditorOpen || isSecurityModalOpen) && (
        <ProfileEditModal 
          currentUser={user} 
          onClose={closeModals} 
          initialTab={isSecurityModalOpen ? 'security' : 'general'}
          onSave={async (data) => {
            try {
              const updated = await mockApi.updateUser(data);
              onUpdateUser(updated);
              closeModals();
            } catch (e) {
              alert('Failed to update profile');
            }
          }} 
        />
      )}

      {/* Role-Based Content */}
      {user.role === UserRole.ADMIN ? 
        <AdminDashboard user={user} onLogout={onLogout} /> : 
        <MemberDashboard user={user} onUpdateUser={onUpdateUser} />
      }
    </div>
  );
};

// --- Admin View ---
const AdminDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'LISTINGS' | 'REPORTS'>('OVERVIEW');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, formatPrice } = useLanguage();
  
  // Detail Modal States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [reportsToDismiss, setReportsToDismiss] = useState<string[]>([]);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);

  useEffect(() => {
     loadData();
  }, []);

  const loadData = async () => {
     setLoading(true);
     const [users, listings, reports] = await Promise.all([
        mockApi.getAllUsers(),
        mockApi.getListings(),
        mockApi.getReports()
     ]);
     setAllUsers(users);
     setAllListings(listings);
     setAllReports(reports);
     setLoading(false);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: UserStatus) => {
     try {
       const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE;
       await mockApi.updateUserStatus(userId, newStatus);
       setSelectedUser(null); // Close modal
       loadData();
     } catch (e: any) {
       alert('Failed to toggle user status: ' + (e.message || 'Unknown error'));
     }
  };

  const handleDeleteUser = async (userId: string) => {
     if(confirm('Are you sure you want to delete this user and all their data?')) {
        try {
          await mockApi.deleteAccount(userId);
          setSelectedUser(null);
          loadData();
        } catch (e: any) {
          alert('Failed to delete user: ' + (e.message || 'Unknown error'));
        }
     }
  };

  const handleToggleListingBlock = async (listingId: string) => {
     try {
       await mockApi.toggleListingBlock(listingId);
       setSelectedListing(null); // Close modal
       loadData();
     } catch (e: any) {
       alert('Failed to toggle block status: ' + (e.message || 'Unknown error'));
     }
  };

  const handleDeleteListing = (listingId: string) => {
      setDeleteListingId(listingId);
  };

  const confirmDeleteListing = async () => {
      if (deleteListingId) {
        try {
          await mockApi.deleteListing(deleteListingId);
          setDeleteListingId(null);
          setSelectedListing(null);
          loadData();
        } catch (e: any) {
          alert('Failed to delete listing: ' + (e.message || 'Unknown error'));
        }
      }
  };

  const handleApproveVerification = async (userId: string) => {
      try {
        await mockApi.approveVerification(userId);
        setSelectedUser(null);
        loadData();
      } catch (e: any) {
        alert('Failed to approve verification: ' + (e.message || 'Unknown error'));
      }
  };

  const handleRevokeVerification = async (userId: string) => {
      if(confirm('Are you sure you want to revoke verification for this user?')) {
          try {
            await mockApi.revokeVerification(userId);
            setSelectedUser(null);
            loadData();
          } catch (e: any) {
            alert('Failed to revoke verification: ' + (e.message || 'Unknown error'));
          }
      }
  };

  const handleDismissReports = (reportIds: string[]) => {
      setReportsToDismiss(reportIds);
  };

  const confirmDismissReports = async () => {
      if (reportsToDismiss.length > 0) {
          try {
            await Promise.all(reportsToDismiss.map(id => mockApi.dismissReport(id)));
            setReportsToDismiss([]);
            if (selectedReports.length > 0) {
               setSelectedListing(null);
               setSelectedReports([]);
            }
            loadData();
          } catch (e: any) {
            alert('Failed to dismiss reports: ' + (e.message || 'Unknown error'));
          }
      }
  };

  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredListings = allListings.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.owner?.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredReports = allReports.filter(r => r.listing?.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.reporter?.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedReports = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    filteredReports.forEach(r => {
      const lid = r.listing?.id || 'unknown';
      if(!groups[lid]) groups[lid] = [];
      groups[lid].push(r);
    });
    return Object.values(groups);
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      
      {/* Admin Tabs */}
      <div className="flex border-b border-gray-200 space-x-6">
         <button 
           onClick={() => setActiveTab('OVERVIEW')} 
           className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'OVERVIEW' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
         >
           Overview
         </button>
         <button 
           onClick={() => setActiveTab('USERS')} 
           className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'USERS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
         >
           User Management
         </button>
         <button 
           onClick={() => setActiveTab('LISTINGS')} 
           className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'LISTINGS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
         >
           Listing Management
         </button>
         <button 
           onClick={() => setActiveTab('REPORTS')} 
           className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'REPORTS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
         >
           Reports
         </button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <StatCard icon={<Users className="text-blue-500" />} label="Total Users" value={allUsers.length.toString()} subtext="Platform Wide" />
               <StatCard icon={<Package className="text-emerald-500" />} label="Total Listings" value={allListings.length.toString()} subtext="Active & Hidden" />
               <StatCard icon={<ShieldAlert className="text-amber-500" />} label="Blocked Users" value={allUsers.filter(u => u.status === UserStatus.BLOCKED).length.toString()} subtext="Action Required" />
               <StatCard icon={<Flag className="text-red-500" />} label="Active Reports" value={allReports.length.toString()} subtext="Needs Review" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Platform Health</h3>
                  <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 mb-2">
                     <CheckCircle2 size={16} />
                     All systems operational
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Server Latency: 45ms</div>
               </div>
            </div>
        </>
      )}

      {/* ... (Tab contents omitted for brevity, keeping logical flow) ... */}
      {activeTab === 'USERS' && (
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                     placeholder="Search users by name or ID..."
                  />
               </div>
               <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"><RefreshCcw size={16}/></button>
            </div>
            {/* Table implementation same as previous, just wrapping text */}
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                     <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Trust Score</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredUsers.map(u => (
                        <tr 
                           key={u.id} 
                           className="hover:bg-gray-50 cursor-pointer"
                           onClick={() => setSelectedUser(u)}
                        >
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <div className="relative">
                                     <img src={u.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200" />
                                     {u.verificationStatus === VerificationStatus.PENDING && (
                                         <div className="absolute -top-1 -right-1 bg-blue-500 border border-white rounded-full p-0.5">
                                            <FileCheck size={10} className="text-white" />
                                         </div>
                                     )}
                                 </div>
                                 <div>
                                    <div className="font-bold text-gray-900 flex items-center">
                                        {u.name}
                                        {u.verificationStatus === VerificationStatus.VERIFIED && <BadgeCheck size={14} className="text-blue-500 ml-1" />}
                                    </div>
                                    <div className="text-xs text-gray-400">{u.id}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-3">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">{u.role}</span>
                           </td>
                           <td className="px-6 py-3">
                              {u.status === UserStatus.ACTIVE ? 
                                 <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold flex w-fit items-center"><CheckCircle2 size={12} className="mr-1"/> Active</span> :
                                 <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold flex w-fit items-center"><Ban size={12} className="mr-1"/> Blocked</span>
                              }
                           </td>
                           <td className="px-6 py-3 font-medium">{u.trustScore}%</td>
                           <td className="px-6 py-3 text-right">
                              {u.role !== UserRole.ADMIN && (
                                 <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => handleToggleUserStatus(u.id, u.status)}
                                      className={`p-1.5 rounded border transition-colors ${u.status === UserStatus.ACTIVE ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                      title={u.status === UserStatus.ACTIVE ? "Block User" : "Unblock User"}
                                    >
                                       {u.status === UserStatus.ACTIVE ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                      title="Delete User"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'LISTINGS' && (
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                     placeholder="Search listings..."
                  />
               </div>
               <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"><RefreshCcw size={16}/></button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                     <tr>
                        <th className="px-6 py-3">Item</th>
                        <th className="px-6 py-3">Owner</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredListings.map(l => (
                        <tr 
                           key={l.id} 
                           className="hover:bg-gray-50 cursor-pointer"
                           onClick={() => setSelectedListing(l)}
                        >
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <img src={l.imageUrl} className="w-8 h-8 rounded bg-gray-200 object-cover" />
                                 <div className="font-bold text-gray-900 truncate max-w-[150px]" title={l.title}>{l.title}</div>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-gray-600">{l.owner?.name}</td>
                           <td className="px-6 py-3 text-gray-500">{l.category}</td>
                           <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 l.status === AvailabilityStatus.AVAILABLE ? 'bg-emerald-50 text-emerald-700' :
                                 l.status === AvailabilityStatus.BLOCKED ? 'bg-red-50 text-red-700' :
                                 'bg-gray-100 text-gray-600'
                              }`}>
                                 {l.status}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                 <button 
                                   onClick={() => handleToggleListingBlock(l.id)}
                                   className={`p-1.5 rounded border transition-colors ${l.status !== AvailabilityStatus.BLOCKED ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                   title={l.status !== AvailabilityStatus.BLOCKED ? "Block Listing" : "Unblock Listing"}
                                 >
                                    {l.status !== AvailabilityStatus.BLOCKED ? <EyeOff size={14} /> : <Eye size={14} />}
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteListing(l.id)}
                                    className="p-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                    title="Delete Listing"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'REPORTS' && (
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                     placeholder="Search reports..."
                  />
               </div>
               <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"><RefreshCcw size={16}/></button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                     <tr>
                        <th className="px-6 py-3">Reported Item</th>
                        <th className="px-6 py-3">Count</th>
                        <th className="px-6 py-3">Reasons</th>
                        <th className="px-6 py-3">Latest Date</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {groupedReports.map(group => {
                        const first = group[0];
                        const listing = allListings.find(l => l.id === first.listing?.id);
                        const listingInfo = listing || first.listing;
                        if (!listingInfo) return null;

                        return (
                           <tr 
                              key={listingInfo.id} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                 if(listing) {
                                    setSelectedListing(listing);
                                    setSelectedReports(group);
                                 }
                              }}
                           >
                              <td className="px-6 py-3">
                                 <div className="flex items-center gap-3">
                                    <img src={listingInfo.imageUrl} className="w-8 h-8 rounded bg-gray-200 object-cover" />
                                    <div className="font-bold text-gray-900 truncate max-w-[150px]" title={listingInfo.title}>{listingInfo.title}</div>
                                 </div>
                              </td>
                              <td className="px-6 py-3">
                                 <span className="font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg">{group.length}</span>
                              </td>
                              <td className="px-6 py-3 text-gray-600">
                                 <div className="text-xs space-y-1">
                                    {group.slice(0, 2).map((r, i) => (
                                       <div key={i} className="truncate max-w-[200px]">• {r.reason}</div>
                                    ))}
                                    {group.length > 2 && <div className="text-gray-400 italic">+{group.length - 2} more</div>}
                                 </div>
                              </td>
                              <td className="px-6 py-3 text-gray-500">{new Date(group[group.length-1].timestamp).toLocaleDateString()}</td>
                              <td className="px-6 py-3 text-right">
                                 <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                       type="button"
                                       onClick={() => handleToggleListingBlock(listingInfo.id)}
                                       className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition-colors"
                                    >
                                       Block
                                    </button>
                                    <button 
                                       type="button"
                                       onClick={() => handleDismissReports(group.map(r => r.id))}
                                       className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded transition-colors"
                                    >
                                       Dismiss
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {selectedUser && (
         <AdminUserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onToggleStatus={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
            onDelete={() => handleDeleteUser(selectedUser.id)}
            onApproveVerification={() => handleApproveVerification(selectedUser.id)}
            onRevokeVerification={() => handleRevokeVerification(selectedUser.id)}
         />
      )}

      {selectedListing && (
         <AdminListingDetailModal 
            listing={selectedListing} 
            reports={selectedReports}
            onClose={() => { setSelectedListing(null); setSelectedReports([]); }} 
            onToggleBlock={() => handleToggleListingBlock(selectedListing.id)}
            onDelete={() => handleDeleteListing(selectedListing.id)}
            onDismissAll={() => handleDismissReports(selectedReports.map(r => r.id))}
            onDismissReport={(id) => handleDismissReports([id])}
         />
      )}

      {reportsToDismiss.length > 0 && (
         <ConfirmationModal 
           title="Dismiss Reports" 
           message={`Are you sure you want to dismiss ${reportsToDismiss.length} report${reportsToDismiss.length > 1 ? 's' : ''}? This action cannot be undone.`}
           confirmText="Dismiss All"
           onConfirm={confirmDismissReports}
           onCancel={() => setReportsToDismiss([])}
           isDanger={true}
         />
      )}

      {deleteListingId && (
         <ConfirmationModal 
           title="Delete Listing" 
           message="Are you sure you want to delete this listing?"
           confirmText="Delete"
           onConfirm={confirmDeleteListing}
           onCancel={() => setDeleteListingId(null)}
           isDanger={true}
         />
      )}

    </div>
  );
};

// --- Unified Member View (Lender & Borrower) ---
const MemberDashboard = ({ user, onUpdateUser }: { user: User, onUpdateUser: (u: User) => void }) => {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBorrows, setMyBorrows] = useState<Listing[]>([]);
  const [history, setHistory] = useState<BorrowHistoryItem[]>([]);
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(false);
  const [isLoadingBorrows, setIsLoadingBorrows] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Listing | undefined>(undefined);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  const [reviewingItem, setReviewingItem] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navigate = useNavigate();
  const [_, setSearchParams] = useSearchParams();
  const { t, formatPrice } = useLanguage();

  const fetchListings = () => {
    setIsLoadingListings(true);
    setIsLoadingBorrows(true);
    setIsLoadingRecs(true);
    mockApi.getListings().then(all => {
      // Show all owned listings, including hidden ones
      setMyListings(all.filter(l => l.ownerId === user.id));
      setMyBorrows(all.filter(l => l.borrowerId === user.id));
      
      // Populate recommendations with available items not owned by current user
      const recs = all
        .filter(l => l.ownerId !== user.id && l.status === AvailabilityStatus.AVAILABLE)
        .slice(0, 4);
      setRecommendations(recs);
    }).finally(() => {
      setIsLoadingListings(false);
      setIsLoadingBorrows(false);
      setIsLoadingRecs(false);
    });
  };

  useEffect(() => {
    fetchListings();
    setIsLoadingHistory(true);
    mockApi.getBorrowingHistory().then(setHistory).finally(() => setIsLoadingHistory(false));
  }, [user.id]);

  const handleApprove = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await mockApi.approveRequest(listingId);
      fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await mockApi.denyRequest(listingId);
      fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsItemEditorOpen(true);
  };

  const handleEdit = (item: Listing) => {
    setEditingItem(item);
    setIsItemEditorOpen(true);
  };

  const handleSaveListing = async (listingData: Partial<Listing>) => {
    const newItem: Listing = {
      id: editingItem ? editingItem.id : `item_${Date.now()}`,
      ownerId: user.id,
      title: listingData.title || 'Untitled',
      description: listingData.description || '',
      type: ListingType.GOODS,
      category: listingData.category || 'Misc',
      // Prioritize uploaded image, then existing, then random placeholder
      imageUrl: listingData.imageUrl || editingItem?.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
      gallery: listingData.gallery || [],
      distanceMiles: 0, // Mock relative distance
      status: editingItem ? editingItem.status : AvailabilityStatus.AVAILABLE,
      location: editingItem?.location || { x: 0, y: 0 },
      ...listingData 
    } as Listing;

    await mockApi.updateListing(newItem);
    setIsItemEditorOpen(false);
    fetchListings();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await mockApi.deleteListing(deleteId);
      setDeleteId(null);
      fetchListings();
    }
  };

  const handleReturnClick = (item: Listing) => {
    setReviewingItem(item);
  };

  const processReturn = async (itemId: string) => {
     await mockApi.returnItem(itemId);
     fetchListings();
     setReviewingItem(null);
  };

  const handleToggleStatus = async (item: Listing) => {
    const newStatus = item.status === AvailabilityStatus.HIDDEN 
      ? AvailabilityStatus.AVAILABLE 
      : AvailabilityStatus.HIDDEN;
    
    // We can't disable borrowed items logically
    if (item.status === AvailabilityStatus.BORROWED) {
      alert("Cannot disable an item that is currently borrowed.");
      return;
    }

    await mockApi.updateListing({ ...item, status: newStatus });
    fetchListings();
  };

  const handleVerificationRequest = async (data: { address: string, phone: string }) => {
      try {
          const updatedUser = await mockApi.requestVerification(data);
          onUpdateUser(updatedUser);
          setIsVerificationModalOpen(false);
      } catch (e) {
          alert("Failed to submit verification request");
      }
  };

  // Filter for incoming requests
  const pendingRequests = myListings.filter(l => l.status === AvailabilityStatus.PENDING);

  return (
    <div className="space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center relative">
        <div className="absolute top-6 right-6 flex items-center space-x-2">
           {/* Quick Actions for Editing Profile can also be triggered here */}
           <button 
             onClick={() => setSearchParams({ action: 'profile' })}
             className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
             title={t('dash.edit_profile')}
           >
             <Edit2 size={20} />
           </button>
        </div>

        <div className="relative">
           <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/120/120`} onError={(e)=>{ (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${user.id}/120/120`; }} alt={user.name} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" />
           <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-1.5 rounded-full border-2 border-white">
             <Shield size={16} fill="currentColor" />
           </div>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {user.name}
              {user.verificationStatus === VerificationStatus.VERIFIED && (
                  <BadgeCheck className="ml-2 text-blue-500" size={24} aria-label="Verified User" />
              )}
            </h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wide">
              {user.role}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <MapPin size={16} className="mr-1.5 text-gray-400" />
              <span>North Hills, CA</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1.5 text-gray-400" />
              <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats & Verification */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto mt-4 md:mt-0 mr-0 md:mr-16 justify-start">
           <div className="flex-1 md:flex-none bg-indigo-50 p-4 rounded-xl text-center min-w-[100px]">
              <div className="text-2xl font-bold text-indigo-700">{user.trustScore}</div>
              <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide">{t('dash.trust_score')}</div>
           </div>
           <div className="flex-1 md:flex-none bg-emerald-50 p-4 rounded-xl text-center min-w-[100px]">
              <div className="text-2xl font-bold text-emerald-700">{user.vouchCount}</div>
              <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">{t('dash.vouches')}</div>
           </div>
           
           {/* Verification Status/Button */}
           <div className="flex-1 md:flex-none flex items-center justify-center min-w-[120px]">
               {user.verificationStatus === VerificationStatus.UNVERIFIED && (
                   <button 
                     onClick={() => setIsVerificationModalOpen(true)}
                     className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                   >
                       {t('dash.verify_identity')}
                   </button>
               )}
               {user.verificationStatus === VerificationStatus.PENDING && (
                   <div className="flex flex-col items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                       <Loader2 size={16} className="animate-spin mb-1" />
                       <span className="text-xs font-bold">{t('dash.verifying')}</span>
                   </div>
               )}
               {user.verificationStatus === VerificationStatus.VERIFIED && (
                   <div className="flex flex-col items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-100">
                       <BadgeCheck size={24} className="mb-1" />
                       <span className="text-xs font-bold">{t('dash.verified')}</span>
                   </div>
               )}
           </div>
        </div>
      </div>

      {isVerificationModalOpen && (
          <VerificationRequestModal 
              currentUser={user} 
              onClose={() => setIsVerificationModalOpen(false)}
              onSave={handleVerificationRequest}
          />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Listings & Requests */}
        <div className="space-y-6">

          {/* Incoming Requests Section - Only if pending requests exist */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4 animate-fade-in">
               <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <BellRing className="mr-2 text-brand-600" size={20} />
                  {t('dash.incoming_requests')}
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
               </h3>
               {/* ... requests list (UI kept same) ... */}
               <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden divide-y divide-gray-100 ring-4 ring-blue-50/50">
                  {pendingRequests.map(req => (
                     <div key={req.id} className="p-4 flex gap-4 bg-blue-50/30">
                        <img src={req.borrower?.avatarUrl || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-gray-900 font-bold"><span className="text-brand-700">{req.borrower?.name}</span> wants to borrow:</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium bg-white border border-gray-200 rounded px-2 py-1 inline-block">{req.title}</p>
                              </div>
                              <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-1 rounded-full border border-brand-100 uppercase tracking-wide">
                                 {req.borrower?.trustScore}% Trust
                              </span>
                           </div>
                           <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading === req.id}
                                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                              >
                                {actionLoading === req.id ? <Loader2 className="animate-spin mr-1" size={14} /> : <Check size={14} className="mr-1" />}
                                Approve
                              </button>
                              
                              <button 
                                onClick={() => navigate(`/messages?userId=${req.borrower?.id ?? ''}`)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-colors"
                                title="Message Borrower"
                              >
                                <MessageSquare size={16} />
                              </button>

                              <button 
                                onClick={() => handleDeny(req.id)}
                                disabled={actionLoading === req.id}
                                className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold py-2 rounded-lg flex items-center justify-center transition-colors"
                              >
                                {actionLoading === req.id ? <Loader2 className="animate-spin mr-1" size={14} /> : <XIcon size={14} className="mr-1" />}
                                Deny
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Package className="mr-2 text-brand-600" size={20} />
                {t('dash.my_listings')}
              </h3>
              <button 
                onClick={handleAddNew}
                className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center bg-brand-50 px-3 py-1.5 rounded-lg"
              >
                <Plus size={16} className="mr-1" /> {t('dash.add_new')}
              </button>
            </div>

            {isItemEditorOpen && (
              <ItemForm 
                initialData={editingItem} 
                onClose={() => setIsItemEditorOpen(false)} 
                onSave={handleSaveListing}
              />
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {isLoadingListings ? (
                <div className="p-8 text-center text-gray-400">
                  <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading your listings…</p>
                </div>
              ) : myListings.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {myListings.map(item => {
                    // ... listing logic (omitted for brevity) ...
                    const isHidden = item.status === AvailabilityStatus.HIDDEN;
                    const isBorrowed = item.status === AvailabilityStatus.BORROWED;
                    const isPending = item.status === AvailabilityStatus.PENDING;
                    const isAvailable = item.status === AvailabilityStatus.AVAILABLE;
                    const isAutoApprove = item.autoApprove;
                    const isBlocked = item.status === AvailabilityStatus.BLOCKED;

                    let badgeStyle = 'bg-gray-100 text-gray-600';
                    let StatusIcon = EyeOff;
                    
                    if (isAvailable) {
                      badgeStyle = 'bg-emerald-100 text-emerald-700';
                      StatusIcon = CheckCircle2;
                    } else if (isBorrowed) {
                      badgeStyle = 'bg-amber-100 text-amber-700';
                      StatusIcon = Clock;
                    } else if (isPending) {
                      badgeStyle = 'bg-indigo-100 text-indigo-700 animate-pulse';
                      StatusIcon = BellRing;
                    } else if (isHidden) {
                      badgeStyle = 'bg-slate-100 text-slate-500';
                      StatusIcon = EyeOff;
                    } else if (isBlocked) {
                      badgeStyle = 'bg-red-100 text-red-700';
                      StatusIcon = Ban;
                    }

                    return (
                      <div key={item.id} className={`p-4 flex gap-4 transition-colors ${isHidden ? 'bg-gray-50/80' : 'hover:bg-gray-50'}`}>
                          <div className="relative group">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className={`w-16 h-16 rounded-lg object-cover bg-gray-100 ${isHidden || isBlocked ? 'grayscale opacity-60' : ''}`} 
                            />
                            {isHidden && (
                              <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                <EyeOff size={24} className="text-white drop-shadow-md" />
                              </div>
                            )}
                            {isBlocked && (
                               <div className="absolute inset-0 bg-red-900/20 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                  <Ban size={24} className="text-white drop-shadow-md" />
                               </div>
                            )}
                            {isAutoApprove && (
                               <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white" title="Instant Book Enabled">
                                  <Zap size={10} fill="currentColor" />
                               </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-bold truncate ${isHidden || isBlocked ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</h4>
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-transparent ${badgeStyle}`}>
                                <StatusIcon size={12} strokeWidth={2.5} />
                                {item.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              <p className="text-xs text-gray-500 truncate">{item.category}</p>
                              <span className="text-gray-300">•</span>
                              {item.hourlyRate ? (
                                <p className="text-xs font-semibold text-brand-600">{formatPrice(item.hourlyRate)}/hr</p>
                              ) : (
                                <p className="text-xs font-bold text-pink-600 flex items-center gap-1"><Gift size={12}/> Free</p>
                              )}
                            </div>
                            
                            {/* Item Actions */}
                            <div className={`flex items-center gap-2 mt-2 ${isHidden ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                              {isBlocked ? (
                                 <p className="text-xs text-red-500 font-bold flex items-center"><AlertTriangle size={12} className="mr-1"/> Flagged by Admin</p>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEdit(item)}
                                    className="text-xs text-brand-600 font-medium hover:text-brand-800 flex items-center px-2 py-1 hover:bg-brand-50 rounded transition-colors"
                                    title="Edit Listing"
                                  >
                                    <Edit2 size={12} className="mr-1" /> Edit
                                  </button>
                                  
                                <button 
                                    onClick={() => handleToggleStatus(item)}
                                    disabled={isBorrowed || isPending}
                                    className={`text-xs font-medium flex items-center px-2 py-1 rounded transition-colors ${isBorrowed || isPending ? 'text-gray-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                                    title={isHidden ? "Enable Listing" : "Disable Listing"}
                                  >
                                    {isHidden ? <Eye size={12} className="mr-1" /> : <EyeOff size={12} className="mr-1" />}
                                    {isHidden ? "Enable" : "Disable"}
                                  </button>

                                  {isPending && !isAutoApprove && (
                                    <>
                                      <button 
                                        onClick={() => handleApprove(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="text-xs bg-indigo-600 text-white font-semibold px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                                        title="Approve Request"
                                      >
                                        {actionLoading === item.id ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => handleDeny(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="text-xs bg-white text-red-600 border border-red-200 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                        title="Deny Request"
                                      >
                                        Deny
                                      </button>
                                    </>
                                  )}
    
                                  <button 
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center ml-auto px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Listing"
                                  >
                                    <Trash2 size={12} className="mr-1" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{t('dash.no_listings')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Borrowing & History */}
        <div className="space-y-8">
          {/* Active Borrows */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
               <Clock className="mr-2 text-brand-600" size={20} />
               {t('dash.active_borrows')}
            </h3>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {isLoadingBorrows ? (
                <div className="p-8 text-center text-gray-400">
                  <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading active borrows…</p>
                </div>
              ) : myBorrows.length > 0 ? (
                 <div className="divide-y divide-gray-100">
                   {myBorrows.map(item => {
                     const isPending = item.status === AvailabilityStatus.PENDING;
                     return (
                      <div 
                        key={item.id} 
                        onClick={() => navigate(`/listing/${item.id}`)}
                        className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                          <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100 group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">{item.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">Owner: {item.owner?.name}</p>
                            {isPending ? (
                              <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded">
                                <BellRing size={12} className="mr-1" /> Request Pending
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded">
                                <Clock size={12} className="mr-1" /> Due in 2 days
                              </div>
                            )}
                          </div>
                          {!isPending && (
                            <div className="flex flex-col justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReturnClick(item);
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
                              >
                                Return
                              </button>
                            </div>
                          )}
                      </div>
                   )})}
                 </div>
              ) : (
                 <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center">
                   <Search size={32} className="mx-auto mb-2 opacity-20" />
                   <p className="text-sm mb-2">{t('dash.no_active_borrows')}</p>
                   <button onClick={() => navigate('/')} className="text-brand-600 text-sm font-medium hover:underline">{t('dash.browse_listings')}</button>
                 </div>
              )}
            </div>
          </div>

          {/* Borrowing History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
               <History className="mr-2 text-brand-600" size={20} />
               {t('dash.borrowing_history')}
            </h3>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               {isLoadingHistory ? (
                 <div className="p-6 text-center text-gray-400">
                   <Loader2 size={28} className="mx-auto mb-2 animate-spin" />
                   <p className="text-sm">Loading history…</p>
                 </div>
               ) : history.length > 0 ? (
                 <div className="divide-y divide-gray-100">
                   {history.map(item => (
                     <div key={item.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                        <img src={item.listing.imageUrl} alt={item.listing.title} className="w-12 h-12 rounded-lg object-cover bg-gray-100 grayscale opacity-80" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                              <h4 className="font-bold text-gray-900 truncate text-sm">{item.listing.title}</h4>
                              <span className="text-xs text-gray-400 font-medium border border-gray-200 rounded px-1.5 bg-gray-50">Returned</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Owner: {item.listing.owner?.name}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                             <Calendar size={10} className="mr-0.5"/>
                             <span>{new Date(item.borrowedDate).toLocaleDateString()} — {new Date(item.returnedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-6 text-center text-gray-400">
                   <p className="text-sm">No history available.</p>
                 </div>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Recommendations / History */}
      <div className="pt-4 border-t border-gray-200">
         <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dash.recommendations')}</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingRecs ? (
              <div className="col-span-full text-center text-gray-400 py-6">
                <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading recommendations…</p>
              </div>
            ) : recommendations.length > 0 ? recommendations.map(rec => (
              <RecommendationCard 
                key={rec.id}
                title={rec.title} 
                distance={`${rec.distanceMiles} mi`} 
                icon={rec.type === ListingType.SKILL ? '🎓' : '🔧'}
                onClick={() => navigate(`/listing/${rec.id}`)}
              />
            )) : (
              <div className="col-span-full text-center text-gray-400 py-4 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No recommendations available nearby at the moment.
              </div>
            )}
         </div>
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <ReviewModal 
          item={reviewingItem} 
          currentUser={user}
          onClose={() => setReviewingItem(null)}
          onComplete={(reviewData) => {
             if (reviewData) {
                // Submit review logic
                mockApi.submitReview({
                   authorId: user.id,
                   targetUserId: reviewingItem.ownerId,
                   listingId: reviewingItem.id,
                   rating: reviewData.rating,
                   comment: reviewData.comment
                });
             }
             processReturn(reviewingItem.id);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl m-4 transform transition-all scale-100">
             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4 mx-auto">
                <Trash2 size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Listing?</h3>
             <p className="text-center text-gray-500 text-sm mb-6">
               Are you sure you want to remove <span className="font-semibold text-gray-900">"{myListings.find(l => l.id === deleteId)?.title}"</span>? This action cannot be undone.
             </p>
             <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold text-sm shadow-sm transition-colors"
                >
                  Delete
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};