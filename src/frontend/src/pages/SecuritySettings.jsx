import React, { useState } from 'react';
import NeonButton from '../components/ui/NeonButton';
import { client } from '../api/client';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState(null);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToast({ type: 'error', message: 'ERROR: FIELDS_CANNOT_BE_EMPTY' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      // Shared client routes against VITE_PYTHON_API_BASE and attaches the
      // JWT from localStorage via interceptor — no hardcoded host, no
      // manual Authorization header to drift out of sync.
      await client.put('/auth/password/update', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setToast({ type: 'success', message: 'SUCCESS: CREDENTIALS_UPDATED' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail?.error || err.response?.data?.error || 'UPDATE_FAILED';
      setToast({ type: 'error', message: `ERROR: ${msg}` });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-6" data-testid="account-security">
      <h1 className="font-mono text-[28px] font-bold text-on-background mb-1">// SECURITY</h1>
      <p className="font-mono text-[13px] text-text-muted mb-6">Password changes and active sessions.</p>
      
      {toast && (
        <div className={`font-mono text-[13px] p-3 border ${toast.type === 'success' ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'bg-error-container/20 border-error/30 text-error'}`}>
          {toast.message}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl p-6 flex flex-col gap-6 shadow-md">
        <h2 className="font-inter text-label-md text-primary-container uppercase border-b border-outline-variant pb-3 tracking-widest">Change Password</h2>
        <div className="flex gap-4 flex-col md:flex-row mt-2 items-center">
          <input 
            type="password" 
            placeholder="CURRENT PASSWORD" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-background border border-outline-variant p-3 font-mono text-[13px] flex-1 text-on-background focus:border-primary-container outline-none transition-colors w-full" 
          />
          <input 
            type="password" 
            placeholder="NEW PASSWORD" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-background border border-outline-variant p-3 font-mono text-[13px] flex-1 text-on-background focus:border-primary-container outline-none transition-colors w-full" 
          />
          <NeonButton type="submit" variant="primary" className="h-[46px] w-full md:w-auto px-8">[ UPDATE ]</NeonButton>
        </div>
      </form>

      <div className="border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl p-6 flex flex-col gap-4 mt-2 shadow-md">
        <h2 className="font-inter text-label-md text-primary-container uppercase border-b border-outline-variant pb-3 tracking-widest">Active Sessions</h2>
        <div className="flex justify-between items-center py-4 border-b border-outline-variant/50">
          <div className="font-mono text-[14px] text-on-background flex items-center gap-3">
            <span className="text-[#22C55E] text-xs">●</span> 
            <span>Current Session (Windows PC)</span>
          </div>
          <div className="font-mono text-[12px] text-text-muted tracking-widest">IP: 192.168.1.5</div>
        </div>
        <div className="flex justify-end mt-4">
          <NeonButton variant="secondary" className="!text-error !border-error hover:!bg-error hover:!text-background !text-[12px]">
            [ TERMINATE ALL OTHER SESSIONS ]
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
