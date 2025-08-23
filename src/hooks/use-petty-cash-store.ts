
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PettyCashState {
  fundAmount: number;
  setFundAmount: (amount: number) => void;
}

export const usePettyCashStore = create<PettyCashState>()(
  persist(
    (set) => ({
      fundAmount: 50000, // Default initial amount, can be changed by admin
      setFundAmount: (amount) => set({ fundAmount: amount }),
    }),
    {
      name: 'petty-cash-storage', // unique name for localStorage
    }
  )
);
