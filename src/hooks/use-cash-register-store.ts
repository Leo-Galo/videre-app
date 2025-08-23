
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CashBoxStatus = 'open' | 'closed';

interface CashBoxState {
  cashBoxStatus: CashBoxStatus;
  lastOpeningDate: string | null;
  openCashBox: () => void;
  closeCashBox: () => void;
}

// Create a persistent store to simulate backend state across sessions/refreshes
export const useCashBoxStore = create<CashBoxState>()(
  persist(
    (set) => ({
      cashBoxStatus: 'closed',
      lastOpeningDate: null,
      openCashBox: () => set({ cashBoxStatus: 'open', lastOpeningDate: new Date().toISOString() }),
      closeCashBox: () => set({ cashBoxStatus: 'closed' }),
    }),
    {
      name: 'cash-box-storage', // unique name for localStorage
    }
  )
);
