import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { toast } from 'react-toastify';

export default function PhoneVerifyModal({ open, onClose, onVerified }: { open: boolean; onClose: ()=>void; onVerified?: ()=>void }) {
  const [step, setStep] = useState<'enter'|'code'>('enter');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const sendOtp = async () => {
    setLoading(true);
    try {
      await authService.sendPhoneOtp(phone);
      toast.success('OTP sent to ' + phone);
      setStep('code');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await authService.verifyPhoneOtp(phone, code);
      toast.success('Phone verified!');
      if (onVerified) onVerified();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 z-50 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Verify your phone</h3>

        {step === 'enter' ? (
          <>
            <label className="block text-sm">Phone number (E.164, e.g. +919999999999)</label>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-2 w-full p-2 border rounded" placeholder="+919999999999" />
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 mr-2" onClick={onClose}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={sendOtp} disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm">Enter OTP</label>
            <input value={code} onChange={(e)=>setCode(e.target.value)} className="mt-2 w-full p-2 border rounded" placeholder="123456" />
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 mr-2" onClick={()=>setStep('enter')}>Back</button>
              <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={verifyOtp} disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
