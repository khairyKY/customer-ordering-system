import React, { useState } from 'react';
import { usePaymentStore } from './usePaymentStore';
import NeonButton from '../../components/ui/NeonButton';
import TerminalInput from '../../components/ui/TerminalInput';

const PaymentForm = ({ subtotal }) => {
  const [promo, setPromo] = useState('');
  const { submitPayment, isLoading, error, isSuccess } = usePaymentStore();

  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPayment({
      amount: subtotal,
      promoCode: promo,
      cartTotal: subtotal
    });
  };

  if (isSuccess) return (
    <div className="font-mono text-[#2ecc64] text-[18px] border border-[#2ecc64] p-4 bg-[#0D0D0D] text-center">
      ✓ PAYMENT_SUCCESS — Transaction confirmed.
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="border border-[#3d4850] bg-[#1c1b1b] p-6 flex flex-col gap-6">
      <h2 className="font-mono text-[24px] font-semibold text-[#e5e2e1] uppercase border-b border-[#3d4850] pb-2 inline-block">
        Payment Details
      </h2>

      {/* Method Selector */}
      <div className="flex gap-4">
        <div className="flex-1 border-2 border-[#00bfff] bg-[#353534] p-4 flex items-center gap-2 cursor-default">
          <span className="material-symbols-outlined text-[#00bfff]" style={{fontVariationSettings: "'FILL' 1"}}>credit_card</span>
          <span className="font-mono text-[12px] uppercase text-[#00bfff]">Credit / Debit</span>
        </div>
        <div className="flex-1 border border-[#3d4850] bg-[#131313] p-4 flex items-center gap-2 opacity-50 cursor-not-allowed">
          <span className="material-symbols-outlined text-[#87929b]">account_balance_wallet</span>
          <span className="font-mono text-[12px] uppercase text-[#87929b]">Digital Wallet</span>
        </div>
      </div>

      {/* Promo Code */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[13px] text-[#e5e2e1]">Promo Code</label>
        <TerminalInput
          type="text"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="ENTER_PROMO_CODE"
          ariaLabel="Promo code"
        />
      </div>

      {/* Totals Breakdown */}
      <div className="flex flex-col gap-2 font-mono text-[13px]">
        <div className="flex items-end text-[#87929b]">
          <span>SUBTOTAL</span>
          <span className="flex-1 border-b border-dashed border-[#3d4850] mx-2 mb-1" />
          <span className="text-[#e5e2e1]">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-end text-[#87929b]">
          <span>TAX (10%)</span>
          <span className="flex-1 border-b border-dashed border-[#3d4850] mx-2 mb-1" />
          <span className="text-[#e5e2e1]">${tax.toFixed(2)}</span>
        </div>
        <div className="flex items-end text-[#e5e2e1] mt-4 pt-4 border-t border-[#3d4850] text-[18px] font-bold">
          <span>TOTAL_COST</span>
          <span className="flex-1 border-b-2 border-dotted border-[#3d4850] mx-2 mb-1" />
          <span className="text-[#00bfff]">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit */}
      <NeonButton
        variant="primary"
        fullWidth
        disabled={isLoading}
        type="submit"
        className="h-[64px] text-[18px] font-semibold tracking-widest"
      >
        <span className="material-symbols-outlined mr-2">terminal</span>
        {isLoading ? '[ PROCESSING... ]' : '[ CONFIRM & PAY ]'}
      </NeonButton>

      <div className="text-center font-mono text-[11px] text-[#87929b]">
        By confirming, you agree to the <a className="text-[#8fd6ff] hover:underline" href="#">Terms of Service</a>. Connection is encrypted.
      </div>

      {error && <p className="font-mono text-[13px] text-[#ffb4ab] border border-[#ffb4ab]/30 bg-[#93000a]/20 px-3 py-2">{error}</p>}
    </form>
  );
};

export default PaymentForm;
