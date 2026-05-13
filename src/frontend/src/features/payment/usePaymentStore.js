import { create } from 'zustand';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const usePaymentStore = create((set, get) => ({
  isLoading: false,
  error: null,
  isSuccess: false,
  idempotencyKey: uuidv4(), // Generated on mount

  submitPayment: async (paymentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post('/api/payment/process', {
        ...paymentData,
        idempotencyKey: get().idempotencyKey
      });

      set({ isSuccess: true, isLoading: false, idempotencyKey: uuidv4() }); // Reset key on success
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Payment failed', isLoading: false });
    }
  }
}));
