// src/services/superadmin/backup-service.ts
'use server';

import type { BackupRecord } from '@/types/superadmin';
import { subDays, format } from 'date-fns';

const initialMockHistory: BackupRecord[] = [];

export async function getBackupHistory(): Promise<BackupRecord[]> {
  return new Promise(resolve => setTimeout(() => resolve(initialMockHistory), 200));
}

export async function createManualBackup(): Promise<BackupRecord> {
  const newBackup: BackupRecord = {
      id: `bkp-manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Completed',
      size: `${(2.1 + Math.random() * 0.2).toFixed(1)} GB`,
      type: 'Manual',
      initiatedBy: 'SuperAdmin'
  };
  // In a real app, this would be handled by the backend, not stored in a local array.
  // For simulation, we can prepend to a static or fetched array if we decide to display it.
  return new Promise(resolve => setTimeout(() => resolve(newBackup), 2500)); // Simulate backup time
}
