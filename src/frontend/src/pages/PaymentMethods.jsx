import React, { useState, useEffect } from 'react';
import NeonButton from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';
import { client } from '../api/client';

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ brand: 'VISA', card_number: '', exp: '', cvv: '' });

  // All three handlers below went through raw axios with a hardcoded
  // http://localhost:8000 URL and a manual Bearer header. Routing through
  // the shared `client` picks up VITE_PYTHON_API_BASE, the JWT
  // interceptor, and the 401-clear-token interceptor for free.

  const loadMethods = async () => {
    try {
      const res = await client.get('/payment/methods');
      setMethods(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadMethods(); }, []);

  const handleSave = async () => {
    if (!formData.card_number || !formData.exp || !formData.cvv) return;
    try {
      const [mm, yy] = formData.exp.split('/');
      await client.post('/payment/methods', {
        brand: formData.brand,
        card_number: formData.card_number,
        exp_month: parseInt(mm, 10) || 1,
        exp_year: parseInt(yy, 10) || 28,
        cvv: formData.cvv,
      });
      setShowModal(false);
      setFormData({ brand: 'VISA', card_number: '', exp: '', cvv: '' });
      loadMethods();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await client.put(`/payment/methods/${id}/default`, {});
      loadMethods();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = (id) => {
    // Optional: implement actual remove endpoint if needed, skipping for now
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-6" data-testid="account-payment">
      <h1 className="font-mono text-[28px] font-bold text-on-background mb-1">// PAYMENT_METHODS</h1>
      <p className="font-mono text-[13px] text-text-muted mb-6">Stored payment tokens and billing preferences.</p>
      
      <div className="flex flex-col gap-4">
        {methods.map(method => (
          <div key={method.id} className="border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl p-4 flex justify-between items-center shadow-md transition-all hover:border-primary-container/50">
            <div className="flex items-center gap-6">
              <div className="w-16 h-10 bg-background border border-outline-variant flex items-center justify-center font-bold text-on-background text-[12px] tracking-widest shadow-inner">
                {method.brand}
              </div>
              <div>
                <div className="font-mono text-[16px] text-on-background tracking-wider">•••• •••• •••• {method.last4}</div>
                <div className="font-mono text-[12px] text-text-muted uppercase">Expires {method.exp_month}/{method.exp_year}</div>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              {method.is_default ? (
                <span className="font-mono text-[10px] bg-primary-container text-background px-3 py-1 uppercase tracking-widest font-bold">Default</span>
              ) : (
                <NeonButton variant="secondary" onClick={() => handleSetDefault(method.id)} className="!text-[10px] !py-1 !px-2">[ SET AS DEFAULT ]</NeonButton>
              )}
              <span onClick={() => handleRemove(method.id)} className="font-mono text-[13px] text-error cursor-pointer hover:underline transition-all">[ REMOVE ]</span>
            </div>
          </div>
        ))}

        <div 
          onClick={() => setShowModal(true)}
          className="border border-outline-variant border-dashed bg-transparent p-6 flex items-center justify-center gap-4 cursor-pointer hover:border-primary-container transition-all group mt-4"
        >
          <span className="font-mono text-[24px] text-text-muted group-hover:text-primary-container">+</span>
          <span className="font-mono text-[13px] text-text-muted uppercase group-hover:text-primary-container tracking-widest">Add Payment Method</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark border border-outline-variant p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-mono text-[18px] text-on-background mb-4 uppercase">
              // ADD_PAYMENT_METHOD
            </h3>
            <div className="flex flex-col gap-3">
              <select 
                className="w-full bg-background border border-outline-variant p-3 font-mono text-[13px] text-on-background focus:border-primary-container outline-none"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
              >
                <option value="VISA">VISA</option>
                <option value="MC">MASTERCARD</option>
                <option value="AMEX">AMEX</option>
              </select>
              <TerminalInput 
                placeholder="CARD NUMBER (16 DIGITS)" 
                value={formData.card_number} 
                onChange={e => setFormData({...formData, card_number: e.target.value.replace(/\D/g, '').slice(0, 16)})} 
              />
              <div className="flex gap-3">
                <TerminalInput 
                  placeholder="MM/YY" 
                  value={formData.exp} 
                  onChange={e => setFormData({...formData, exp: e.target.value})} 
                />
                <TerminalInput 
                  placeholder="CVV" 
                  value={formData.cvv} 
                  onChange={e => setFormData({...formData, cvv: e.target.value.slice(0, 4)})} 
                  type="password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <NeonButton variant="secondary" onClick={() => setShowModal(false)}>[ CANCEL ]</NeonButton>
              <NeonButton variant="primary" onClick={handleSave}>[ SAVE TOKEN ]</NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
