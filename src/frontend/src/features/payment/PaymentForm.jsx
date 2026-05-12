import React, { useState } from 'react';
import { usePaymentStore } from './usePaymentStore';

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

  if (isSuccess) return <div className="text-green-600 font-bold">Payment Successful!</div>;

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">Payment Details</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium">Promo Code</label>
        <input 
          type="text" 
          value={promo} 
          onChange={(e) => setPromo(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="ENTER CODE"
        />
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (10%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className={`w-full mt-6 py-3 rounded-lg text-white font-bold transition ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </form>
  );
};

export default PaymentForm;
